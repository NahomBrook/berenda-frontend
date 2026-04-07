import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { authAPI, userAPI } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('berenda_token');
    const storedUser = localStorage.getItem('berenda_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('berenda_token');
        localStorage.removeItem('berenda_user');
      }
    }
    setIsLoading(false);
  }, []);

  const persistSession = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('berenda_token', authToken);
    localStorage.setItem('berenda_user', JSON.stringify(userData));
  };

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { token: authToken, user: userData } = res.data.data;
    persistSession(userData, authToken);
    toast.success(t('auth.loginSuccess'));
  };

  const register = async (email: string, password: string, fullName: string) => {
    await authAPI.register({ email, password, fullName });
    // Auto-login after registration
    await login(email, password);
    toast.success(t('auth.registerSuccess'));
  };

  const googleLogin = async (idToken: string) => {
    const res = await authAPI.googleLogin(idToken);
    const { token: authToken, user: userData } = res.data.data;
    persistSession(userData, authToken);
    toast.success(t('auth.loginSuccess'));
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('berenda_token');
    localStorage.removeItem('berenda_user');
    toast.success(t('auth.logoutSuccess'));
  }, [t]);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await userAPI.getProfile();
      const userData = res.data.data;
      setUser(userData);
      localStorage.setItem('berenda_user', JSON.stringify(userData));
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('berenda_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        googleLogin,
        logout,
        refreshProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
