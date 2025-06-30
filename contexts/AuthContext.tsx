import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'ridelink_auth_user';
const SESSION_STORAGE_KEY = 'ridelink_session_token';

interface AuthProviderProps {
  children: ReactNode;
}

// Mock API functions - replace with real API calls
const mockApi = {
  login: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation
    if (email === 'demo@ridelink.com' && password === 'demo123') {
      const user: User = {
        id: '1',
        email: 'demo@ridelink.com',
        name: 'Demo User',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date(),
      };
      return { success: true, user, token: 'mock_session_token' };
    }
    
    return { success: false, error: 'Invalid email or password' };
  },

  register: async (name: string, email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock email validation
    if (email === 'existing@example.com') {
      return { success: false, error: 'Email already exists' };
    }
    
    const user: User = {
      id: Date.now().toString(),
      email,
      name,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    return { success: true, user, token: 'mock_session_token' };
  },

  resetPassword: async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  updateProfile: async (updates: Partial<User>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, user: updates };
  },
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadStoredUser().catch((error) => {
      console.error('❌ Failed to load stored user:', error);
      setIsLoading(false);
    });
  }, []);

  const loadStoredUser = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(SESSION_STORAGE_KEY),
      ]);

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        // Convert date strings back to Date objects
        parsedUser.createdAt = new Date(parsedUser.createdAt);
        parsedUser.lastLoginAt = new Date(parsedUser.lastLoginAt);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      // Don't throw, just log the error
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User, token: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData)),
        AsyncStorage.setItem(SESSION_STORAGE_KEY, token),
      ]);
    } catch (error) {
      console.error('Error saving user to storage:', error);
      // Don't throw, just log the error
    }
  };

  const clearUserFromStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_STORAGE_KEY),
        AsyncStorage.removeItem(SESSION_STORAGE_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing user from storage:', error);
      // Don't throw, just log the error
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await mockApi.login(email, password);
      
      if (result.success && result.user && result.token) {
        setUser(result.user);
        await saveUserToStorage(result.user, result.token);
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await mockApi.register(name, email, password);
      
      if (result.success && result.user && result.token) {
        setUser(result.user);
        await saveUserToStorage(result.user, result.token);
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await clearUserFromStorage();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if storage clearing fails
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await mockApi.resetPassword(email);
      return { success: result.success, error: result.success ? undefined : 'Failed to send reset email' };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const result = await mockApi.updateProfile(updates);
      
      if (result.success && user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        const token = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (token) {
          await saveUserToStorage(updatedUser, token);
        }
        return { success: true };
      }
      
      return { success: false, error: 'Failed to update profile' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}