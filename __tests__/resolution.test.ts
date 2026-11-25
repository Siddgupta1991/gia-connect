import { describe, expect, it } from 'vitest';
import { LocalRepository, memoryStore } from '../src/data/localRepository';
import * as E from '../src/domain/engine';
import { seedDb, testCtx } from './helpers';

describe('resolving deletes the chat', () => {
  it('complainant confirm removes every message and keeps the record', () => {
    const db = seedDb();
    const ctx = testCtx();
    expect(db.messages.filter((m) => m.complaintId === 'c_101').length).toBeGreaterThan(0);
    const otherBefore = db.messages.filter((m) => m.complaintId !== 'c_101').length;

    E.resolveComplaint(db, ctx, 'u_member', 'c_101');

    const c = db.complaints.find((x) => x.id === 'c_101')!;
    expect(db.messages.filter((m) => m.complaintId === 'c_101')).toHaveLength(0);
    expect(db.messages.filter((m) => m.complaintId !== 'c_101')).toHaveLength(otherBefore);
    expect(c.status).toBe('resolved');
    expect(c.chatDeleted).toBe(true);
    expect(c.resolvedBy).toBe('u_member');
    expect(c.resolvedAt).not.toBeNull();
    expect(c.category).toBe('road');
    expect(c.location).toBe('Gate 2 Main Road');
  });

  it('admin force resolve deletes text and system messages', () => {
    const db = seedDb();
    const ctx = testCtx();
    E.sendMessage(db, ctx, 'u_member3', 'c_103', 'Any update please?');
    E.resolveComplaint(db, ctx, 'u_admin', 'c_103');
    expect(db.messages.some((m) => m.complaintId === 'c_103')).toBe(false);
  });

  it('no more chat after resolution', () => {
    const db = seedDb();
    const ctx = testCtx();
    E.resolveComplaint(db, ctx, 'u_admin', 'c_102');
    expect(() => E.sendMessage(db, ctx, 'u_member2', 'c_102', 'hello again')).toThrow('This chat is closed');
    expect(() => E.resolveComplaint(db, ctx, 'u_admin', 'c_102')).toThrow();
  });

  it('members and moderators cannot force resolve', () => {
    const db = seedDb();
    const ctx = testCtx();
    expect(() => E.resolveComplaint(db, ctx, 'u_moderator', 'c_103')).toThrow();
    expect(() => E.resolveComplaint(db, ctx, 'u_member', 'c_105')).toThrow();
  });

  it('messages are gone through the repository and after reload from storage', async () => {
    const store = memoryStore();
    const repo = new LocalRepository(store, testCtx());
    await repo.init();
    expect((await repo.listMessages('u_admin', 'c_105')).length).toBeGreaterThan(0);
    await repo.resolveComplaint('u_admin', 'c_105');
    expect(await repo.listMessages('u_admin', 'c_105')).toEqual([]);

    const reloaded = new LocalRepository(store, testCtx());
    await reloaded.init();
    expect(await reloaded.listMessages('u_admin', 'c_105')).toEqual([]);
    expect((await reloaded.getComplaint('u_admin', 'c_105'))?.chatDeleted).toBe(true);
  });
});
