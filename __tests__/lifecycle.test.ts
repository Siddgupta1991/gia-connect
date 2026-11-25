import { describe, expect, it } from 'vitest';
import * as E from '../src/domain/engine';
import { canTransition, sheetStatusOptions } from '../src/domain/lifecycle';
import { admin, makeComplaint, member, moderator, seedDb, testCtx } from './helpers';

describe('status moves', () => {
  const withMod = (status: 'open' | 'in_progress' | 'fixed' | 'resolved') =>
    makeComplaint({ status, participantIds: ['u_member', 'u_moderator'] });

  it('allows the documented moves', () => {
    expect(canTransition(admin, withMod('open'), 'in_progress')).toBe(true);
    expect(canTransition(moderator, withMod('open'), 'in_progress')).toBe(true);
    expect(canTransition(moderator, withMod('in_progress'), 'fixed')).toBe(true);
    expect(canTransition(member, withMod('fixed'), 'resolved')).toBe(true);
    expect(canTransition(member, withMod('fixed'), 'in_progress')).toBe(true);
    expect(canTransition(admin, withMod('open'), 'resolved')).toBe(true);
    expect(canTransition(admin, withMod('in_progress'), 'resolved')).toBe(true);
  });

  it('blocks everything else', () => {
    expect(canTransition(admin, withMod('open'), 'fixed')).toBe(false);
    expect(canTransition(member, withMod('open'), 'in_progress')).toBe(false);
    expect(canTransition(member, withMod('in_progress'), 'fixed')).toBe(false);
    expect(canTransition(member, withMod('in_progress'), 'resolved')).toBe(false);
    expect(canTransition(moderator, withMod('fixed'), 'resolved')).toBe(false);
    expect(canTransition(moderator, withMod('open'), 'resolved')).toBe(false);
    expect(canTransition(admin, withMod('resolved'), 'open')).toBe(false);
    expect(canTransition(admin, withMod('resolved'), 'in_progress')).toBe(false);
    expect(canTransition(admin, withMod('in_progress'), 'open')).toBe(false);
  });

  it('moderator not added to the complaint cannot move it', () => {
    expect(canTransition(moderator, makeComplaint({ status: 'open' }), 'in_progress')).toBe(false);
  });

  it('status sheet offers only forward work moves', () => {
    expect(sheetStatusOptions(admin, withMod('open'))).toEqual(['in_progress']);
    expect(sheetStatusOptions(moderator, withMod('in_progress'))).toEqual(['fixed']);
    expect(sheetStatusOptions(member, withMod('open'))).toEqual([]);
  });

  it('engine rejects blocked moves and requires a reason to reopen', () => {
    const db = seedDb();
    const ctx = testCtx();
    expect(() => E.changeStatus(db, ctx, 'u_member2', 'c_102', 'in_progress')).toThrow();
    expect(() => E.reopenComplaint(db, ctx, 'u_member', 'c_101', '')).toThrow('Tell us why');
    E.reopenComplaint(db, ctx, 'u_member', 'c_101', 'Still a hole near the gate');
    const c = db.complaints.find((x) => x.id === 'c_101')!;
    expect(c.status).toBe('in_progress');
    const admins = db.notifications.filter((n) => n.title === '#101 was reopened').map((n) => n.toUserId);
    expect(admins).toContain('u_admin');
    expect(admins).not.toContain('u_member');
  });
});
