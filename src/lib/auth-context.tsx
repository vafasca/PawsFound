'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAppStore } from '@/store/app-store';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  city: string | null;
  bio?: string | null;
  locale?: string | null;
  pushEnabled?: boolean;
  locationSharing?: boolean;
  profileVisible?: boolean;
  _count?: {
    pets: number;
    reports: number;
    comments: number;
    notifications: number;
    userBadges: number;
  };
  pets?: unknown[];
  reports?: unknown[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, city?: string, lat?: number, lng?: number) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setNotifications = useAppStore((s) => s.setNotifications);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        const userData = data.user as AuthUser;
        setUser(userData);
        setAuthenticated(true);
        setCurrentUser(userData);
        setNotifications(userData._count?.notifications ?? 0);
      } else {
        setUser(null);
        setAuthenticated(false);
        setCurrentUser(null);
      }
    } catch {
      setUser(null);
      setAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [setAuthenticated, setCurrentUser, setNotifications]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    const data = await res.json();
    const userData = data.user as AuthUser;
    setUser(userData);
    setAuthenticated(true);
    setCurrentUser(userData);
    setNotifications(0);
  }, [setAuthenticated, setCurrentUser, setNotifications]);

  const register = useCallback(async (name: string, email: string, password: string, city?: string, lat?: number, lng?: number) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, city, lat, lng }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al registrarse');
    }

    const data = await res.json();
    const userData = data.user as AuthUser;
    setUser(userData);
    setAuthenticated(true);
    setCurrentUser(userData);
  }, [setAuthenticated, setCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    }
    setUser(null);
    setAuthenticated(false);
    setCurrentUser(null);
    setNotifications(0);
  }, [setAuthenticated, setCurrentUser, setNotifications]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
