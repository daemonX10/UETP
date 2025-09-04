'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, tokenManager } from '@/lib/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  avatar?: string;
  phoneNumber?: string;
  phone?: string;
  role?: string;
  createdAt: string;
  // Legacy compatibility
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone: string; 
    dateOfBirth: string; 
    password: string; 
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = tokenManager.getToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token is still valid by calling the backend
      const response = await authAPI.getCurrentUser();
      if (response.success && response.data) {
        // Handle both user data formats
        const userData = response.data.user || response.data;
        setUser(userData);
      } else {
        // Token is invalid, clear it
        tokenManager.clearToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // If auth check fails, assume token is invalid
      tokenManager.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(credentials);
      
      if (response.success && response.data) {
        // Backend returns 'authToken', not 'token'
        const token = response.data.authToken || response.data.token;
        tokenManager.setToken(token);
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone: string; 
    dateOfBirth: string; 
    password: string; 
  }) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.success && response.data) {
        // Backend returns 'authToken', not 'token'
        const token = response.data.authToken || response.data.token;
        tokenManager.setToken(token);
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      tokenManager.clearToken();
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(userData);
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
