import { useCircleStore } from '../../src/store/circleStore';
import { circleApi } from '../../src/services/api';
import { act, renderHook } from '@testing-library/react-native';

// Mock the circle API
jest.mock('../../src/services/api', () => ({
  circleApi: {
    createCircle: jest.fn(),
    getMyCircles: jest.fn(),
    getCircle: jest.fn(),
    joinCircle: jest.fn(),
    getCircleMembers: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockCircleApi = circleApi as jest.Mocked<typeof circleApi>;

describe('CircleStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useCircleStore());
    
    expect(result.current.circles).toEqual([]);
    expect(result.current.currentCircle).toBeNull();
    expect(result.current.members).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
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

      mockCircleApi.createCircle.mockResolvedValueOnce(mockCircle);

      const { result } = renderHook(() => useCircleStore());

      let createdCircle;
      await act(async () => {
        createdCircle = await result.current.createCircle({
          name: 'Test Circle',
          description: 'A test circle',
        });
      });

      expect(mockCircleApi.createCircle).toHaveBeenCalledWith({
        name: 'Test Circle',
        description: 'A test circle',
      });

      expect(createdCircle).toEqual(mockCircle);
      expect(result.current.circles).toContain(mockCircle);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles creation error', async () => {
      const error = new Error('Failed to create circle');
      mockCircleApi.createCircle.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCircleStore());

      await act(async () => {
        try {
          await result.current.createCircle({
            name: 'Test Circle',
            description: 'A test circle',
          });
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to create circle');
      expect(result.current.circles).toEqual([]);
    });

    it('sets loading state during creation', async () => {
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

      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockCircleApi.createCircle.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useCircleStore());

      // Start creation
      act(() => {
        result.current.createCircle({
          name: 'Test Circle',
          description: 'A test circle',
        });
      });

      // Should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      // Resolve promise
      await act(async () => {
        resolvePromise!(mockCircle);
        await promise;
      });

      // Should no longer be loading
      expect(result.current.loading).toBe(false);
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

      mockCircleApi.getMyCircles.mockResolvedValueOnce(mockCircles);

      const { result } = renderHook(() => useCircleStore());

      await act(async () => {
        await result.current.getMyCircles();
      });

      expect(mockCircleApi.getMyCircles).toHaveBeenCalled();
      expect(result.current.circles).toEqual(mockCircles);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
      const error = new Error('Failed to load circles');
      mockCircleApi.getMyCircles.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCircleStore());

      await act(async () => {
        await result.current.getMyCircles();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load circles');
      expect(result.current.circles).toEqual([]);
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

      mockCircleApi.joinCircle.mockResolvedValueOnce(mockCircle);

      const { result } = renderHook(() => useCircleStore());

      let joinedCircle;
      await act(async () => {
        joinedCircle = await result.current.joinCircle({ invite_code: 'JOIN1234' });
      });

      expect(mockCircleApi.joinCircle).toHaveBeenCalledWith({ invite_code: 'JOIN1234' });
      expect(joinedCircle).toEqual(mockCircle);
      expect(result.current.circles).toContain(mockCircle);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles join error', async () => {
      const error = new Error('Invalid invite code');
      mockCircleApi.joinCircle.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCircleStore());

      await act(async () => {
        try {
          await result.current.joinCircle({ invite_code: 'INVALID' });
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Invalid invite code');
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

      mockCircleApi.getCircle.mockResolvedValueOnce(mockCircle);

      const { result } = renderHook(() => useCircleStore());

      await act(async () => {
        await result.current.getCircle(1);
      });

      expect(mockCircleApi.getCircle).toHaveBeenCalledWith(1);
      expect(result.current.currentCircle).toEqual(mockCircle);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles circle not found', async () => {
      mockCircleApi.getCircle.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useCircleStore());

      await act(async () => {
        await result.current.getCircle(999);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Circle not found');
      expect(result.current.currentCircle).toBeNull();
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

      mockCircleApi.getCircleMembers.mockResolvedValueOnce(mockMembers);

      const { result } = renderHook(() => useCircleStore());

      await act(async () => {
        await result.current.getCircleMembers(1);
      });

      expect(mockCircleApi.getCircleMembers).toHaveBeenCalledWith(1);
      expect(result.current.members).toEqual(mockMembers);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('utility functions', () => {
    it('sets current circle', () => {
      const { result } = renderHook(() => useCircleStore());

      const mockCircle = {
        id: 1,
        name: 'Current Circle',
        description: 'The current circle',
        invite_code: 'CURRENT1',
        creator_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        member_count: 1,
      };

      act(() => {
        result.current.setCurrentCircle(mockCircle);
      });

      expect(result.current.currentCircle).toEqual(mockCircle);
    });

    it('sets loading state', () => {
      const { result } = renderHook(() => useCircleStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });

    it('sets and clears error', () => {
      const { result } = renderHook(() => useCircleStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});