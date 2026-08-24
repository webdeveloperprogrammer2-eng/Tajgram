'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '../types/auth.types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  language: 'en' | 'ru' | 'tj';
  login: (payload: any) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
  changeLanguage: (lng: 'en' | 'ru' | 'tj') => void;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'en' | 'ru' | 'tj'>('en');
  const router = useRouter();

  // Load state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Theme initialization
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // 2. Language initialization
      const storedLang = localStorage.getItem('language') as 'en' | 'ru' | 'tj' | null;
      if (storedLang) {
        setLanguage(storedLang);
      }

      // 3. Auth Token verification
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const profileResponse = await authService.getMyProfile();
          if (profileResponse.data) {
            setUser(profileResponse.data);
          } else {
            // If data is null or empty profile
            logout();
          }
        } catch (err: any) {
          console.error('Failed to verify session token', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (payload: any) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.login(payload);
      if (response.data) {
        const jwtToken = response.data;
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);

        // Fetch user profile
        const profileResponse = await authService.getMyProfile();
        if (profileResponse.data) {
          setUser(profileResponse.data);
          router.push('/');
        } else {
          throw new Error('Could not retrieve user profile after login');
        }
      } else if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0]);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0] || err.message || 'unknown';
      setError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.register(payload);
      if (response.statusCode === 200 || response.data) {
        // Automatically login the user after successful registration
        await login({
          userName: payload.userName,
          password: payload.password,
        });
      } else if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0]);
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0] || err.message || 'unknown';
      setError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/Auth/login');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const changeLanguage = (lng: 'en' | 'ru' | 'tj') => {
    setLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        theme,
        language,
        login,
        register,
        logout,
        toggleTheme,
        changeLanguage,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
