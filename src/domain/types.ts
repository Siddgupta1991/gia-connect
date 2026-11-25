export type Role = 'member' | 'moderator' | 'admin';

export interface User {
  id: string;
  username: string;
  password: string; // plain text only in Stage 1 demo data
  name: string;
  mobile: string;
  industryName: string;
  plotNo: string;
  role: Role;
  createdAt: string;
}

export type CategoryId = 'road' | 'water' | 'dead_animal' | 'parking' | 'other';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'open' | 'in_progress' | 'fixed' | 'resolved';

export interface Complaint {
  id: string;
  number: number; // human friendly, shown as #101
  category: CategoryId;
  subCategory: string;
  location: string; // free text, normalised for matching
  locationKey: string; // lowercase, trimmed, collapsed spaces
  description: string;
  severity: Severity | null; // null until admin sets it
  status: Status;
  createdBy: string; // user id
  participantIds: string[]; // includes creator, plus added people. Admins always have access.
  joinedByIds: string[]; // members who joined as "me too"
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  chatDeleted: boolean;
}

export interface Message {
  id: string;
  complaintId: string;
  senderId: string | null; // null for system messages
  kind: 'text' | 'system';
  text: string;
  createdAt: string;
}

export type NotificationKind =
  | 'complaint_raised'
  | 'added_to_complaint'
  | 'status_changed'
  | 'new_message'
  | 'custom';

export interface AppNotification {
  id: string;
  toUserId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  complaintId: string | null;
  createdAt: string;
  readAt: string | null;
  broadcastId: string | null;
}

export type Audience = 'everyone' | 'members' | 'moderators' | 'selected' | 'complaint';

export interface Broadcast {
  id: string;
  sentBy: string;
  title: string;
  body: string;
  audience: Audience;
  recipientIds: string[];
  complaintId: string | null;
  createdAt: string;
}

/** The whole Stage 1 data set, as stored on the phone. */
export interface Database {
  version: number;
  users: User[];
  complaints: Complaint[];
  messages: Message[];
  notifications: AppNotification[];
  broadcasts: Broadcast[];
  nextComplaintNumber: number;
}

/** A user without the password, safe to hand to screens. */
export type PublicUser = Omit<User, 'password'>;
