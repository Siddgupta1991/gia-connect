import { describe, expect, it } from 'vitest';
import { LocalRepository, memoryStore } from '../src/data/localRepository';
import * as E from '../src/domain/engine';
import * as N from '../src/domain/notifications';
import { admin, makeComplaint, member, moderator, seedDb, testCtx } from './helpers';

const users = [admin, member, moderator, { id: 'u_member2', role: 'member' as const, name: 'Sunita' }];

describe('notification targeting never includes the actor', () => {
  const c = makeComplaint({ participantIds: ['u_member', 'u_moderator', 'u_admin'] });

  it('complaint raised goes to admins only', () => {
    expect(N.complaintRaised(users, member, c).toUserIds).toEqual(['u_admin']);
    expect(N.complaintRaised(users, admin, c).toUserIds).toEqual([]);
  });

  it('status change skips the actor', () => {
    const drafts = N.statusChanged(moderator, c, 'in_progress');
    const all = drafts.flatMap((d) => d.toUserIds);
    expect(all).not.toContain('u_moderator');
    expect(all).toEqual(expect.arrayContaining(['u_member', 'u_admin']));
  });

  it('fixed asks the complainant to confirm', () => {
    const drafts = N.statusChanged(moderator, c, 'fixed');
    const confirm = drafts.find((d) => d.title.startsWith('Please confirm'));
    expect(confirm?.toUserIds).toEqual(['u_member']);
    expect(drafts.flatMap((d) => d.toUserIds)).not.toContain('u_moderator');
  });

  it('new message skips the sender', () => {
    expect(N.newMessage(member, c, 'hi').toUserIds).not.toContain('u_member');
  });

  it('added people never includes the adder', () => {
    expect(N.peopleAdded(admin, c, ['u_admin', 'u_member2']).toUserIds).toEqual(['u_member2']);
  });

  it('no engine action ever notifies its own actor', () => {
    const db = seedDb();
    const ctx = testCtx();
    const check = (actorId: string, fn: () => void) => {
      const before = db.notifications.length;
      fn();
      const created = db.notifications.slice(before);
      expect(created.some((n) => n.toUserId === actorId)).toBe(false);
    };
    check('u_member4', () =>
      E.createComplaint(db, ctx, 'u_member4', {
        category: 'water', subCategory: 'No supply', location: 'Plot 48', description: 'No water since two days',
      }),
    );
    check('u_admin', () => E.setSeverity(db, ctx, 'u_admin', 'c_102', 'high'));
    check('u_admin', () => E.changeStatus(db, ctx, 'u_admin', 'c_102', 'in_progress'));
    check('u_member2', () => E.sendMessage(db, ctx, 'u_member2', 'c_102', 'Thank you'));
    check('u_member3', () => E.joinComplaint(db, ctx, 'u_member3', 'c_102'));
    check('u_admin', () => E.resolveComplaint(db, ctx, 'u_admin', 'c_102'));
    check('u_admin', () => E.sendBroadcast(db, ctx, 'u_admin', { title: 'Hi', body: 'Meeting at 5', audience: 'everyone' }));
  });
});

describe('broadcast audience', () => {
  const db = seedDb();
  const resolve = (audience: Parameters<typeof N.resolveAudience>[0]['audience'], extra = {}) =>
    N.resolveAudience({ users: db.users, complaints: db.complaints, audience, senderId: 'u_admin', ...extra }).sort();

  it('everyone excludes the sender', () => {
    expect(resolve('everyone')).toEqual(['u_member', 'u_member2', 'u_member3', 'u_member4', 'u_moderator']);
  });

  it('members and moderators', () => {
    expect(resolve('members')).toEqual(['u_member', 'u_member2', 'u_member3', 'u_member4']);
    expect(resolve('moderators')).toEqual(['u_moderator']);
  });

  it('selected people, ignoring unknown ids and the sender', () => {
    expect(resolve('selected', { selectedIds: ['u_member3', 'nobody', 'u_admin', 'u_member3'] })).toEqual(['u_member3']);
  });

  it('everyone in one complaint', () => {
    expect(resolve('complaint', { complaintId: 'c_103' })).toEqual(['u_member3', 'u_moderator']);
    expect(resolve('complaint', { complaintId: 'missing' })).toEqual([]);
  });

  it('sending stores the broadcast, notifications and read counts', async () => {
    const repo = new LocalRepository(memoryStore(), testCtx());
    await repo.init();
    expect(await repo.countRecipients('u_admin', { title: 't', body: 'b', audience: 'moderators' })).toBe(1);
    const b = await repo.sendBroadcast('u_admin', { title: 'Water cut', body: 'No supply on Sunday 9 to 1', audience: 'members' });
    expect(b.recipientIds).toHaveLength(4);
    const inbox = await repo.listNotifications('u_member2');
    const n = inbox.find((x) => x.broadcastId === b.id)!;
    expect(n.title).toBe('Water cut');
    await repo.markRead('u_member2', n.id);
    expect(await repo.broadcastReaders('u_admin', b.id)).toEqual(['u_member2']);
    await expect(repo.sendBroadcast('u_member', { title: 'x', body: 'y', audience: 'everyone' })).rejects.toThrow();
  });
});
