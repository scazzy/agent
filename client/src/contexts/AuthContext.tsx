/**
 * Authentication Context
 * Provides app-wide auth state and methods
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { SessionData } from '../types/auth';
import { authService, AuthServiceError } from '../lib/auth-service';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: SessionData | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: AuthServiceError | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthServiceError | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = authService.getSession();
    if (existingSession) {
      setSession(existingSession);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.login(email, password);
      const newSession = authService.getSession();
      setSession(newSession);
    } catch (err) {
      if (err instanceof AuthServiceError) {
        setError(err);
      } else {
        setError(new AuthServiceError('Unknown', 'An unexpected error occurred'));
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: session !== null,
    isLoading,
    session,
    login,
    logout,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
