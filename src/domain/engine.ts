/**
 * Pure business rules that change the Stage 1 database.
 * Every function mutates the `db` it receives; the repository passes in a copy and saves it.
 * All permission checks live here so that screens cannot bypass them.
 */
import { getCategory } from './categories';
import { firstName, normaliseLocation, SEVERITY_LABEL, STATUS_LABEL } from './labels';
import { transitionKind } from './lifecycle';
import * as N from './notifications';
import type {
  Audience,
  Broadcast,
  CategoryId,
  Complaint,
  Database,
  Message,
  Severity,
  Status,
  User,
} from './types';
import { LIMITS, validateDescription, validateLocation, validateRegister, type RegisterInput } from './validation';
import { canAddPeople, canChat, canViewComplaint, isInThread, unique } from './visibility';

export class DomainError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export interface Ctx {
  now: () => string;
  id: () => string;
}

function getUser(db: Database, id: string): User {
  const u = db.users.find((x) => x.id === id);
  if (!u) throw new DomainError('User not found');
  return u;
}

function getComplaintFor(db: Database, actor: User, complaintId: string): Complaint {
  const c = db.complaints.find((x) => x.id === complaintId);
  // Same error for "missing" and "not allowed" so hidden complaints do not leak.
  if (!c || !canViewComplaint(actor, c)) throw new DomainError('Complaint not found');
  return c;
}

function notify(db: Database, ctx: Ctx, drafts: N.NotificationDraft[]) {
  db.notifications.push(...N.materialise(drafts, ctx.now(), ctx.id));
}

function systemMessage(db: Database, ctx: Ctx, complaintId: string, text: string) {
  db.messages.push({ id: ctx.id(), complaintId, senderId: null, kind: 'system', text, createdAt: ctx.now() });
}

/** Admins who act on a complaint join its thread so they receive its updates. */
function joinAsWorker(actor: User, c: Complaint) {
  if (actor.role === 'admin' && !c.participantIds.includes(actor.id)) c.participantIds.push(actor.id);
}

function actorLabel(actor: User): string {
  return actor.role === 'admin' ? 'Admin' : firstName(actor.name);
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// ---------- Auth ----------

export function login(db: Database, username: string, password: string): User {
  const u = db.users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
  if (!u || u.password !== password) throw new DomainError('Wrong username or password');
  return u;
}

export function register(db: Database, ctx: Ctx, input: RegisterInput): User {
  const errors = validateRegister(input);
  const first = Object.entries(errors)[0];
  if (first) throw new DomainError(first[1] as string, first[0]);
  const username = input.username.trim();
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase()))
    throw new DomainError('This username is already taken', 'username');
  const user: User = {
    id: ctx.id(),
    username,
    password: input.password,
    name: input.name.trim(),
    mobile: input.mobile.trim(),
    industryName: input.industryName.trim(),
    plotNo: input.plotNo.trim(),
    role: 'member', // New accounts are always members.
    createdAt: ctx.now(),
  };
  db.users.push(user);
  return user;
}

// ---------- Complaints ----------

export interface NewComplaintInput {
  category: CategoryId;
  subCategory: string;
  location: string;
  description: string;
}

export function createComplaint(db: Database, ctx: Ctx, actorId: string, input: NewComplaintInput): Complaint {
  const actor = getUser(db, actorId);
  const cat = getCategory(input.category);
  if (!cat.subCategories.includes(input.subCategory)) throw new DomainError('Pick a sub category', 'subCategory');
  const locErr = validateLocation(input.location);
  if (locErr) throw new DomainError(locErr, 'location');
  const descErr = validateDescription(input.description);
  if (descErr) throw new DomainError(descErr, 'description');

  const now = ctx.now();
  const c: Complaint = {
    id: ctx.id(),
    number: db.nextComplaintNumber++,
    category: input.category,
    subCategory: input.subCategory,
    location: input.location.trim().replace(/\s+/g, ' '),
    locationKey: normaliseLocation(input.location),
    description: input.description.trim(),
    severity: null,
    status: 'open',
    createdBy: actor.id,
    participantIds: [actor.id],
    joinedByIds: [],
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    resolvedBy: null,
    chatDeleted: false,
  };
  db.complaints.push(c);
  systemMessage(db, ctx, c.id, `${actor.name} raised this complaint`);
  notify(db, ctx, [N.complaintRaised(db.users, actor, c)]);
  return c;
}

/** "Me too". Any member may join an active complaint found by the duplicate check. */
export function joinComplaint(db: Database, ctx: Ctx, actorId: string, complaintId: string): Complaint {
  const actor = getUser(db, actorId);
  const c = db.complaints.find((x) => x.id === complaintId);
  if (!c) throw new DomainError('Complaint not found');
  if (c.status === 'resolved') throw new DomainError('This complaint is already resolved');
  if (isInThread(actor.id, c)) return c;
  c.joinedByIds.push(actor.id);
  c.updatedAt = ctx.now();
  systemMessage(db, ctx, c.id, `${actor.name} also reported this`);
  notify(db, ctx, [N.complaintJoined(db.users, actor, c)]);
  return c;
}

export function addPeople(db: Database, ctx: Ctx, actorId: string, complaintId: string, userIds: string[]): string[] {
  const actor = getUser(db, actorId);
  const c = getComplaintFor(db, actor, complaintId);
  if (!canAddPeople(actor, c)) throw new DomainError('You cannot add people to this complaint');
  const added = unique(userIds).filter((id) => db.users.some((u) => u.id === id) && !isInThread(id, c));
  if (added.length === 0) throw new DomainError('Pick at least one new person');
  joinAsWorker(actor, c);
  c.participantIds.push(...added);
  c.updatedAt = ctx.now();
  const names = added.map((id) => firstName(getUser(db, id).name));
  systemMessage(db, ctx, c.id, `${actorLabel(actor)} added ${joinNames(names)} to this complaint`);
  notify(db, ctx, [N.peopleAdded(actor, c, added)]);
  return added;
}

export function setSeverity(db: Database, ctx: Ctx, actorId: string, complaintId: string, severity: Severity) {
  const actor = getUser(db, actorId);
  const c = getComplaintFor(db, actor, complaintId);
  if (actor.role !== 'admin') throw new DomainError('Only the admin can set severity');
  if (c.status === 'resolved') throw new DomainError('This complaint is already resolved');
  if (c.severity === severity) return;
  joinAsWorker(actor, c);
  c.severity = severity;
  c.updatedAt = ctx.now();
  systemMessage(db, ctx, c.id, `Severity set to ${SEVERITY_LABEL[severity]}`);
  notify(db, ctx, [N.severitySet(actor, c, SEVERITY_LABEL[severity])]);
}

/** Work moves: Open to In progress, In progress to Fixed. */
export function changeStatus(db: Database, ctx: Ctx, actorId: string, complaintId: string, to: Status) {
  const actor = getUser(db, actorId);
  const c = getComplaintFor(db, actor, complaintId);
  const kind = transitionKind(actor, c, to);
  if (kind === 'confirm' || kind === 'force_resolve') return resolveComplaint(db, ctx, actorId, complaintId);
  if (kind === 'reopen') throw new DomainError('Give a reason to reopen');
  if (kind === null) throw new DomainError(`You cannot move this complaint to ${STATUS_LABEL[to]}`);
  joinAsWorker(actor, c);
  c.status = to;
  c.updatedAt = ctx.now();
  systemMessage(db, ctx, c.id, `Status changed to ${STATUS_LABEL[to]} by ${actorLabel(actor)}`);
  notify(db, ctx, N.statusChanged(actor, c, to));
}

export function reopenComplaint(db: Database, ctx: Ctx, actorId: string, complaintId: string, reason: string) {
  const actor = getUser(db, actorId);
  const c = getComplaintFor(db, actor, complaintId);
  if (transitionKind(actor, c, 'in_progress') !== 'reopen') throw new DomainError('This complaint cannot be reopened');
  const why = reason.trim();
  if (why.length < LIMITS.reasonMin) throw new DomainError('Tell us why it is not fixed', 'reason');
  c.status = 'in_progress';
  c.updatedAt = ctx.now();
  systemMessage(db, ctx, c.id, `Reopened by ${actorLabel(actor)}. Reason: ${why}`);
  notify(db, ctx, [N.reopened(db.users, actor, c, why)]);
}

/**
 * Complainant confirms a fix, or an admin force resolves.
 * The entire chat (text and system messages) is hard deleted. The complaint record stays.
 */
export function resolveComplaint(db: Database, ctx: Ctx, actorId: string, complaintId: string) {
  const actor = getUser(db, actorId);
  const c = getComplaintFor(db, actor, complaintId);
  const kind = transitionKind(actor, c, 'resolved');
  if (kind !== 'confirm' && kind !== 'force_resolve') throw new DomainError('You cannot resolve this complaint');
  const now = ctx.now();
  c.status = 'resolved';
  c.updatedAt = now;
  c.resolvedAt = now;
  c.resolvedBy = actor.id;
  c.chatDeleted = true;
  db.messages = db.messages.filter((m) => m.complaintId !== c.id);
  notify(db, ctx, N.statusChanged(actor, c, 'resolved'));
}

export function sendMessage(db: Database, ctx: Ctx, actorId: string, complaintId: string, text: string): Message {
  const actor = getUser(db, actorId);
  const c = getComplaintFor(db, actor, complaintId);
  if (!canChat(actor, c)) throw new DomainError('This chat is closed');
  const body = text.trim();
  if (!body) throw new DomainError('Type a message');
  if (body.length > LIMITS.messageMax) throw new DomainError('Message is too long');
  joinAsWorker(actor, c);
  const m: Message = { id: ctx.id(), complaintId: c.id, senderId: actor.id, kind: 'text', text: body, createdAt: ctx.now() };
  db.messages.push(m);
  c.updatedAt = m.createdAt;
  notify(db, ctx, [N.newMessage(actor, c, body)]);
  return m;
}

// ---------- Notifications ----------

export interface BroadcastInput {
  title: string;
  body: string;
  audience: Audience;
  selectedIds?: string[];
  complaintId?: string | null;
}

export function broadcastRecipients(db: Database, actorId: string, input: BroadcastInput): string[] {
  return N.resolveAudience({
    users: db.users,
    complaints: db.complaints,
    audience: input.audience,
    senderId: actorId,
    selectedIds: input.selectedIds,
    complaintId: input.complaintId,
  });
}

export function sendBroadcast(db: Database, ctx: Ctx, actorId: string, input: BroadcastInput): Broadcast {
  const actor = getUser(db, actorId);
  if (actor.role !== 'admin') throw new DomainError('Only the admin can send notifications');
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new DomainError('Add a title', 'title');
  if (title.length > LIMITS.broadcastTitleMax) throw new DomainError('Title is too long', 'title');
  if (!body) throw new DomainError('Add a message', 'body');
  if (body.length > LIMITS.broadcastBodyMax) throw new DomainError('Message is too long', 'body');
  if (input.audience === 'complaint' && !db.complaints.some((c) => c.id === input.complaintId))
    throw new DomainError('Pick a complaint', 'audience');
  const recipientIds = broadcastRecipients(db, actorId, input);
  if (recipientIds.length === 0) throw new DomainError('Nobody will get this. Pick an audience.', 'audience');
  const b: Broadcast = {
    id: ctx.id(),
    sentBy: actor.id,
    title,
    body,
    audience: input.audience,
    recipientIds,
    complaintId: input.audience === 'complaint' ? (input.complaintId ?? null) : null,
    createdAt: ctx.now(),
  };
  db.broadcasts.push(b);
  notify(db, ctx, [
    { toUserIds: recipientIds, kind: 'custom', title, body, complaintId: b.complaintId, broadcastId: b.id },
  ]);
  return b;
}

export function markRead(db: Database, ctx: Ctx, userId: string, notificationId: string) {
  const n = db.notifications.find((x) => x.id === notificationId && x.toUserId === userId);
  if (n && !n.readAt) n.readAt = ctx.now();
}

export function markAllRead(db: Database, ctx: Ctx, userId: string) {
  const now = ctx.now();
  for (const n of db.notifications) if (n.toUserId === userId && !n.readAt) n.readAt = now;
}
