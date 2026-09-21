import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import func2url from '../../backend/func2url.json';

const AUTH_URL = func2url.auth;
const TOKEN_KEY = 'nicedrop_token';

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  balance: number;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  register: (data: { email: string; nickname: string; password: string }) => Promise<string>;
  login: (data: { email: string; password: string }) => Promise<string>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

const writeToken = (token: string) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* хранилище недоступно — работаем в рамках сессии */
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = readToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(AUTH_URL, { headers: { 'X-Auth-Token': token } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setUser(d.user))
      .catch(() => writeToken(''))
      .finally(() => setLoading(false));
  }, []);

  const send = useCallback(
    async (action: string, payload: Record<string, string>): Promise<string> => {
      try {
        const res = await fetch(`${AUTH_URL}?action=${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) return data.error || 'Не удалось выполнить запрос';
        writeToken(data.token);
        setUser(data.user);
        return '';
      } catch {
        return 'Сервис временно недоступен, попробуйте позже';
      }
    },
    [],
  );

  const register = useCallback(
    (d: { email: string; nickname: string; password: string }) => send('register', d),
    [send],
  );

  const login = useCallback(
    (d: { email: string; password: string }) => send('login', d),
    [send],
  );

  const logout = useCallback(() => {
    const token = readToken();
    writeToken('');
    setUser(null);
    if (token) {
      fetch(`${AUTH_URL}?action=logout`, {
        method: 'POST',
        headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
        body: '{}',
      }).catch(() => undefined);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, register, login, logout }),
    [user, loading, register, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
