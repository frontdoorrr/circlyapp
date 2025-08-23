import { apiClient } from './client';
import { 
  AuthResponse, 
  UserResponse, 
  LoginRequest, 
  UserUpdate,
  EmailLoginRequest,
  RegisterRequest,
  AccountMigrationRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  EmailVerificationRequest,
  ExtendedAuthResponse,
  PasswordStrengthResponse
} from '../../types';

export const authApi = {
  /**
   * Login with device ID
   */
  async login(loginData: LoginRequest): Promise<AuthResponse | null> {
    const response = await apiClient.post<AuthResponse>('/v1/auth/login', loginData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (response.data) {
      // Set token for future requests
      apiClient.setToken(response.data.access_token);
      return response.data;
    }
    
    return null;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/v1/auth/logout');
    } finally {
      // Always clear token, even if API call fails
      apiClient.clearToken();
    }
  },

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<UserResponse | null> {
    const response = await apiClient.get<UserResponse>('/v1/auth/me');
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Update current user profile
   */
  async updateProfile(updateData: UserUpdate): Promise<UserResponse | null> {
    const response = await apiClient.put<UserResponse>('/v1/users/me', updateData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: number): Promise<UserResponse | null> {
    const response = await apiClient.get<UserResponse>(`/v1/users/${userId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Email/password login
   */
  async emailLogin(loginData: EmailLoginRequest): Promise<ExtendedAuthResponse | null> {
    const response = await apiClient.post<ExtendedAuthResponse>('/v1/auth/email-login', loginData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (response.data) {
      // Set token for future requests
      apiClient.setToken(response.data.access_token);
      return response.data;
    }
    
    return null;
  },

  /**
   * Register with email/password
   */
  async register(registerData: RegisterRequest): Promise<ExtendedAuthResponse | null> {
    const response = await apiClient.post<ExtendedAuthResponse>('/v1/auth/register', registerData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (response.data) {
      // Set token for future requests
      apiClient.setToken(response.data.access_token);
      return response.data;
    }
    
    return null;
  },

  /**
   * Migrate device account to email account
   */
  async migrateAccount(migrationData: AccountMigrationRequest): Promise<ExtendedAuthResponse | null> {
    const response = await apiClient.post<ExtendedAuthResponse>('/v1/auth/migrate-account', migrationData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (response.data) {
      // Set token for future requests
      apiClient.setToken(response.data.access_token);
      return response.data;
    }
    
    return null;
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(resetData: PasswordResetRequest): Promise<void> {
    const response = await apiClient.post('/v1/auth/request-password-reset', resetData);
    
    if (response.error) {
      throw new Error(response.error);
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(resetData: PasswordResetConfirm): Promise<void> {
    const response = await apiClient.post('/v1/auth/reset-password', resetData);
    
    if (response.error) {
      throw new Error(response.error);
    }
  },

  /**
   * Change password (authenticated)
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    const response = await apiClient.post('/v1/auth/change-password', passwordData);
    
    if (response.error) {
      throw new Error(response.error);
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(verificationData: EmailVerificationRequest): Promise<void> {
    const response = await apiClient.post('/v1/auth/verify-email', verificationData);
    
    if (response.error) {
      throw new Error(response.error);
    }
  },

  /**
   * Check password strength
   */
  async checkPasswordStrength(password: string): Promise<PasswordStrengthResponse> {
    const response = await apiClient.post<PasswordStrengthResponse>('/v1/auth/check-password-strength', { password });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data!;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ExtendedAuthResponse | null> {
    const response = await apiClient.post<ExtendedAuthResponse>('/v1/auth/refresh-token', { refresh_token: refreshToken });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (response.data) {
      // Set new token for future requests
      apiClient.setToken(response.data.access_token);
      return response.data;
    }
    
    return null;
  },
};