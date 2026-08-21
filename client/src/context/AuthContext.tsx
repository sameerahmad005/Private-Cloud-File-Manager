import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { authApi, setupApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  authenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkSession = async () => {
    try {
      setLoading(true);
      const setupRes = await setupApi.getStatus();
      if (setupRes && setupRes.success && setupRes.data) {
        setIsInitialized(setupRes.data.initialized);
      } else {
        setIsInitialized(false);
      }

      const res = await authApi.getSession();
      if (res && res.authenticated && res.user) {
        setUser(res.user);
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch {
      setIsInitialized(false);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (u: string, p: string) => {
    const res = await authApi.login(u, p);
    if (res.success && res.data) {
      setUser(res.data.user);
      setAuthenticated(true);
    } else {
      throw new Error(res.error || 'Login failed.');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authenticated, isInitialized, loading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
