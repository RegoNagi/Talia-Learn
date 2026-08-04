'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthenticatedUser, loginToTaliaLearn } from '@/services/auth';

interface AuthContextValue {
  authUser: AuthenticatedUser | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<AuthenticatedUser | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'talia_learn_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // بيسترجع الجلسة (لو موجودة) من sessionStorage أول ما التطبيق يفتح، عشان التنقّل بين الصفحات مايسيبكش
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setAuthUser(JSON.parse(stored));
    } catch {}
    setIsAuthLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const user = await loginToTaliaLearn(email, password);
    if (user) {
      setAuthUser(user);
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
    }
    return user;
  };

  const logout = () => {
    setAuthUser(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <AuthContext.Provider value={{ authUser, isLoggedIn: !!authUser, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
