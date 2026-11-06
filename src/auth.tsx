import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import api, { setUnauthorizedHandler, type AuthUser } from '@/api';
import { deleteItem, getItem, setItem } from '@/secure-storage';

type AuthValue = {
  user: AuthUser | null;
  /** False until the persisted session has been read — the gate waits on this. */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = use(AuthCtx);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await getItem('user');
        if (raw) setUser(JSON.parse(raw) as AuthUser);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (token: string, nextUser: AuthUser) => {
    await setItem('token', token);
    await setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      });
      await persist(data.token, data.user);
    },
    [persist]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/register', {
        name,
        email,
        password,
      });
      await persist(data.token, data.user);
    },
    [persist]
  );

  const logout = useCallback(async () => {
    await deleteItem('token');
    await deleteItem('user');
    setUser(null);
  }, []);

  // A dead token signs the student out; the tab layout then redirects to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout]
  );

  return <AuthCtx value={value}>{children}</AuthCtx>;
}
