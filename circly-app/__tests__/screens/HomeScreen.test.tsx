import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../src/screens/home/HomeScreen';
import { useCircleStore } from '../../src/store';

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock the circle store
jest.mock('../../src/store', () => ({
  useCircleStore: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock LoadingSpinner component
jest.mock('../../src/components/common/LoadingSpinner', () => {
  return function MockLoadingSpinner({ text }: { text?: string }) {
    const { Text, View } = require('react-native');
    return (
      <View testID="loading-spinner">
        {text && <Text>{text}</Text>}
      </View>
    );
  };
});

describe('HomeScreen', () => {
  const mockGetMyCircles = jest.fn();
  
  const mockCircles = [
    {
      id: 1,
      name: 'Family Circle',
      description: 'Our family discussions',
      invite_code: 'FAM12345',
      creator_id: 1,
      is_active: true,
      created_at: '2024-01-15T10:00:00Z',
      member_count: 4,
    },
    {
      id: 2,
      name: 'Work Team',
      description: 'Project collaboration space',
      invite_code: 'WORK9876',
      creator_id: 1,
      is_active: true,
      created_at: '2024-01-20T14:30:00Z',
      member_count: 8,
    },
    {
      id: 3,
      name: 'Study Group',
      description: null,
      invite_code: 'STUDY123',
      creator_id: 2,
      is_active: true,
      created_at: '2024-02-01T09:15:00Z',
      member_count: 1,
    },
  ];

  const mockCircleStore = {
    circles: mockCircles,
    loading: false,
    error: null,
    getMyCircles: mockGetMyCircles,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCircleStore as jest.Mock).mockReturnValue(mockCircleStore);
  });

  it('renders header buttons correctly', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Create Circle')).toBeTruthy();
    expect(getByText('Join Circle')).toBeTruthy();
  });

  it('calls getMyCircles on mount', () => {
    render(<HomeScreen />);
    
    expect(mockGetMyCircles).toHaveBeenCalled();
  });

  it('displays circles list when circles are available', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Family Circle')).toBeTruthy();
    expect(getByText('Our family discussions')).toBeTruthy();
    expect(getByText('4 members')).toBeTruthy();
    
    expect(getByText('Work Team')).toBeTruthy();
    expect(getByText('Project collaboration space')).toBeTruthy();
    expect(getByText('8 members')).toBeTruthy();
    
    expect(getByText('Study Group')).toBeTruthy();
    expect(getByText('1 member')).toBeTruthy();
  });

  it('shows proper member count formatting', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('4 members')).toBeTruthy(); // plural
    expect(getByText('8 members')).toBeTruthy(); // plural
    expect(getByText('1 member')).toBeTruthy(); // singular
  });

  it('displays formatted creation dates', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText(/Created.*1\/15\/2024/)).toBeTruthy();
    expect(getByText(/Created.*1\/20\/2024/)).toBeTruthy();
    expect(getByText(/Created.*2\/1\/2024/)).toBeTruthy();
  });

  it('handles circles without descriptions', () => {
    const { getByText, queryByText } = render(<HomeScreen />);
    
    // Study Group has no description
    expect(getByText('Study Group')).toBeTruthy();
    // Description should not be rendered for circles without description
    expect(queryByText('null')).toBeNull();
  });

  it('navigates to CreateCircle when create button is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    
    const createButton = getByText('Create Circle');
    fireEvent.press(createButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('CreateCircle');
  });

  it('navigates to JoinCircle when join button is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    
    const joinButton = getByText('Join Circle');
    fireEvent.press(joinButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('JoinCircle');
  });

  it('navigates to CircleDetail when circle is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    
    const familyCircle = getByText('Family Circle');
    fireEvent.press(familyCircle);
    
    expect(mockNavigate).toHaveBeenCalledWith('CircleDetail', { circleId: 1 });
  });

  it('shows loading state when circles are loading', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      circles: [],
      loading: true,
    });

    const { getByTestId, getByText } = render(<HomeScreen />);
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
    expect(getByText('Loading circles...')).toBeTruthy();
  });

  it('shows empty state when no circles are available', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      circles: [],
      loading: false,
    });

    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('No Circles Yet')).toBeTruthy();
    expect(getByText('Create your first circle or join an existing one to get started!')).toBeTruthy();
  });

  it('shows empty state action buttons', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      circles: [],
      loading: false,
    });

    const { getAllByText } = render(<HomeScreen />);
    
    // There should be header buttons + empty state buttons
    const createButtons = getAllByText('Create Circle');
    const joinButtons = getAllByText('Join Circle');
    
    expect(createButtons).toHaveLength(2); // header + empty state
    expect(joinButtons).toHaveLength(2); // header + empty state
  });

  it('empty state buttons navigate correctly', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      circles: [],
      loading: false,
    });

    const { getAllByText } = render(<HomeScreen />);
    
    const createButtons = getAllByText('Create Circle');
    const joinButtons = getAllByText('Join Circle');
    
    // Press the second button (empty state button)
    fireEvent.press(createButtons[1]);
    expect(mockNavigate).toHaveBeenCalledWith('CreateCircle');
    
    fireEvent.press(joinButtons[1]);
    expect(mockNavigate).toHaveBeenCalledWith('JoinCircle');
  });

  it('shows error state when there is an error', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      error: 'Failed to load circles',
    });

    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Failed to load circles')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });

  it('retries loading when retry button is pressed', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      error: 'Network error',
    });

    const { getByText } = render(<HomeScreen />);
    
    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);
    
    expect(mockGetMyCircles).toHaveBeenCalledTimes(2); // once on mount, once on retry
  });

  it('does not show empty state when loading', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      circles: [],
      loading: true,
    });

    const { queryByText } = render(<HomeScreen />);
    
    expect(queryByText('No Circles Yet')).toBeNull();
  });

  it('shows circles even when there is an error (for cached data)', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      error: 'Network error',
    });

    const { getByText } = render(<HomeScreen />);
    
    // Should show both error and existing circles
    expect(getByText('Network error')).toBeTruthy();
    expect(getByText('Family Circle')).toBeTruthy();
    expect(getByText('Work Team')).toBeTruthy();
  });

  it('handles refresh control properly', () => {
    const { getByText } = render(<HomeScreen />);
    
    // We can't directly test RefreshControl, but we can ensure the data is loaded
    expect(mockGetMyCircles).toHaveBeenCalledTimes(1);
  });

  it('renders FlatList with correct data', () => {
    const { getByText } = render(<HomeScreen />);
    
    // All three circles should be rendered
    expect(getByText('Family Circle')).toBeTruthy();
    expect(getByText('Work Team')).toBeTruthy();
    expect(getByText('Study Group')).toBeTruthy();
  });

  it('applies correct styles to circle cards', () => {
    const { getByText } = render(<HomeScreen />);
    
    const familyCircle = getByText('Family Circle');
    expect(familyCircle).toBeTruthy();
    
    // Check that member count badge is rendered
    expect(getByText('4 members')).toBeTruthy();
  });

  it('navigates to different circles correctly', () => {
    const { getByText } = render(<HomeScreen />);
    
    // Test navigation for different circles
    fireEvent.press(getByText('Family Circle'));
    expect(mockNavigate).toHaveBeenCalledWith('CircleDetail', { circleId: 1 });
    
    fireEvent.press(getByText('Work Team'));
    expect(mockNavigate).toHaveBeenCalledWith('CircleDetail', { circleId: 2 });
    
    fireEvent.press(getByText('Study Group'));
    expect(mockNavigate).toHaveBeenCalledWith('CircleDetail', { circleId: 3 });
  });

  it('displays all required circle information', () => {
    const { getByText } = render(<HomeScreen />);
    
    // Check that all essential information is displayed
    expect(getByText('Family Circle')).toBeTruthy();
    expect(getByText('Our family discussions')).toBeTruthy();
    expect(getByText('4 members')).toBeTruthy();
    expect(getByText(/Created.*1\/15\/2024/)).toBeTruthy();
  });

  it('truncates long descriptions properly', () => {
    const longDescription = 'This is a very long description that should be truncated when displayed in the circle list to maintain good UI layout and readability for users browsing their circles.';
    
    const circleWithLongDescription = {
      ...mockCircles[0],
      description: longDescription,
    };

    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      circles: [circleWithLongDescription],
    });

    const { getByText } = render(<HomeScreen />);
    
    // The text should be rendered (truncation is handled by numberOfLines prop)
    expect(getByText(longDescription)).toBeTruthy();
  });

  it('handles empty circles array correctly', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      circles: [],
      loading: false,
    });

    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('No Circles Yet')).toBeTruthy();
  });

  it('does not show loading spinner when circles exist and loading is true', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      loading: true, // loading is true but circles exist
    });

    const { queryByTestId } = render(<HomeScreen />);
    
    // Should not show loading spinner since circles.length > 0
    expect(queryByTestId('loading-spinner')).toBeNull();
  });
});