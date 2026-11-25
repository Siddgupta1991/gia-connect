import type { BroadcastInput, NewComplaintInput } from '../domain/engine';
import type {
  AppNotification,
  Broadcast,
  CategoryId,
  Complaint,
  Message,
  PublicUser,
  Severity,
  Status,
} from '../domain/types';
import type { RegisterInput } from '../domain/validation';

/**
 * Every data operation used by the screens.
 * Stage 1 is implemented by LocalRepository (AsyncStorage on the phone).
 * Stage 2 can swap in a SupabaseRepository with the same shape, without touching screens.
 *
 * `actorId` / `viewerId` is the signed in user. A server implementation would take it from the
 * auth session instead and ignore the argument.
 */
export interface Repository {
  init(): Promise<void>;
  /** Called after any change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;

  // Auth and people
  login(username: string, password: string): Promise<PublicUser>;
  register(input: RegisterInput): Promise<PublicUser>;
  getUser(id: string): Promise<PublicUser | null>;
  listUsers(): Promise<PublicUser[]>;

  // Complaints (visibility rule applied here)
  listComplaints(viewerId: string): Promise<Complaint[]>;
  getComplaint(viewerId: string, complaintId: string): Promise<Complaint | null>;
  findSimilar(viewerId: string, category: CategoryId, location: string): Promise<Complaint[]>;
  locationSuggestions(): Promise<string[]>;
  createComplaint(actorId: string, input: NewComplaintInput): Promise<Complaint>;
  joinComplaint(actorId: string, complaintId: string): Promise<Complaint>;
  addPeople(actorId: string, complaintId: string, userIds: string[]): Promise<number>;
  setSeverity(actorId: string, complaintId: string, severity: Severity): Promise<void>;
  changeStatus(actorId: string, complaintId: string, to: Status): Promise<void>;
  reopenComplaint(actorId: string, complaintId: string, reason: string): Promise<void>;
  /** Resolves and permanently deletes the whole chat of the complaint. */
  resolveComplaint(actorId: string, complaintId: string): Promise<void>;

  // Chat
  listMessages(viewerId: string, complaintId: string): Promise<Message[]>;
  sendMessage(actorId: string, complaintId: string, text: string): Promise<Message>;

  // Notifications
  listNotifications(userId: string): Promise<AppNotification[]>;
  markRead(userId: string, notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  countRecipients(actorId: string, input: BroadcastInput): Promise<number>;
  sendBroadcast(actorId: string, input: BroadcastInput): Promise<Broadcast>;
  listBroadcasts(actorId: string): Promise<Broadcast[]>;
  /** User ids of recipients who have read a broadcast. Admin only. */
  broadcastReaders(actorId: string, broadcastId: string): Promise<string[]>;

  /** Stage 1 only. Wipes the phone data and loads the seed again. */
  resetDemoData(): Promise<void>;
}
