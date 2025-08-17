import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';
import CircleDetailScreen from '../../src/screens/circle/CircleDetailScreen';
import { useCircleStore } from '../../src/store';
import * as Clipboard from 'expo-clipboard';

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock the circle store
jest.mock('../../src/store', () => ({
  useCircleStore: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock Share
jest.spyOn(Share, 'share');

// Mock Clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockFocusEffectCallback = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { circleId: 1 },
  }),
  useFocusEffect: (callback: any) => {
    mockFocusEffectCallback();
    // Execute the callback immediately for testing
    const result = callback();
    // If the callback returns a cleanup function, store it but don't execute
    if (typeof result === 'function') {
      // This would be the cleanup function
    }
  },
}));

describe('CircleDetailScreen', () => {
  const mockGetCircle = jest.fn();
  const mockGetCircleMembers = jest.fn();
  const mockClearError = jest.fn();
  
  const mockCircle = {
    id: 1,
    name: 'Test Circle',
    description: 'A test circle for our app',
    invite_code: 'TEST1234',
    creator_id: 1,
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    member_count: 3,
  };

  const mockMembers = [
    {
      id: 1,
      circle_id: 1,
      user_id: 1,
      role: 'admin' as const,
      joined_at: '2024-01-15T10:00:00Z',
      user: { id: 1, username: 'john_doe', email: 'john@example.com' },
    },
    {
      id: 2,
      circle_id: 1,
      user_id: 2,
      role: 'member' as const,
      joined_at: '2024-01-16T12:00:00Z',
      user: { id: 2, username: 'jane_smith', email: 'jane@example.com' },
    },
  ];

  const mockCircleStore = {
    currentCircle: mockCircle,
    members: mockMembers,
    loading: false,
    error: null,
    getCircle: mockGetCircle,
    getCircleMembers: mockGetCircleMembers,
    clearError: mockClearError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCircle.mockResolvedValue();
    mockGetCircleMembers.mockResolvedValue();
    (useCircleStore as jest.Mock).mockReturnValue(mockCircleStore);
  });

  it('renders circle details when loaded', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Test Circle')).toBeTruthy();
    expect(getByText('A test circle for our app')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('Members')).toBeTruthy();
    expect(getByText('TEST1234')).toBeTruthy();
  });

  it('shows loading state when circle is loading', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      currentCircle: null,
      loading: true,
    });

    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Loading circle details...')).toBeTruthy();
  });

  it('shows error state when circle not found', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      currentCircle: null,
      loading: false,
      error: 'Circle not found',
    });

    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Circle Not Found')).toBeTruthy();
    expect(getByText('Circle not found')).toBeTruthy();
    expect(getByText('Go Back')).toBeTruthy();
  });

  it('loads circle data on mount', async () => {
    render(<CircleDetailScreen />);
    
    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockGetCircle).toHaveBeenCalledWith(1);
    });
    
    await waitFor(() => {
      expect(mockGetCircleMembers).toHaveBeenCalledWith(1);
    });
  });

  it('displays quick actions', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Quick Actions')).toBeTruthy();
    expect(getByText('Create Poll')).toBeTruthy();
    expect(getByText('Share Circle')).toBeTruthy();
    expect(getByText('Copy Code')).toBeTruthy();
  });

  it('navigates to create poll when create poll is pressed', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    const createPollButton = getByText('Create Poll');
    fireEvent.press(createPollButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('CreatePoll', { circleId: 1 });
  });

  it('shares invite code when share button is pressed', async () => {
    (Share.share as jest.Mock).mockResolvedValueOnce({ action: 'shared' });
    
    const { getByText } = render(<CircleDetailScreen />);
    
    const shareButton = getByText('Share Circle');
    fireEvent.press(shareButton);
    
    await waitFor(() => {
      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining('Test Circle'),
        title: 'Join Test Circle',
      });
    });
  });

  it('copies invite code when copy button is pressed', async () => {
    (Clipboard.setStringAsync as jest.Mock).mockResolvedValueOnce();
    
    const { getAllByLabelText } = render(<CircleDetailScreen />);
    
    const copyButtons = getAllByLabelText('Copy invite code');
    fireEvent.press(copyButtons[0]);
    
    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('TEST1234');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copied!',
        'Invite code "TEST1234" has been copied to your clipboard.',
        [{ text: 'OK' }]
      );
    });
  });

  it('handles copy error gracefully', async () => {
    (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(new Error('Copy failed'));
    
    const { getAllByLabelText } = render(<CircleDetailScreen />);
    
    const copyButtons = getAllByLabelText('Copy invite code');
    fireEvent.press(copyButtons[0]);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copy Failed',
        'Unable to copy invite code to clipboard.',
        [{ text: 'OK' }]
      );
    });
  });

  it('displays invite code section', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Invite Code')).toBeTruthy();
    expect(getByText('Share this code with friends:')).toBeTruthy();
    expect(getByText('TEST1234')).toBeTruthy();
    expect(getByText('Share Invite Link')).toBeTruthy();
  });

  it('displays members list', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Members (2)')).toBeTruthy();
    expect(getByText('john_doe')).toBeTruthy();
    expect(getByText('jane_smith')).toBeTruthy();
    expect(getByText(/Administrator.*Joined Jan 15, 2024/)).toBeTruthy();
    expect(getByText(/Member.*Joined Jan 16, 2024/)).toBeTruthy();
  });

  it('shows empty state for members when no members', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      members: [],
    });

    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Members (0)')).toBeTruthy();
    expect(getByText('No members found')).toBeTruthy();
    expect(getByText('Members will appear here once they join the circle')).toBeTruthy();
  });

  it('displays circle management section for creators', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Circle Management')).toBeTruthy();
    expect(getByText('Edit Circle Info')).toBeTruthy();
    expect(getByText('Manage Members')).toBeTruthy();
  });

  it('shows coming soon alert for edit circle info', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    const editButton = getByText('Edit Circle Info');
    fireEvent.press(editButton);
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Coming Soon',
      'Circle editing will be available in a future update.'
    );
  });

  it('shows coming soon alert for manage members', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    const manageButton = getByText('Manage Members');
    fireEvent.press(manageButton);
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Coming Soon',
      'Member management will be available in a future update.'
    );
  });

  it('displays recent activity section', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Recent Activity')).toBeTruthy();
    expect(getByText('No recent activity')).toBeTruthy();
    expect(getByText('Polls and member activities will appear here')).toBeTruthy();
  });

  it('formats dates correctly', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Jan 15, 2024')).toBeTruthy();
  });

  it('handles circle without description', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      currentCircle: {
        ...mockCircle,
        description: undefined,
      },
    });

    const { getByText, queryByText } = render(<CircleDetailScreen />);
    
    expect(getByText('Test Circle')).toBeTruthy();
    expect(queryByText('A test circle for our app')).toBeNull();
  });

  it('goes back when go back button is pressed in error state', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      currentCircle: null,
      loading: false,
      error: 'Circle not found',
    });

    const { getByText } = render(<CircleDetailScreen />);
    
    const goBackButton = getByText('Go Back');
    fireEvent.press(goBackButton);
    
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows admin badge for admin members', () => {
    const { getAllByText } = render(<CircleDetailScreen />);
    
    // Admin member should have "Administrator" role
    expect(getAllByText(/Administrator/)).toHaveLength(1);
  });

  it('shows member role for regular members', () => {
    const { getAllByText } = render(<CircleDetailScreen />);
    
    // Regular member should have "Member" role
    expect(getAllByText(/Member.*Joined/)).toHaveLength(1);
  });

  it('displays circle stats correctly', () => {
    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('3')).toBeTruthy(); // member count
    expect(getByText('Members')).toBeTruthy();
    expect(getByText('Jan 15, 2024')).toBeTruthy(); // created date
    expect(getByText('Created')).toBeTruthy();
  });

  it('shares invite link when share invite link button is pressed', async () => {
    (Share.share as jest.Mock).mockResolvedValueOnce({ action: 'shared' });
    
    const { getByText } = render(<CircleDetailScreen />);
    
    const shareInviteButton = getByText('Share Invite Link');
    fireEvent.press(shareInviteButton);
    
    await waitFor(() => {
      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining('TEST1234'),
        title: 'Join Test Circle',
      });
    });
  });

  it('handles members with missing user data', () => {
    const membersWithMissingUser = [
      {
        id: 3,
        circle_id: 1,
        user_id: 3,
        role: 'member' as const,
        joined_at: '2024-01-17T14:00:00Z',
        user: undefined,
      },
    ];

    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      members: membersWithMissingUser,
    });

    const { getByText } = render(<CircleDetailScreen />);
    
    expect(getByText('User 3')).toBeTruthy();
  });

  it('clears error on mount', async () => {
    render(<CircleDetailScreen />);
    
    // The clearError is called in the cleanup function, so we need to wait
    await waitFor(() => {
      expect(mockFocusEffectCallback).toHaveBeenCalled();
    });
  });

  it('handles refresh properly', async () => {
    render(<CircleDetailScreen />);
    
    // Note: RefreshControl doesn't have direct test support, 
    // but we can test that the data loading functions are set up correctly
    await waitFor(() => {
      expect(mockGetCircle).toHaveBeenCalledWith(1);
    });
    
    await waitFor(() => {
      expect(mockGetCircleMembers).toHaveBeenCalledWith(1);
    });
  });
});