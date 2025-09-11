import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { apiService } from '@/lib/api';
import type { User, LoginRequest, RegisterRequest, UpdateProfileRequest } from '@shared/api-types';


// Define the shape 
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

// wraps children components and holds all authentication logic
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const isAuthenticated = authService.isAuthenticated();

  // Debug logging for auth state - only in development
  useEffect(() => {
    if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
      console.log('🔍 Auth state check:', {
        user: user ? { id: user.id, username: user.username } : null,
        isAuthenticated,
        hasToken: !!authService.getAccessToken(),
        hasRefreshToken: !!authService.getRefreshToken()
      });
    }
  }, [user, isAuthenticated]);

  //React Query mutation wraps the login function 
  // and refreshes all cached queries upon successful login.
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  //same but for registration
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  // Handles updating the user profile 
  // and selectively invalidates the user profile cache only.
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // Defines the login function with isLoading management and wraps
  // the mutation inside useCallback to avoid unnecessary re-renders
  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  }, [loginMutation]);

  // same but for registration
  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync(data);
    } catch (error) {
      console.error('Registration error in useAuth:', error);
      throw error; // Re-throw to let the component handle it
    } finally {
      setIsLoading(false);
    }
  }, [registerMutation]);

  // Handles Google login and registration,
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const authData = await authService.signInWithGoogle();
      setUser(authData.user);
      queryClient.invalidateQueries();
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  // Handles Google registration
  // i think this can be removed, look into this 
  const registerWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const authData = await authService.signUpWithGoogle();
      setUser(authData.user);
      queryClient.invalidateQueries();
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  // Handles logout, clears user state and query cache
  //authService.logout() is called to clear the session
  //query client.clear() is used to clear all cached queries
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);


  //
  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    await updateProfileMutation.mutateAsync(data);
  }, [updateProfileMutation]);

  // Refreshes the user profile data by calling authService.getProfile()
  // If the user is authenticated, it updates the user state with the new profile data.
  const refreshUser = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const updatedUser = await authService.getProfile();
        if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
          console.log('refreshUser: Updated user data from server:', {
            userId: updatedUser.id,
            username: updatedUser.username,
            preferences: updatedUser.preferences
          });
        }
        setUser(updatedUser);
      } catch (error) {
        console.error('Failed to refresh user:', error);
        // If refresh fails, user might be logged out
        await logout();
      }
    }
  }, [isAuthenticated, logout]);

  // Refresh user data on mount if authenticated
  useEffect(() => {
    if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
      console.log('🔄 Auth effect triggered:', { isAuthenticated, hasUser: !!user });
    }
    if (isAuthenticated && !user) {
      if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
        console.log('🔄 Refreshing user data...');
      }
      refreshUser();
    }
  }, [isAuthenticated, user, refreshUser]);

  // Provide the context value to children components
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login,
    register,
    loginWithGoogle,
    registerWithGoogle,
    logout,
    updateProfile,
    refreshUser,
  };

  // Return the AuthContext.Provider with the value and children
  return React.createElement(AuthContext.Provider, { value }, children);
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Additional auth-related hooks
export const useRequireAuth = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) {
    throw new Error('Authentication required');
  }
  return { user };
};

//
export const useUserProfile = () => {
  const { user, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getProfile,
    enabled: isAuthenticated,
    initialData: user || undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: authService.changePassword,
  });
};

export const useUploadAvatar = () => {
  const { refreshUser } = useAuth();
  
  return useMutation({
    mutationFn: authService.uploadAvatar,
    onSuccess: () => {
      refreshUser();
    },
  });
};

export const usePasswordReset = () => {
  return useMutation({
    mutationFn: authService.requestPasswordReset,
  });
};

export const usePasswordResetConfirm = () => {
  return useMutation({
    mutationFn: authService.confirmPasswordReset,
  });
};
