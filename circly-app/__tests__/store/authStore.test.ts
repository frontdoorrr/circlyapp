import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/services/api/auth';

// Mock the auth API
jest.mock('../../src/services/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

// Mock AsyncStorage for persistence
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Auth Store', () => {
  const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.getState().clearAuth();
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockAuthResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: 1,
          device_id: 'test-device',
          display_name: 'Test User',
          profile_emoji: '😊',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
        },
      };

      mockAuthApi.login.mockResolvedValueOnce(mockAuthResponse);

      const store = useAuthStore.getState();
      await store.login({ device_id: 'test-device' });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockAuthResponse.user);
      expect(state.token).toBe('test-token');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('handles login error', async () => {
      mockAuthApi.login.mockRejectedValueOnce(new Error('Login failed'));

      const store = useAuthStore.getState();
      
      try {
        await store.login({ device_id: 'invalid' });
      } catch (error) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Login failed');
    });
  });

  describe('logout', () => {
    it('successfully logs out user', async () => {
      // First login
      const mockAuthResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: 1,
          device_id: 'test-device',
          display_name: 'Test User',
          profile_emoji: '😊',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
        },
      };

      mockAuthApi.login.mockResolvedValueOnce(mockAuthResponse);
      
      const store = useAuthStore.getState();
      await store.login({ device_id: 'test-device' });

      // Then logout
      mockAuthApi.logout.mockResolvedValueOnce(undefined);
      await store.logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('successfully gets current user', async () => {
      const mockUser = {
        id: 1,
        device_id: 'test-device',
        display_name: 'Test User',
        profile_emoji: '😊',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
      };

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(mockUser);

      const store = useAuthStore.getState();
      await store.getCurrentUser();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('handles getCurrentUser error', async () => {
      mockAuthApi.getCurrentUser.mockRejectedValueOnce(new Error('Unauthorized'));

      const store = useAuthStore.getState();
      await store.getCurrentUser();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe('Unauthorized');
    });
  });

  describe('updateProfile', () => {
    it('successfully updates user profile', async () => {
      // First set initial user
      const initialUser = {
        id: 1,
        device_id: 'test-device',
        display_name: 'Test User',
        profile_emoji: '😊',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
      };

      const store = useAuthStore.getState();
      store.setUser(initialUser);

      // Then update profile
      const updateData = {
        display_name: 'Updated Name',
        profile_emoji: '🎉',
      };

      const updatedUser = {
        ...initialUser,
        ...updateData,
      };

      mockAuthApi.updateProfile.mockResolvedValueOnce(updatedUser);
      await store.updateProfile(updateData);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(updatedUser);
      expect(state.loading).toBe(false);
    });
  });
});