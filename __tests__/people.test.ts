import { describe, expect, it } from 'vitest';
import * as E from '../src/domain/engine';
import { seedDb, testCtx } from './helpers';

describe('adding people to a complaint', () => {
  it('updates participants, writes a system message and notifies each person', () => {
    const db = seedDb();
    const ctx = testCtx();
    const added = E.addPeople(db, ctx, 'u_admin', 'c_102', ['u_moderator', 'u_member3']);
    expect(added).toEqual(['u_moderator', 'u_member3']);

    const c = db.complaints.find((x) => x.id === 'c_102')!;
    expect(c.participantIds).toEqual(expect.arrayContaining(['u_member2', 'u_moderator', 'u_member3', 'u_admin']));

    const sys = db.messages.filter((m) => m.complaintId === 'c_102' && m.kind === 'system').map((m) => m.text);
    expect(sys).toContain('Admin added Ramesh and Imran to this complaint');

    const notes = db.notifications.filter((n) => n.kind === 'added_to_complaint' && n.complaintId === 'c_102');
    expect(notes.map((n) => n.toUserId).sort()).toEqual(['u_member3', 'u_moderator']);
    expect(notes[0].title).toBe('You were added to #102');
  });

  it('a moderator added to a thread can add others', () => {
    const db = seedDb();
    const ctx = testCtx();
    E.addPeople(db, ctx, 'u_moderator', 'c_103', ['u_member4']);
    const sys = db.messages.filter((m) => m.complaintId === 'c_103').map((m) => m.text);
    expect(sys).toContain('Ramesh added Deepak to this complaint');
  });

  it('someone outside the thread cannot add people', () => {
    const db = seedDb();
    expect(() => E.addPeople(db, testCtx(), 'u_member4', 'c_101', ['u_member3'])).toThrow();
  });

  it('skips people already in the thread', () => {
    const db = seedDb();
    expect(() => E.addPeople(db, testCtx(), 'u_admin', 'c_101', ['u_member', 'u_moderator'])).toThrow(
      'Pick at least one new person',
    );
  });
});
