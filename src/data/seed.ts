import { normaliseLocation } from '../domain/labels';
import type { AppNotification, Complaint, Database, Message, User } from '../domain/types';

export const DB_VERSION = 1;

/**
 * Demo accounts for Stage 1. CHANGE OR REMOVE THESE BEFORE REAL USE.
 */
export const SEED_USERS: Omit<User, 'createdAt'>[] = [
  { id: 'u_admin', username: 'admin', password: 'Admin@123', name: 'Vijay Gaur', mobile: '9800000001', industryName: 'GIA President Office', plotNo: 'GIA-1', role: 'admin' },
  { id: 'u_member', username: 'member', password: 'Member@123', name: 'Anil Sharma', mobile: '9800000002', industryName: 'Sharma Auto Components', plotNo: '12-B', role: 'member' },
  { id: 'u_moderator', username: 'moderator', password: 'Moderator@123', name: 'Ramesh Patel', mobile: '9800000003', industryName: 'Patel Engineering', plotNo: '7-A', role: 'moderator' },
  { id: 'u_member2', username: 'member2', password: 'Member@123', name: 'Sunita Verma', mobile: '9800000004', industryName: 'Verma Plastics', plotNo: '21', role: 'member' },
  { id: 'u_member3', username: 'member3', password: 'Member@123', name: 'Imran Khan', mobile: '9800000005', industryName: 'Khan Steel Works', plotNo: '33-C', role: 'member' },
  { id: 'u_member4', username: 'member4', password: 'Member@123', name: 'Deepak Joshi', mobile: '9800000006', industryName: 'Joshi Packaging', plotNo: '48', role: 'member' },
];

export function buildSeed(nowMs: number = Date.now()): Database {
  const ago = (hours: number) => new Date(nowMs - hours * 3600_000).toISOString();

  const users: User[] = SEED_USERS.map((u) => ({ ...u, createdAt: ago(24 * 30) }));

  const base = (
    c: Omit<Complaint, 'locationKey' | 'joinedByIds' | 'resolvedAt' | 'resolvedBy' | 'chatDeleted'> &
      Partial<Pick<Complaint, 'joinedByIds' | 'resolvedAt' | 'resolvedBy' | 'chatDeleted'>>,
  ): Complaint => ({
    joinedByIds: [],
    resolvedAt: null,
    resolvedBy: null,
    chatDeleted: false,
    ...c,
    locationKey: normaliseLocation(c.location),
  });

  const complaints: Complaint[] = [
    base({
      id: 'c_101', number: 101, category: 'road', subCategory: 'Pothole', location: 'Gate 2 Main Road',
      description: 'Big pothole right at the entry of Gate 2. Trucks are getting stuck and two bikes fell last week.',
      severity: 'high', status: 'fixed', createdBy: 'u_member',
      participantIds: ['u_member', 'u_admin', 'u_moderator'], createdAt: ago(72), updatedAt: ago(3),
    }),
    base({
      id: 'c_102', number: 102, category: 'road', subCategory: 'Pothole', location: 'Gate 2 main road',
      description: 'Another deep pothole about 50 metres inside Gate 2, near the tea stall. Fills with water in rain.',
      severity: null, status: 'open', createdBy: 'u_member2',
      participantIds: ['u_member2'], createdAt: ago(20), updatedAt: ago(20),
    }),
    base({
      id: 'c_103', number: 103, category: 'water', subCategory: 'Pipe leakage', location: 'Near Water Tank',
      description: 'Main supply pipe is leaking near the overhead tank. Water is flowing on the road since morning.',
      severity: 'critical', status: 'in_progress', createdBy: 'u_member3',
      participantIds: ['u_member3', 'u_admin', 'u_moderator'], createdAt: ago(30), updatedAt: ago(5),
    }),
    base({
      id: 'c_104', number: 104, category: 'parking', subCategory: 'Blocking a gate', location: 'Near water tank',
      description: 'A trailer is parked in front of our gate every night. Our morning shift cannot get in.',
      severity: 'medium', status: 'open', createdBy: 'u_member4',
      participantIds: ['u_member4', 'u_admin'], createdAt: ago(10), updatedAt: ago(8),
    }),
    base({
      id: 'c_105', number: 105, category: 'dead_animal', subCategory: 'On the road', location: 'Sector B Lane 4',
      description: 'Dead dog on the road near the transformer. Bad smell, please arrange pickup soon.',
      severity: 'high', status: 'in_progress', createdBy: 'u_member',
      participantIds: ['u_member', 'u_admin', 'u_moderator'], createdAt: ago(9), updatedAt: ago(2),
    }),
    base({
      id: 'c_106', number: 106, category: 'water', subCategory: 'Low pressure', location: 'Plot 45 Phase 1',
      description: 'Very low water pressure in the morning hours for the last week.',
      severity: 'low', status: 'resolved', createdBy: 'u_member2',
      participantIds: ['u_member2', 'u_admin'], createdAt: ago(24 * 6), updatedAt: ago(24 * 2),
      resolvedAt: ago(24 * 2), resolvedBy: 'u_admin', chatDeleted: true,
    }),
  ];

  let mid = 0;
  const msg = (complaintId: string, senderId: string | null, text: string, hoursAgo: number): Message => ({
    id: `m_seed_${++mid}`,
    complaintId,
    senderId,
    kind: senderId ? 'text' : 'system',
    text,
    createdAt: ago(hoursAgo),
  });

  const messages: Message[] = [
    msg('c_101', null, 'Anil Sharma raised this complaint', 72),
    msg('c_101', 'u_member', 'Please look at this soon, our dispatch trucks use this gate.', 71.5),
    msg('c_101', null, 'Severity set to High', 60),
    msg('c_101', null, 'Admin added Ramesh to this complaint', 60),
    msg('c_101', 'u_admin', 'Ramesh, please speak to the road contractor.', 59.8),
    msg('c_101', null, 'Status changed to In progress by Ramesh', 48),
    msg('c_101', 'u_moderator', 'Contractor has started filling it today.', 30),
    msg('c_101', null, 'Status changed to Fixed by Ramesh', 3),
    msg('c_102', null, 'Sunita Verma raised this complaint', 20),
    msg('c_103', null, 'Imran Khan raised this complaint', 30),
    msg('c_103', null, 'Severity set to Critical', 28),
    msg('c_103', null, 'Admin added Ramesh to this complaint', 28),
    msg('c_103', 'u_moderator', 'Spoke to the water department. Team will come by evening.', 6),
    msg('c_103', null, 'Status changed to In progress by Ramesh', 5),
    msg('c_104', null, 'Deepak Joshi raised this complaint', 10),
    msg('c_104', null, 'Severity set to Medium', 8),
    msg('c_105', null, 'Anil Sharma raised this complaint', 9),
    msg('c_105', null, 'Severity set to High', 8.5),
    msg('c_105', null, 'Admin added Ramesh to this complaint', 8.5),
    msg('c_105', null, 'Status changed to In progress by Ramesh', 2),
    msg('c_105', 'u_moderator', 'Nagar Nigam van is on the way.', 1.9),
  ];

  let nid = 0;
  const note = (
    toUserId: string,
    kind: AppNotification['kind'],
    title: string,
    body: string,
    complaintId: string | null,
    hoursAgo: number,
    read = false,
  ): AppNotification => ({
    id: `n_seed_${++nid}`,
    toUserId,
    kind,
    title,
    body,
    complaintId,
    createdAt: ago(hoursAgo),
    readAt: read ? ago(hoursAgo - 0.1) : null,
    broadcastId: null,
  });

  const notifications: AppNotification[] = [
    note('u_admin', 'complaint_raised', 'New complaint #101', 'Anil Sharma reported Pothole at Gate 2 Main Road', 'c_101', 72, true),
    note('u_admin', 'complaint_raised', 'New complaint #102', 'Sunita Verma reported Pothole at Gate 2 main road', 'c_102', 20),
    note('u_admin', 'complaint_raised', 'New complaint #103', 'Imran Khan reported Pipe leakage at Near Water Tank', 'c_103', 30, true),
    note('u_admin', 'complaint_raised', 'New complaint #104', 'Deepak Joshi reported Blocking a gate at Near water tank', 'c_104', 10),
    note('u_admin', 'complaint_raised', 'New complaint #105', 'Anil Sharma reported On the road at Sector B Lane 4', 'c_105', 9),
    note('u_moderator', 'added_to_complaint', 'You were added to #101', 'Vijay Gaur added you to a road issue', 'c_101', 60, true),
    note('u_moderator', 'added_to_complaint', 'You were added to #103', 'Vijay Gaur added you to a water issue', 'c_103', 28),
    note('u_moderator', 'added_to_complaint', 'You were added to #105', 'Vijay Gaur added you to a dead animal issue', 'c_105', 8.5),
    note('u_member', 'status_changed', '#105 is now In progress', 'On the road at Sector B Lane 4', 'c_105', 2),
    note('u_member', 'status_changed', 'Please confirm the fix for #101', 'Ramesh Patel says this pothole issue is fixed. Tap to confirm or reopen.', 'c_101', 3),
    note('u_member2', 'status_changed', '#106 is now Resolved', 'Low pressure at Plot 45 Phase 1', 'c_106', 48, true),
  ];

  return {
    version: DB_VERSION,
    users,
    complaints,
    messages,
    notifications,
    broadcasts: [],
    nextComplaintNumber: 107,
  };
}
