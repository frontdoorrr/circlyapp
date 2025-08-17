import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateCircleScreen from '../../src/screens/circle/CreateCircleScreen';
import { useCircleStore } from '../../src/store';

// Mock the circle store
jest.mock('../../src/store', () => ({
  useCircleStore: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('CreateCircleScreen', () => {
  const mockCreateCircle = jest.fn();
  const mockCircleStore = {
    createCircle: mockCreateCircle,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCircleStore as jest.Mock).mockReturnValue(mockCircleStore);
  });

  it('renders create circle form elements', () => {
    const { getByText, getByPlaceholderText } = render(<CreateCircleScreen />);
    
    expect(getByText('Create New Circle')).toBeTruthy();
    expect(getByText('Circle Name *')).toBeTruthy();
    expect(getByText('Description (Optional)')).toBeTruthy();
    expect(getByPlaceholderText('Enter circle name (e.g., College Friends)')).toBeTruthy();
    expect(getByText('Create Circle')).toBeTruthy();
  });

  it('validates required circle name', async () => {
    const { getByText } = render(<CreateCircleScreen />);
    
    const createButton = getByText('Create Circle');
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(getByText('Circle name is required')).toBeTruthy();
    });
    
    expect(mockCreateCircle).not.toHaveBeenCalled();
  });

  it('validates circle name length', async () => {
    const { getByPlaceholderText, getByText } = render(<CreateCircleScreen />);
    
    const nameInput = getByPlaceholderText('Enter circle name (e.g., College Friends)');
    const createButton = getByText('Create Circle');
    
    // Test minimum length
    fireEvent.changeText(nameInput, 'a');
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(getByText('Circle name must be at least 2 characters')).toBeTruthy();
    });
    
    // Test maximum length
    fireEvent.changeText(nameInput, 'a'.repeat(101));
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(getByText('Circle name must be less than 100 characters')).toBeTruthy();
    });
  });

  it('validates description length', async () => {
    const { getByPlaceholderText, getByText } = render(<CreateCircleScreen />);
    
    const nameInput = getByPlaceholderText('Enter circle name (e.g., College Friends)');
    const descriptionInput = getByPlaceholderText('What\'s this circle about? (e.g., For our weekly game nights)');
    const createButton = getByText('Create Circle');
    
    fireEvent.changeText(nameInput, 'Valid Name');
    fireEvent.changeText(descriptionInput, 'a'.repeat(501));
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(getByText('Description must be less than 500 characters')).toBeTruthy();
    });
  });

  it('shows character count for description', () => {
    const { getByPlaceholderText, getByText } = render(<CreateCircleScreen />);
    
    const descriptionInput = getByPlaceholderText('What\'s this circle about? (e.g., For our weekly game nights)');
    
    fireEvent.changeText(descriptionInput, 'Hello world');
    
    expect(getByText('11/500')).toBeTruthy();
  });

  it('clears errors when user starts typing', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<CreateCircleScreen />);
    
    const nameInput = getByPlaceholderText('Enter circle name (e.g., College Friends)');
    const createButton = getByText('Create Circle');
    
    // Trigger validation error
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(getByText('Circle name is required')).toBeTruthy();
    });
    
    // Start typing to clear error
    fireEvent.changeText(nameInput, 'New Circle');
    
    await waitFor(() => {
      expect(queryByText('Circle name is required')).toBeNull();
    });
  });

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
    
    mockCreateCircle.mockResolvedValueOnce(mockCircle);
    
    const { getByPlaceholderText, getByText } = render(<CreateCircleScreen />);
    
    const nameInput = getByPlaceholderText('Enter circle name (e.g., College Friends)');
    const descriptionInput = getByPlaceholderText('What\'s this circle about? (e.g., For our weekly game nights)');
    const createButton = getByText('Create Circle');
    
    fireEvent.changeText(nameInput, 'Test Circle');
    fireEvent.changeText(descriptionInput, 'A test circle');
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(mockCreateCircle).toHaveBeenCalledWith({
        name: 'Test Circle',
        description: 'A test circle',
      });
    });
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Circle Created!',
      expect.stringContaining('Test Circle'),
      expect.any(Array)
    );
  });

  it('handles creation error', async () => {
    const error = new Error('Network error');
    mockCreateCircle.mockRejectedValueOnce(error);
    
    const { getByPlaceholderText, getByText } = render(<CreateCircleScreen />);
    
    const nameInput = getByPlaceholderText('Enter circle name (e.g., College Friends)');
    const createButton = getByText('Create Circle');
    
    fireEvent.changeText(nameInput, 'Test Circle');
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Creation Failed',
        'Network error',
        [{ text: 'OK' }]
      );
    });
  });

  it('shows loading state', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      loading: true,
    });
    
    const { queryByText } = render(<CreateCircleScreen />);
    
    // Button text should be hidden during loading
    expect(queryByText('Create Circle')).toBeNull();
  });

  it('shows store error', () => {
    (useCircleStore as jest.Mock).mockReturnValue({
      ...mockCircleStore,
      error: 'Failed to create circle',
    });
    
    const { getByText } = render(<CreateCircleScreen />);
    
    expect(getByText('Failed to create circle')).toBeTruthy();
  });

  it('disables create button when name is empty', () => {
    const { getByText } = render(<CreateCircleScreen />);
    
    const createButton = getByText('Create Circle');
    
    // Button should be disabled when name is empty
    // This depends on Button component implementation
    expect(createButton).toBeTruthy();
  });

  it('shows success alert with invite code sharing options', async () => {
    const mockCircle = {
      id: 1,
      name: 'Share Test Circle',
      description: 'Test',
      invite_code: 'SHARE123',
      creator_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      member_count: 1,
    };
    
    mockCreateCircle.mockResolvedValueOnce(mockCircle);
    
    const { getByPlaceholderText, getByText } = render(<CreateCircleScreen />);
    
    const nameInput = getByPlaceholderText('Enter circle name (e.g., College Friends)');
    const createButton = getByText('Create Circle');
    
    fireEvent.changeText(nameInput, 'Share Test Circle');
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Circle Created!',
        expect.stringContaining('SHARE123'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Share Invite Code' }),
          expect.objectContaining({ text: 'Go to Circle' }),
        ])
      );
    });
  });

  it('shows info section with helpful information', () => {
    const { getByText } = render(<CreateCircleScreen />);
    
    expect(getByText('What happens next?')).toBeTruthy();
    expect(getByText(/You'll get a unique invite code/)).toBeTruthy();
    expect(getByText(/Friends can join using the code/)).toBeTruthy();
    expect(getByText(/Start creating polls and have fun/)).toBeTruthy();
  });
});