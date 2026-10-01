import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { apiUrl } from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AUTH_TOKEN_KEY = 'k.auth.token';
const AUTH_USER_KEY = 'k.auth.user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isUserShape(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.fullName === 'string' &&
    Array.isArray(candidate.roles) &&
    candidate.roles.every((role) => typeof role === 'string')
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      // The cached profile must be structurally valid before it is trusted,
      // even optimistically. A missing or corrupt record means we cannot know
      // who the token belongs to, so drop the whole session rather than leave
      // a token (or a partial identity) lying around.
      const savedUser = localStorage.getItem(AUTH_USER_KEY);
      let cachedUser: User | null = null;
      if (savedUser) {
        try {
          const parsed: unknown = JSON.parse(savedUser);
          if (isUserShape(parsed)) cachedUser = parsed;
        } catch {
          cachedUser = null;
        }
      }

      if (!cachedUser) {
        clearSession();
        setIsLoading(false);
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      // Optimistically apply the cached profile to avoid a logged-out flash,
      // but never treat it as authoritative.
      setToken(savedToken);
      setUser(cachedUser);

      try {
        // The server is the source of truth for identity and roles. Persisted
        // roles are client-controlled, so they must be refreshed before the
        // UI relies on them (e.g. to expose admin controls).
        const { data } = await axios.get(apiUrl('/auth/me'));
        if (cancelled) return;

        const fresh: User = {
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          roles: Array.isArray(data.roles) ? data.roles : [],
          avatarUrl: data.avatarUrl,
        };

        if (!isUserShape(fresh)) {
          throw new Error('Invalid session response');
        }

        setToken(savedToken);
        setUser(fresh);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fresh));
      } catch (error) {
        if (cancelled) return;

        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        // Only tear down the session when the server actively rejected the
        // token. A transient network failure must not log the user out.
        if (status === 401 || status === 403) {
          console.error('[Auth] Session rejected by server:', status);
          clearSession();
        } else {
          console.warn('[Auth] Could not revalidate session; keeping cached session.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
