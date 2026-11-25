import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { repo, SESSION_KEY, sessionStore } from '../data';
import type { PublicUser } from '../domain/types';
import type { RegisterInput } from '../domain/validation';

interface AuthValue {
  ready: boolean;
  user: PublicUser | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await repo.init();
        const id = await sessionStore.getItem(SESSION_KEY);
        const u = id ? await repo.getUser(id) : null;
        if (alive) setUser(u);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const u = await repo.login(username, password);
    await sessionStore.setItem(SESSION_KEY, u.id);
    setUser(u);
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const u = await repo.register(input);
    await sessionStore.setItem(SESSION_KEY, u.id);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    await sessionStore.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const resetDemo = useCallback(async () => {
    await repo.resetDemoData();
    await sessionStore.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ ready, user, signIn, signUp, signOut, resetDemo }), [ready, user, signIn, signUp, signOut, resetDemo]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}

/** For screens that only render when signed in. */
export function useMe(): PublicUser {
  const { user } = useAuth();
  if (!user) throw new Error('Not signed in');
  return user;
}
