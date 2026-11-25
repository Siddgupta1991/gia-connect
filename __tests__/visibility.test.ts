import { describe, expect, it } from 'vitest';
import { LocalRepository, memoryStore } from '../src/data/localRepository';
import { canAddPeople, canChat, canViewComplaint, visibleComplaints } from '../src/domain/visibility';
import { admin, makeComplaint, member, member2, moderator, testCtx } from './helpers';

describe('visibility rule', () => {
  const c = makeComplaint();

  it('complainant sees their own complaint', () => {
    expect(canViewComplaint(member, c)).toBe(true);
  });

  it('other members cannot see it', () => {
    expect(canViewComplaint(member2, c)).toBe(false);
  });

  it('every admin sees it', () => {
    expect(canViewComplaint(admin, c)).toBe(true);
    expect(canViewComplaint({ id: 'other_admin', role: 'admin' }, c)).toBe(true);
  });

  it('moderators see nothing by default', () => {
    expect(canViewComplaint(moderator, c)).toBe(false);
  });

  it('moderator sees it once added', () => {
    const added = makeComplaint({ participantIds: ['u_member', 'u_moderator'] });
    expect(canViewComplaint(moderator, added)).toBe(true);
  });

  it('members who joined see it', () => {
    const joined = makeComplaint({ joinedByIds: ['u_member2'] });
    expect(canViewComplaint(member2, joined)).toBe(true);
  });

  it('visibleComplaints filters a list', () => {
    const list = [makeComplaint({ id: 'a' }), makeComplaint({ id: 'b', createdBy: 'u_member2', participantIds: ['u_member2'] })];
    expect(visibleComplaints(member, list).map((x) => x.id)).toEqual(['a']);
    expect(visibleComplaints(moderator, list)).toEqual([]);
    expect(visibleComplaints(admin, list)).toHaveLength(2);
  });

  it('no chat and no adding people once resolved', () => {
    const r = makeComplaint({ status: 'resolved', chatDeleted: true });
    expect(canChat(member, r)).toBe(false);
    expect(canAddPeople(admin, r)).toBe(false);
  });

  it('is enforced in the repository data layer', async () => {
    const repo = new LocalRepository(memoryStore(), testCtx());
    await repo.init();
    const forMod = await repo.listComplaints('u_moderator');
    expect(forMod.every((x) => x.participantIds.includes('u_moderator'))).toBe(true);
    const forMember4 = await repo.listComplaints('u_member4');
    expect(forMember4.map((x) => x.number)).toEqual([104]);
    expect(await repo.getComplaint('u_member4', 'c_101')).toBeNull();
    expect(await repo.listMessages('u_member4', 'c_101')).toEqual([]);
    expect((await repo.listComplaints('u_admin')).length).toBe(6);
    await expect(repo.sendMessage('u_member4', 'c_101', 'hello there')).rejects.toThrow('Complaint not found');
  });
});
