import type { Complaint, User } from './types';

type Viewer = Pick<User, 'id' | 'role'>;

/** True when the user is part of the complaint thread (raised it, joined it or was added). */
export function isInThread(userId: string, complaint: Complaint): boolean {
  return (
    complaint.createdBy === userId ||
    complaint.participantIds.includes(userId) ||
    complaint.joinedByIds.includes(userId)
  );
}

/**
 * Section 5 rule. A complaint is visible to the member who raised it, every admin,
 * and anyone added to it. Moderators see nothing by default.
 */
export function canViewComplaint(user: Viewer, complaint: Complaint): boolean {
  if (user.role === 'admin') return true;
  return isInThread(user.id, complaint);
}

export function visibleComplaints(user: Viewer, complaints: Complaint[]): Complaint[] {
  return complaints.filter((c) => canViewComplaint(user, c));
}

/** Anyone already in the thread (and every admin) may add people while the complaint is not resolved. */
export function canAddPeople(user: Viewer, complaint: Complaint): boolean {
  return complaint.status !== 'resolved' && canViewComplaint(user, complaint);
}

export function canChat(user: Viewer, complaint: Complaint): boolean {
  return complaint.status !== 'resolved' && !complaint.chatDeleted && canViewComplaint(user, complaint);
}

/** Everyone who belongs to the thread, without duplicates. Admins are not included unless added. */
export function threadMemberIds(complaint: Complaint): string[] {
  return unique([complaint.createdBy, ...complaint.participantIds, ...complaint.joinedByIds]);
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
