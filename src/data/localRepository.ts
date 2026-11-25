import { findSimilar, locationSuggestions } from '../domain/duplicates';
import * as E from '../domain/engine';
import type { CategoryId, Complaint, Database, PublicUser, Severity, Status, User } from '../domain/types';
import type { RegisterInput } from '../domain/validation';
import { canViewComplaint, visibleComplaints } from '../domain/visibility';
import type { Repository } from './repository';
import { buildSeed, DB_VERSION } from './seed';

/** Minimal key value storage, so tests can run without AsyncStorage. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const DB_KEY = 'gia.db.v1';

export function memoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    async getItem(k) {
      return map.get(k) ?? null;
    },
    async setItem(k, v) {
      map.set(k, v);
    },
    async removeItem(k) {
      map.delete(k);
    },
  };
}

function toPublic(u: User): PublicUser {
  const { password: _password, ...rest } = u;
  return rest;
}

const byUpdatedDesc = (a: Complaint, b: Complaint) => b.updatedAt.localeCompare(a.updatedAt);

let counter = 0;
export const defaultCtx: E.Ctx = {
  now: () => new Date().toISOString(),
  id: () => `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 8)}`,
};

export class LocalRepository implements Repository {
  private db: Database | null = null;
  private listeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private store: KeyValueStore,
    private ctx: E.Ctx = defaultCtx,
  ) {}

  async init() {
    if (this.db) return;
    const raw = await this.store.getItem(DB_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Database;
        if (parsed.version === DB_VERSION) {
          this.db = parsed;
          return;
        }
      } catch {
        // Corrupt data. Fall through and reseed.
      }
    }
    this.db = buildSeed();
    await this.persist();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private get data(): Database {
    if (!this.db) throw new Error('Repository not initialised');
    return this.db;
  }

  private async persist() {
    await this.store.setItem(DB_KEY, JSON.stringify(this.db));
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  /** Applies a change to a copy, saves it, then swaps it in. Writes run one at a time. */
  private mutate<T>(fn: (draft: Database) => T): Promise<T> {
    const run = async () => {
      const draft = JSON.parse(JSON.stringify(this.data)) as Database;
      const result = fn(draft);
      this.db = draft;
      await this.persist();
      this.emit();
      return result;
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => undefined);
    return p;
  }

  private user(id: string): User {
    const u = this.data.users.find((x) => x.id === id);
    if (!u) throw new E.DomainError('User not found');
    return u;
  }

  // ---------- Auth and people ----------

  async login(username: string, password: string) {
    return toPublic(E.login(this.data, username, password));
  }

  async register(input: RegisterInput) {
    return toPublic(await this.mutate((d) => E.register(d, this.ctx, input)));
  }

  async getUser(id: string) {
    const u = this.data.users.find((x) => x.id === id);
    return u ? toPublic(u) : null;
  }

  async listUsers() {
    return this.data.users.map(toPublic).sort((a, b) => a.name.localeCompare(b.name));
  }

  // ---------- Complaints ----------

  async listComplaints(viewerId: string) {
    return visibleComplaints(this.user(viewerId), this.data.complaints).sort(byUpdatedDesc);
  }

  async getComplaint(viewerId: string, complaintId: string) {
    const c = this.data.complaints.find((x) => x.id === complaintId);
    return c && canViewComplaint(this.user(viewerId), c) ? c : null;
  }

  async findSimilar(viewerId: string, category: CategoryId, location: string) {
    this.user(viewerId);
    return findSimilar(this.data.complaints, category, location).filter(
      (c) => c.createdBy !== viewerId && !c.joinedByIds.includes(viewerId),
    );
  }

  async locationSuggestions() {
    return locationSuggestions(this.data.complaints);
  }

  createComplaint(actorId: string, input: E.NewComplaintInput) {
    return this.mutate((d) => E.createComplaint(d, this.ctx, actorId, input));
  }

  joinComplaint(actorId: string, complaintId: string) {
    return this.mutate((d) => E.joinComplaint(d, this.ctx, actorId, complaintId));
  }

  async addPeople(actorId: string, complaintId: string, userIds: string[]) {
    const added = await this.mutate((d) => E.addPeople(d, this.ctx, actorId, complaintId, userIds));
    return added.length;
  }

  setSeverity(actorId: string, complaintId: string, severity: Severity) {
    return this.mutate((d) => E.setSeverity(d, this.ctx, actorId, complaintId, severity));
  }

  changeStatus(actorId: string, complaintId: string, to: Status) {
    return this.mutate((d) => E.changeStatus(d, this.ctx, actorId, complaintId, to));
  }

  reopenComplaint(actorId: string, complaintId: string, reason: string) {
    return this.mutate((d) => E.reopenComplaint(d, this.ctx, actorId, complaintId, reason));
  }

  resolveComplaint(actorId: string, complaintId: string) {
    return this.mutate((d) => E.resolveComplaint(d, this.ctx, actorId, complaintId));
  }

  // ---------- Chat ----------

  async listMessages(viewerId: string, complaintId: string) {
    const c = await this.getComplaint(viewerId, complaintId);
    if (!c) return [];
    return this.data.messages
      .filter((m) => m.complaintId === complaintId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  sendMessage(actorId: string, complaintId: string, text: string) {
    return this.mutate((d) => E.sendMessage(d, this.ctx, actorId, complaintId, text));
  }

  // ---------- Notifications ----------

  async listNotifications(userId: string) {
    return this.data.notifications
      .filter((n) => n.toUserId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  markRead(userId: string, notificationId: string) {
    return this.mutate((d) => E.markRead(d, this.ctx, userId, notificationId));
  }

  markAllRead(userId: string) {
    return this.mutate((d) => E.markAllRead(d, this.ctx, userId));
  }

  async countRecipients(actorId: string, input: E.BroadcastInput) {
    return E.broadcastRecipients(this.data, actorId, input).length;
  }

  sendBroadcast(actorId: string, input: E.BroadcastInput) {
    return this.mutate((d) => E.sendBroadcast(d, this.ctx, actorId, input));
  }

  async listBroadcasts(actorId: string) {
    if (this.user(actorId).role !== 'admin') return [];
    return [...this.data.broadcasts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async broadcastReaders(actorId: string, broadcastId: string) {
    if (this.user(actorId).role !== 'admin') return [];
    return this.data.notifications.filter((n) => n.broadcastId === broadcastId && n.readAt).map((n) => n.toUserId);
  }

  async resetDemoData() {
    await this.mutate((d) => {
      Object.assign(d, buildSeed());
    });
  }
}
