import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthResponse } from '../types';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  googleLogin as apiGoogleLogin,
  logoutUser as apiLogoutUser,
  getStoredToken,
  removeStoredToken
} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<User>;
  googleSignIn: (credential?: string, email?: string, name?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setToken(currentToken);
    } catch (err) {
      console.warn('Failed to restore user session:', err);
      removeStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const authRes: AuthResponse = await loginUser({ email, password });
      setUser(authRes.user);
      setToken(authRes.access_token);
      return authRes.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const authRes: AuthResponse = await registerUser({
        name,
        email,
        password,
        confirm_password: confirmPassword
      });
      setUser(authRes.user);
      setToken(authRes.access_token);
      return authRes.user;
    } finally {
      setIsLoading(false);
    }
  };

  const googleSignIn = async (
    credential?: string,
    email?: string,
    name?: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const authRes: AuthResponse = await apiGoogleLogin(
        credential || 'direct_google',
        undefined,
        email,
        name
      );
      setUser(authRes.user);
      setToken(authRes.access_token);
      return authRes.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiLogoutUser();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      removeStoredToken();
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user && user.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        googleSignIn,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
