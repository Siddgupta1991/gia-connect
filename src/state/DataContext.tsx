import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { repo } from '../data';
import type { AppNotification, Broadcast, Complaint, Message, PublicUser } from '../domain/types';
import { useMe } from './AuthContext';

interface DataValue {
  loading: boolean;
  users: PublicUser[];
  userById: (id: string | null) => PublicUser | undefined;
  complaints: Complaint[];
  notifications: AppNotification[];
  unreadCount: number;
  broadcasts: Broadcast[];
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataValue | null>(null);

/** Loads everything the signed in user may see and reloads whenever the repository changes. */
export function DataProvider({ children }: { children: ReactNode }) {
  const me = useMe();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  const refresh = useCallback(async () => {
    const [u, c, n, b] = await Promise.all([
      repo.listUsers(),
      repo.listComplaints(me.id),
      repo.listNotifications(me.id),
      me.role === 'admin' ? repo.listBroadcasts(me.id) : Promise.resolve([]),
    ]);
    setUsers(u);
    setComplaints(c);
    setNotifications(n);
    setBroadcasts(b);
    setLoading(false);
  }, [me.id, me.role]);

  useEffect(() => {
    // refresh only sets state after awaiting the repository, so this does not render synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    return repo.subscribe(() => {
      refresh();
    });
  }, [refresh]);

  const value = useMemo<DataValue>(() => {
    const map = new Map(users.map((u) => [u.id, u]));
    return {
      loading,
      users,
      userById: (id) => (id ? map.get(id) : undefined),
      complaints,
      notifications,
      unreadCount: notifications.filter((n) => !n.readAt).length,
      broadcasts,
      refresh,
    };
  }, [loading, users, complaints, notifications, broadcasts, refresh]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const v = useContext(DataContext);
  if (!v) throw new Error('useData outside DataProvider');
  return v;
}

export function useComplaint(id: string): Complaint | undefined {
  return useData().complaints.find((c) => c.id === id);
}

export function useMessages(complaintId: string): { messages: Message[]; loading: boolean } {
  const me = useMe();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const m = await repo.listMessages(me.id, complaintId);
      if (alive) {
        setMessages(m);
        setLoading(false);
      }
    };
    load();
    const unsub = repo.subscribe(load);
    return () => {
      alive = false;
      unsub();
    };
  }, [complaintId, me.id]);
  return { messages, loading };
}

/** Turns any thrown error into a short message for the user. */
export function errorText(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'Something went wrong. Please try again.';
}
