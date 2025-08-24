import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AuthState, 
  UserResponse, 
  LoginRequest, 
  UserUpdate,
  EmailLoginRequest,
  RegisterRequest,
  AccountMigrationRequest,
  ExtendedUserResponse
} from '../types';
import { authApi } from '../services/api';
import { apiClient } from '../services/api/client';

interface AuthStore extends AuthState {
  // Actions
  login: (loginData: LoginRequest) => Promise<void>;
  emailLogin: (loginData: EmailLoginRequest) => Promise<void>;
  register: (registerData: RegisterRequest) => Promise<void>;
  migrateAccount: (migrationData: AccountMigrationRequest) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (updateData: UserUpdate) => Promise<void>;
  restoreAuth: () => Promise<void>;
  setUser: (user: UserResponse | ExtendedUserResponse) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>()((set) => {
  console.log('🏪 [AuthStore] Store created with initial state');
  
  return {
    // Initial state
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true, // Start with loading true to restore auth
    error: null,

    // Actions
    login: async (loginData: LoginRequest) => {
      console.log('🏪 [AuthStore] Login started with data:', loginData);
      try {
        set({ loading: true, error: null });
        console.log('🏪 [AuthStore] Set loading to true');
      
      const authResponse = await authApi.login(loginData);
      
      if (authResponse) {
        // Update API client token
        apiClient.setToken(authResponse.access_token);
        
        // Store token and user in AsyncStorage
        await AsyncStorage.setItem('auth_token', authResponse.access_token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(authResponse.user));
        
        set({
          isAuthenticated: true,
          user: authResponse.user,
          token: authResponse.access_token,
          loading: false,
        });
      }
    } catch (error: any) {
      // Clear API client token on error
      apiClient.clearToken();
      
      set({
        loading: false,
        error: error.message || 'Login failed',
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear API client token
      apiClient.clearToken();
      
      // Clear stored auth data
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
      
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      });
    }
  },

  getCurrentUser: async () => {
    try {
      set({ loading: true, error: null });
      
      const user = await authApi.getCurrentUser();
      
      if (user) {
        set({
          user,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        });
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to get user info',
        isAuthenticated: false,
        user: null,
        token: null,
      });
    }
  },

  updateProfile: async (updateData: UserUpdate) => {
    try {
      set({ loading: true, error: null });
      
      const updatedUser = await authApi.updateProfile(updateData);
      
      if (updatedUser) {
        set({
          user: updatedUser,
          loading: false,
        });
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to update profile',
      });
      throw error;
    }
  },

  restoreAuth: async () => {
    console.log('🔄 [AuthStore] Restoring authentication...');
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('auth_user');
      
      console.log('🔍 [AuthStore] Found stored data:', {
        hasToken: !!token,
        hasUser: !!userStr,
        tokenPrefix: token?.substring(0, 20)
      });
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        
        // Update API client with token
        apiClient.setToken(token);
        
        // Test if token is still valid
        const isValid = await apiClient.testAuth();
        console.log('🔐 [AuthStore] Token validation result:', isValid);
        
        if (isValid) {
          set({
            isAuthenticated: true,
            user,
            token,
            loading: false,
          });
          console.log('✅ [AuthStore] Authentication restored successfully');
        } else {
          // Token expired, clear stored data
          console.log('❌ [AuthStore] Token expired, clearing stored data');
          await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
          apiClient.clearToken();
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
          });
        }
      } else {
        console.log('📭 [AuthStore] No stored authentication data');
        set({ loading: false });
      }
    } catch (error: any) {
      console.error('🚨 [AuthStore] Error restoring auth:', error);
      set({ 
        loading: false,
        error: 'Failed to restore authentication'
      });
    }
  },

  emailLogin: async (loginData: EmailLoginRequest) => {
    console.log('🏪 [AuthStore] Email login started with data:', loginData);
    try {
      set({ loading: true, error: null });
      console.log('🏪 [AuthStore] Set loading to true');
    
      const authResponse = await authApi.emailLogin(loginData);
      
      if (authResponse) {
        // Update API client token
        apiClient.setToken(authResponse.access_token);
        
        // Store token and user in AsyncStorage
        await AsyncStorage.setItem('auth_token', authResponse.access_token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(authResponse.user));
        
        set({
          isAuthenticated: true,
          user: authResponse.user,
          token: authResponse.access_token,
          loading: false,
        });
      }
    } catch (error: any) {
      // Clear API client token on error
      apiClient.clearToken();
      
      set({
        loading: false,
        error: error.message || 'Email login failed',
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error;
    }
  },

  register: async (registerData: RegisterRequest) => {
    console.log('🏪 [AuthStore] Registration started with data:', registerData);
    try {
      set({ loading: true, error: null });
      
      const authResponse = await authApi.register(registerData);
      
      if (authResponse) {
        // Update API client token
        apiClient.setToken(authResponse.access_token);
        
        // Store token and user in AsyncStorage
        await AsyncStorage.setItem('auth_token', authResponse.access_token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(authResponse.user));
        
        set({
          isAuthenticated: true,
          user: authResponse.user,
          token: authResponse.access_token,
          loading: false,
        });
      }
    } catch (error: any) {
      // Clear API client token on error
      apiClient.clearToken();
      
      set({
        loading: false,
        error: error.message || 'Registration failed',
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error;
    }
  },

  migrateAccount: async (migrationData: AccountMigrationRequest) => {
    console.log('🏪 [AuthStore] Account migration started with data:', migrationData);
    try {
      set({ loading: true, error: null });
      
      const authResponse = await authApi.migrateAccount(migrationData);
      
      if (authResponse) {
        // Update API client token
        apiClient.setToken(authResponse.access_token);
        
        // Store token and user in AsyncStorage
        await AsyncStorage.setItem('auth_token', authResponse.access_token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(authResponse.user));
        
        set({
          isAuthenticated: true,
          user: authResponse.user,
          token: authResponse.access_token,
          loading: false,
        });
      }
    } catch (error: any) {
      // Clear API client token on error
      apiClient.clearToken();
      
      set({
        loading: false,
        error: error.message || 'Account migration failed',
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error;
    }
  },

  setUser: (user: UserResponse | ExtendedUserResponse) => {
    set({ user, isAuthenticated: true });
  },

  setToken: (token: string) => {
    apiClient.setToken(token);
    set({ token, isAuthenticated: true });
  },

  clearAuth: () => {
    apiClient.clearToken();
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
    });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
};
});