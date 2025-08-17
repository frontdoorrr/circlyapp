import { circleApi } from '../../src/services/api/circle';
import { apiClient } from '../../src/services/api/client';

// Mock the API client
jest.mock('../../src/services/api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('circleApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCircle', () => {
    it('creates circle successfully', async () => {
      const mockCircle = {
        id: 1,
        name: 'Test Circle',
        description: 'A test circle',
        invite_code: 'ABC12345',
        creator_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        member_count: 1,
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: mockCircle,
        error: null,
      });

      const result = await circleApi.createCircle({
        name: 'Test Circle',
        description: 'A test circle',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/circles', {
        name: 'Test Circle',
        description: 'A test circle',
      });
      expect(result).toEqual(mockCircle);
    });

    it('handles API error', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: null,
        error: 'Failed to create circle',
      });

      await expect(circleApi.createCircle({
        name: 'Test Circle',
        description: 'A test circle',
      })).rejects.toThrow('Failed to create circle');
    });

    it('returns null when no data', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await circleApi.createCircle({
        name: 'Test Circle',
        description: 'A test circle',
      });

      expect(result).toBeNull();
    });
  });

  describe('getMyCircles', () => {
    it('fetches circles successfully', async () => {
      const mockCircles = [
        {
          id: 1,
          name: 'Circle 1',
          description: 'First circle',
          invite_code: 'ABC12345',
          creator_id: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          member_count: 2,
        },
        {
          id: 2,
          name: 'Circle 2',
          description: 'Second circle',
          invite_code: 'DEF67890',
          creator_id: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          member_count: 3,
        },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        data: mockCircles,
        error: null,
      });

      const result = await circleApi.getMyCircles();

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/circles');
      expect(result).toEqual(mockCircles);
    });

    it('handles API error', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: null,
        error: 'Failed to fetch circles',
      });

      await expect(circleApi.getMyCircles()).rejects.toThrow('Failed to fetch circles');
    });

    it('returns empty array when no data', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await circleApi.getMyCircles();

      expect(result).toEqual([]);
    });
  });

  describe('getCircle', () => {
    it('fetches circle details successfully', async () => {
      const mockCircle = {
        id: 1,
        name: 'Detail Circle',
        description: 'Circle with details',
        invite_code: 'DETAIL01',
        creator_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        member_count: 5,
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: mockCircle,
        error: null,
      });

      const result = await circleApi.getCircle(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/circles/1');
      expect(result).toEqual(mockCircle);
    });

    it('handles API error', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: null,
        error: 'Circle not found',
      });

      await expect(circleApi.getCircle(999)).rejects.toThrow('Circle not found');
    });

    it('returns null when no data', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await circleApi.getCircle(1);

      expect(result).toBeNull();
    });
  });

  describe('joinCircle', () => {
    it('joins circle successfully', async () => {
      const mockCircle = {
        id: 2,
        name: 'Joined Circle',
        description: 'A circle I joined',
        invite_code: 'JOIN1234',
        creator_id: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        member_count: 3,
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: mockCircle,
        error: null,
      });

      const result = await circleApi.joinCircle({ invite_code: 'JOIN1234' });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/circles/join', {
        invite_code: 'JOIN1234',
      });
      expect(result).toEqual(mockCircle);
    });

    it('handles invalid invite code', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: null,
        error: 'Invalid invite code',
      });

      await expect(circleApi.joinCircle({ invite_code: 'INVALID' }))
        .rejects.toThrow('Invalid invite code');
    });

    it('returns null when no data', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await circleApi.joinCircle({ invite_code: 'JOIN1234' });

      expect(result).toBeNull();
    });
  });

  describe('getCircleMembers', () => {
    it('fetches circle members successfully', async () => {
      const mockMembers = [
        {
          id: 1,
          circle_id: 1,
          user_id: 1,
          role: 'admin',
          joined_at: new Date().toISOString(),
          user: {
            id: 1,
            username: 'admin_user',
            display_name: 'Admin User',
            device_id: 'device1',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        },
        {
          id: 2,
          circle_id: 1,
          user_id: 2,
          role: 'member',
          joined_at: new Date().toISOString(),
          user: {
            id: 2,
            username: 'member_user',
            display_name: 'Member User',
            device_id: 'device2',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        data: mockMembers,
        error: null,
      });

      const result = await circleApi.getCircleMembers(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/circles/1/members');
      expect(result).toEqual(mockMembers);
    });

    it('handles API error', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: null,
        error: 'Failed to fetch members',
      });

      await expect(circleApi.getCircleMembers(1)).rejects.toThrow('Failed to fetch members');
    });

    it('returns empty array when no data', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await circleApi.getCircleMembers(1);

      expect(result).toEqual([]);
    });
  });

  describe('leaveCircle', () => {
    it('leaves circle successfully', async () => {
      mockApiClient.delete.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await circleApi.leaveCircle(1);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/circles/1/leave');
    });

    it('handles API error', async () => {
      mockApiClient.delete.mockResolvedValueOnce({
        data: null,
        error: 'Failed to leave circle',
      });

      await expect(circleApi.leaveCircle(1)).rejects.toThrow('Failed to leave circle');
    });
  });
});