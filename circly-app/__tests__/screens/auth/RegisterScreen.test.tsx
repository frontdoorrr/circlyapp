import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../../../src/screens/auth/RegisterScreen';
import { authApi } from '../../../src/services/api';

// Mock dependencies
jest.mock('../../../src/services/api', () => ({
  authApi: {
    register: jest.fn(),
    checkPasswordStrength: jest.fn(),
  },
}));

jest.mock('../../../src/store', () => ({
  useAuthStore: jest.fn(() => ({
    register: jest.fn(),
    loading: false,
    error: null,
  })),
}));

jest.spyOn(Alert, 'alert');

const mockNavigation = {
  navigate: jest.fn(),
};

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />
    );

    expect(getByText('회원가입')).toBeTruthy();
    expect(getByText('이메일 계정으로 더 안전하게 시작하세요')).toBeTruthy();
    expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(getByPlaceholderText('username')).toBeTruthy();
    expect(getByPlaceholderText('안전한 비밀번호를 입력하세요')).toBeTruthy();
  });

  it('validates email format', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('your@email.com');
    const registerButton = getByText('회원가입');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(getByText('올바른 이메일 형식을 입력해주세요.')).toBeTruthy();
    });
  });

  it('validates password confirmation', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('your@email.com');
    const usernameInput = getByPlaceholderText('username');
    const passwordInput = getByPlaceholderText('안전한 비밀번호를 입력하세요');
    const confirmPasswordInput = getByPlaceholderText('비밀번호를 다시 입력하세요');
    const registerButton = getByText('회원가입');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'different');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(getByText('비밀번호가 일치하지 않습니다.')).toBeTruthy();
    });
  });

  it('navigates to login link', () => {
    const { getByText } = render(
      <RegisterScreen navigation={mockNavigation} />
    );

    const loginLink = getByText('이미 계정이 있으신가요? 로그인하기');
    fireEvent.press(loginLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });
});