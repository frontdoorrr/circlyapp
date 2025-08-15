import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../src/screens/auth/LoginScreen';
import { useAuthStore } from '../../src/store';

// Mock the auth store
jest.mock('../../src/store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock Device from expo-device
jest.mock('expo-device', () => ({
  osName: 'iOS',
  modelName: 'iPhone',
}));

describe('LoginScreen', () => {
  const mockLogin = jest.fn();
  const mockAuthStore = {
    login: mockLogin,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
  });

  it('renders login screen elements', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    expect(getByText('Welcome to Circly')).toBeTruthy();
    expect(getByText('Login with Device ID')).toBeTruthy();
    expect(getByText('Quick Login')).toBeTruthy();
    expect(getByPlaceholderText('Leave empty for auto-generation')).toBeTruthy();
  });

  it('calls login with device ID when Login button is pressed', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    const input = getByPlaceholderText('Leave empty for auto-generation');
    const loginButton = getByText('Login with Device ID');
    
    fireEvent.changeText(input, 'test-device-123');
    fireEvent.press(loginButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ device_id: 'test-device-123' });
    });
  });

  it('generates device ID when Quick Login is pressed', async () => {
    const { getByText } = render(<LoginScreen />);
    
    const quickLoginButton = getByText('Quick Login');
    fireEvent.press(quickLoginButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          device_id: expect.stringMatching(/^device_\d+_[a-z0-9]+$/)
        })
      );
    });
  });

  it('auto-generates device ID when login with empty input', async () => {
    const { getByText } = render(<LoginScreen />);
    
    const loginButton = getByText('Login with Device ID');
    fireEvent.press(loginButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          device_id: expect.stringMatching(/^iOS_iPhone_\d+$/)
        })
      );
    });
  });

  it('shows loading state', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      ...mockAuthStore,
      loading: true,
    });
    
    const { queryByText } = render(<LoginScreen />);
    
    // When loading, button text should not be visible (replaced by ActivityIndicator)
    expect(queryByText('Login with Device ID')).toBeNull();
    expect(queryByText('Quick Login')).toBeNull();
    
    // Should have ActivityIndicators instead (2 buttons = 2 indicators)
    // Note: ActivityIndicator doesn't have testID by default, so we just verify text is gone
  });

  it('displays error message', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      ...mockAuthStore,
      error: 'Login failed',
    });
    
    const { getByText } = render(<LoginScreen />);
    
    expect(getByText('Login failed')).toBeTruthy();
  });

  it('shows alert on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network error'));
    
    const { getByText } = render(<LoginScreen />);
    
    const loginButton = getByText('Login with Device ID');
    fireEvent.press(loginButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed', 
        'Network error'
      );
    });
  });
});