import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../constants/api';
import apiService from '../services/apiService';

// Auth context interface
interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    username?: string;
    phone?: string;
    role?: 'customer' | 'recycler';
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (email: string, token: string) => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      if (apiService.isAuthenticated()) {
        // Try to get current user
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear any invalid tokens
      await apiService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const authResponse = await apiService.login({ email, password });
      setUser(authResponse.user as UserProfile);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: {
    email: string;
    password: string;
    username?: string;
    phone?: string;
    role?: 'customer' | 'recycler';
  }) => {
    try {
      setIsLoading(true);
      const authResponse = await apiService.register(userData);
      setUser(authResponse.user as UserProfile);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear user state even if API call fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      await apiService.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await apiService.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  };

  // Verify email function
  const verifyEmail = async (email: string, token: string) => {
    try {
      await apiService.verifyEmail(email, token);
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      const updatedUser = await apiService.updateUserProfile(profileData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('User refresh failed:', error);
      // If refresh fails, user might be logged out
      setUser(null);
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 