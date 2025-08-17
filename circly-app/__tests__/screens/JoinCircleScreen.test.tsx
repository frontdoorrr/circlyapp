import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import JoinCircleScreen from '../../src/screens/circle/JoinCircleScreen';
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

// Mock Clipboard
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

describe('JoinCircleScreen', () => {
  const mockJoinCircle = jest.fn();
  const mockClearError = jest.fn();
  const mockCircleStore = {
    joinCircle: mockJoinCircle,
    clearError: mockClearError,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCircleStore as jest.Mock).mockReturnValue(mockCircleStore);
  });

  it('renders join circle form elements', () => {
    const { getByText, getByPlaceholderText } = render(<JoinCircleScreen />);
    
    expect(getByText('Join a Circle')).toBeTruthy();
    expect(getByText('Invite Code *')).toBeTruthy();
    expect(getByPlaceholderText('Enter invite code (e.g., ABC12345)')).toBeTruthy();
    expect(getByText('Join Circle')).toBeTruthy();
    expect(getByText('Need help?')).toBeTruthy();
  });

  it('validates required invite code', async () => {
    const { getByText, queryByText } = render(<JoinCircleScreen />);
    
    const joinButton = getByText('Join Circle');
    fireEvent.press(joinButton);
    
    // Button should be disabled when input is empty
    expect(mockJoinCircle).not.toHaveBeenCalled();
  });

  it('validates invite code length (minimum)', async () => {
    const { getByPlaceholderText, getByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    fireEvent.changeText(codeInput, 'ABC12');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(getByText('Invite code must be at least 6 characters')).toBeTruthy();
    });
    
    expect(mockJoinCircle).not.toHaveBeenCalled();
  });

  it('validates invite code length (maximum)', async () => {
    const { getByPlaceholderText, getByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    fireEvent.changeText(codeInput, 'A'.repeat(21));
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(getByText('Invite code must be less than 20 characters')).toBeTruthy();
    });
    
    expect(mockJoinCircle).not.toHaveBeenCalled();
  });

  it('validates invite code format', async () => {
    const { getByPlaceholderText, getByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    fireEvent.changeText(codeInput, 'ABC123!@');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(getByText('Invite code can only contain letters and numbers')).toBeTruthy();
    });
    
    expect(mockJoinCircle).not.toHaveBeenCalled();
  });

  it('clears validation errors when user starts typing', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    // Trigger validation error
    fireEvent.changeText(codeInput, 'ABC12');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(getByText('Invite code must be at least 6 characters')).toBeTruthy();
    });
    
    // Start typing to clear error
    fireEvent.changeText(codeInput, 'ABC123');
    
    await waitFor(() => {
      expect(queryByText('Invite code must be at least 6 characters')).toBeNull();
    });
  });

  it('joins circle successfully', async () => {
    const mockCircle = {
      id: 1,
      name: 'Test Circle',
      description: 'A test circle',
      invite_code: 'ABC12345',
      creator_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      member_count: 2,
    };
    
    mockJoinCircle.mockResolvedValueOnce(mockCircle);
    
    const { getByPlaceholderText, getByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    fireEvent.changeText(codeInput, 'abc12345');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(mockJoinCircle).toHaveBeenCalledWith({
        invite_code: 'ABC12345',
      });
    });
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Successfully Joined!',
      expect.stringContaining('Test Circle'),
      expect.any(Array)
    );
  });

  it('handles join error - invalid invite code', async () => {
    const error = new Error('Invalid invite code');
    mockJoinCircle.mockRejectedValueOnce(error);
    
    const { getByPlaceholderText, getByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    fireEvent.changeText(codeInput, 'INVALID1');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Join Failed',
        'Invalid invite code. Please check and try again.',
        [{ text: 'OK' }]
      );
    });
  });

  it('handles join error - already a member', async () => {
    const error = new Error('Already a member of this circle');
    mockJoinCircle.mockRejectedValueOnce(error);
    
    const { getByPlaceholderText, getByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    fireEvent.changeText(codeInput, 'ABC12345');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Join Failed',
        'You are already a member of this circle.',
        [{ text: 'OK' }]
      );
    });
  });

  it('handles join error - circle not found', async () => {
    const error = new Error('Circle not found');
    mockJoinCircle.mockRejectedValueOnce(error);
    
    const { getByPlaceholderText, getByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    fireEvent.changeText(codeInput, 'NOTFOUND');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Join Failed',
        'This invite code is expired or invalid.',
        [{ text: 'OK' }]
      );
    });
  });

  it('shows loading state', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      loading: true,
    });
    
    const { queryByText } = render(<JoinCircleScreen />);
    
    // Button text should be hidden during loading
    expect(queryByText('Join Circle')).toBeNull();
  });

  it('shows store error', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      error: 'Network error',
    });
    
    const { getByText } = render(<JoinCircleScreen />);
    
    expect(getByText('Network error')).toBeTruthy();
  });

  it('disables join button when code is empty', () => {
    const { getByText } = render(<JoinCircleScreen />);
    
    const joinButton = getByText('Join Circle');
    
    // Button should be disabled when code is empty
    expect(joinButton).toBeTruthy();
  });

  it('pastes from clipboard when paste button is pressed', async () => {
    const mockClipboardContent = 'CLIPBOARD123';
    (Clipboard.getStringAsync as jest.Mock).mockResolvedValueOnce(mockClipboardContent);
    
    const { getByLabelText, getByDisplayValue } = render(<JoinCircleScreen />);
    
    const pasteButton = getByLabelText('Paste from clipboard');
    fireEvent.press(pasteButton);
    
    await waitFor(() => {
      expect(Clipboard.getStringAsync).toHaveBeenCalled();
      expect(getByDisplayValue('CLIPBOARD123')).toBeTruthy();
    });
  });

  it('clears input when clear button is pressed', async () => {
    const { getByPlaceholderText, getByLabelText, queryByDisplayValue } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    
    // Type some text
    fireEvent.changeText(codeInput, 'ABC12345');
    
    // Clear button should appear
    const clearButton = getByLabelText('Clear input');
    fireEvent.press(clearButton);
    
    await waitFor(() => {
      expect(queryByDisplayValue('ABC12345')).toBeNull();
    });
  });

  it('navigates to create circle when create button is pressed', () => {
    const { getByText } = render(<JoinCircleScreen />);
    
    const createButton = getByText('Create Your Own Circle');
    fireEvent.press(createButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('CreateCircle');
  });

  it('converts invite code to uppercase', async () => {
    const mockCircle = {
      id: 1,
      name: 'Test Circle',
      description: 'A test circle',
      invite_code: 'ABC12345',
      creator_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      member_count: 2,
    };
    
    mockJoinCircle.mockResolvedValueOnce(mockCircle);
    
    const { getByPlaceholderText, getByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    // Enter lowercase code
    fireEvent.changeText(codeInput, 'abc12345');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(mockJoinCircle).toHaveBeenCalledWith({
        invite_code: 'ABC12345', // Should be converted to uppercase
      });
    });
  });

  it('shows success alert with navigation options', async () => {
    const mockCircle = {
      id: 1,
      name: 'Success Circle',
      description: 'A successful join',
      invite_code: 'SUCCESS1',
      creator_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      member_count: 3,
    };
    
    mockJoinCircle.mockResolvedValueOnce(mockCircle);
    
    const { getByPlaceholderText, getByText } = render(<JoinCircleScreen />);
    
    const codeInput = getByPlaceholderText('Enter invite code (e.g., ABC12345)');
    const joinButton = getByText('Join Circle');
    
    fireEvent.changeText(codeInput, 'SUCCESS1');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Successfully Joined!',
        expect.stringContaining('Success Circle'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Go to Circle' }),
          expect.objectContaining({ text: 'View My Circles' }),
        ])
      );
    });
  });

  it('shows help section with helpful information', () => {
    const { getByText } = render(<JoinCircleScreen />);
    
    expect(getByText('Need help?')).toBeTruthy();
    expect(getByText(/Ask your friend to share/)).toBeTruthy();
    expect(getByText(/Make sure the code is exactly/)).toBeTruthy();
    expect(getByText(/Invite codes are case-insensitive/)).toBeTruthy();
  });
});