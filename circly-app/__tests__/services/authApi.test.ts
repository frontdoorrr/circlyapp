import { authApi } from '../../src/services/api/auth';
import { apiClient } from '../../src/services/api/client';

// Mock the API client
jest.mock('../../src/services/api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    setToken: jest.fn(),
    clearToken: jest.fn(),
  },
}));

describe('Auth API', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('successfully logs in and sets token', async () => {
      const mockResponse = {
        data: {
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
        },
        error: undefined,
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.login({ device_id: 'test-device' });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/auth/login', {
        device_id: 'test-device',
      });
      expect(mockApiClient.setToken).toHaveBeenCalledWith('test-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('throws error on login failure', async () => {
      const mockResponse = {
        data: undefined,
        error: 'Invalid device ID',
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      await expect(authApi.login({ device_id: 'invalid' })).rejects.toThrow(
        'Invalid device ID'
      );

      expect(mockApiClient.setToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('successfully logs out and clears token', async () => {
      const mockResponse = {
        data: { message: 'Logged out' },
        error: undefined,
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      await authApi.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/auth/logout');
      expect(mockApiClient.clearToken).toHaveBeenCalled();
    });

    it('clears token even on API failure', async () => {
      const mockResponse = {
        data: undefined,
        error: 'Network error',
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      await authApi.logout();

      expect(mockApiClient.clearToken).toHaveBeenCalled();
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

      const mockResponse = {
        data: mockUser,
        error: undefined,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await authApi.getCurrentUser();

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('throws error when get current user fails', async () => {
      const mockResponse = {
        data: undefined,
        error: 'Unauthorized',
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      await expect(authApi.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateProfile', () => {
    it('successfully updates profile', async () => {
      const updateData = {
        display_name: 'Updated Name',
        profile_emoji: '🎉',
      };

      const mockUpdatedUser = {
        id: 1,
        device_id: 'test-device',
        display_name: 'Updated Name',
        profile_emoji: '🎉',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: mockUpdatedUser,
        error: undefined,
      };

      mockApiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await authApi.updateProfile(updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/v1/users/me', updateData);
      expect(result).toEqual(mockUpdatedUser);
    });
  });
});