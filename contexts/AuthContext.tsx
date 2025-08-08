import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../constants/api';
import apiService from '../services/apiService';

// Auth context interface
interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: 'customer' | 'recycler', rememberMe?: boolean) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    username?: string;
    phone?: string;
    role?: 'customer' | 'recycler';
    companyName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (email: string, token: string) => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  switchRole: (newRole: 'customer' | 'recycler') => Promise<void>;
  deleteAccount: () => Promise<void>;
  handleAuthError: () => Promise<void>;
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
      console.log('AuthContext: Starting initialization...');
      
      // Check if user is authenticated
      const isAuth = apiService.isAuthenticated();
      console.log('AuthContext: Is authenticated check:', isAuth);
      
      if (isAuth) {
        try {
          console.log('AuthContext: Getting current user...');
          // Try to get current user
          const currentUser = await apiService.getCurrentUser();
          console.log('AuthContext: Current user received:', currentUser);
          setUser(currentUser);
        } catch (error: any) {
          console.error('Failed to get current user:', error);
          // Clear any invalid tokens and set user to null
          await apiService.logout();
          setUser(null);
          console.log('AuthContext: Cleared invalid token, user set to null');
        }
      } else {
        console.log('AuthContext: No token found, user not authenticated');
        // No token found, user is not authenticated
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear any invalid tokens
      await apiService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('AuthContext: Initialization complete');
    }
  };

  // Login function
  const login = async (email: string, password: string, role?: 'customer' | 'recycler', rememberMe?: boolean) => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Starting login process...');
      const authResponse = await apiService.login({ email, password, role, rememberMe });
      console.log('AuthContext: Login response received:', JSON.stringify(authResponse, null, 2));
      
      // Extract user data from the response - check all possible locations
      let userData = null;
      const response = authResponse as any;
      if (response.user) {
        userData = response.user;
      } else if (response.session && response.session.user) {
        userData = response.session.user;
      } else if (response.data && response.data.user) {
        userData = response.data.user;
      }
      
      console.log('AuthContext: Extracted user data:', userData);
      console.log('AuthContext: User role from database:', userData.role);
      console.log('AuthContext: User metadata role:', (userData as any).user_metadata?.role);
      console.log('AuthContext: Company name from database:', userData.company_name);
      console.log('AuthContext: Company name from metadata:', (userData as any).user_metadata?.company_name);
      console.log('AuthContext: All user data keys:', Object.keys(userData));
      console.log('AuthContext: User metadata keys:', Object.keys((userData as any).user_metadata || {}));
      
      if (userData) {
        // Transform the user data to match UserProfile interface
        const userProfile: UserProfile = {
          id: userData.id,
          email: userData.email,
          username: userData.username || (userData as any).user_metadata?.username || userData.email,
          phone: userData.phone || (userData as any).user_metadata?.phone || '',
          role: userData.role || (userData as any).user_metadata?.role || 'customer',
          email_verified: userData.email_verified || (userData as any).email_confirmed_at ? true : false,
          onboarding_completed: userData.onboarding_completed || (userData as any).user_metadata?.onboarding_completed || false,
          privacy_policy_accepted: userData.privacy_policy_accepted || (userData as any).user_metadata?.privacy_policy_accepted || false,
          profile_image: userData.profile_image || (userData as any).user_metadata?.profile_image,
          company_name: userData.company_name || (userData as any).user_metadata?.company_name || (userData as any).user_metadata?.company_name || '',
          business_location: userData.business_location || (userData as any).user_metadata?.business_location || '',
          areas_of_operation: userData.areas_of_operation || (userData as any).user_metadata?.areas_of_operation || '',
          available_resources: userData.available_resources || (userData as any).user_metadata?.available_resources || '',
          verification_status: userData.verification_status || 'unverified',
          created_at: userData.created_at,
          updated_at: userData.updated_at || userData.created_at
        };
        
        console.log('AuthContext: Setting user profile:', userProfile);
        setUser(userProfile);
      } else {
        console.error('AuthContext: No user data found in response');
        console.log('AuthContext: Available keys in response:', Object.keys(response));
        setUser(null);
      }
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
    companyName?: string;
  }) => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Starting registration...');
      const authResponse = await apiService.register(userData);
      console.log('AuthContext: Registration response received:', JSON.stringify(authResponse, null, 2));
      
      // Extract user data from the response
      let extractedUserData = null;
      const response = authResponse as any;
      if (response.user) {
        extractedUserData = response.user;
      } else if (response.session && response.session.user) {
        extractedUserData = response.session.user;
      } else if (response.data && response.data.user) {
        extractedUserData = response.data.user;
      }
      
      if (extractedUserData) {
        console.log('AuthContext: Setting user data:', extractedUserData);
        setUser(extractedUserData as UserProfile);
        console.log('AuthContext: Registration successful, user logged in');
      } else {
        console.warn('AuthContext: No user data found in registration response');
        throw new Error('Registration successful but no user data received');
      }
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
      console.log('AuthContext: Starting logout...');
      await apiService.logout();
      console.log('AuthContext: ApiService logout completed');
    } catch (error) {
      console.error('Logout failed:', error);
      // Don't throw the error, just log it
    } finally {
      console.log('AuthContext: Clearing user state...');
      setUser(null);
      setIsLoading(false);
      console.log('AuthContext: Logout complete');
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
      console.error('Failed to refresh user:', error);
      // If token is invalid, clear user and redirect to login
      await handleAuthError();
    }
  };

  // Handle authentication errors
  const handleAuthError = async () => {
    try {
      console.log('Handling authentication error - clearing user data');
      setUser(null);
      await apiService.logout();
      // In a real app, you'd navigate to login screen here
      // For now, we'll just clear the state
    } catch (error) {
      console.error('Error handling auth error:', error);
    }
  };

  // Switch user role
  const switchRole = async (newRole: 'customer' | 'recycler') => {
    try {
      setIsLoading(true);
      const updatedUser = await apiService.switchRole(newRole);
      setUser(updatedUser);
    } catch (error) {
      console.error('Role switch failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      await apiService.deleteAccount();
      // Clear user data after successful deletion
      setUser(null);
      await apiService.logout();
    } catch (error) {
      console.error('Delete account failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
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
    switchRole,
    deleteAccount,
    handleAuthError,
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