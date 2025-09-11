import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  User,
} from '@shared/api-types';
import { apiRequest } from './queryClient';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/components/firebase/firebase.config'; 

class AuthService {
  private tokenKey = 'medusavr_access_token';
  private refreshKey = 'medusavr_refresh_token';
  private userKey = 'medusavr_user';

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setTokens(accessToken: string, refreshToken: string, user: User) {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshKey, refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private clearTokens() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.userKey);
  }

  register = async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      // Import CSRF protection for registration requests
      const { secureApiRequest } = await import('../utils/csrfProtection');
      const response = await secureApiRequest('POST', '/api/auth/register', data);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(errorData.message || `Registration failed with status ${response.status}`);
      }
      
      const authData: AuthResponse = await response.json();
      this.setTokens(authData.accessToken, authData.refreshToken, authData.user);
      return authData;
    } catch (error) {
      console.error('Registration error in authService:', error);
      throw error;
    }
  };

  login = async (data: LoginRequest): Promise<AuthResponse> => {
    // Import CSRF protection for login requests
    const { secureApiRequest } = await import('../utils/csrfProtection');
    const response = await secureApiRequest('POST', '/api/auth/login', data);
    const authData: AuthResponse = await response.json();
    this.setTokens(authData.accessToken, authData.refreshToken, authData.user);
    return authData;
  };

  //key taht uses 
  refreshAccessToken = async (): Promise<string> => {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await apiRequest('POST', '/api/auth/refresh', { refreshToken });
    const data = await response.json();
    localStorage.setItem(this.tokenKey, data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(this.refreshKey, data.refreshToken);
    }
    return data.accessToken;
  };

  //logoout promise
  logout = async (): Promise<void> => {
    try {
      // Import CSRF protection for logout requests
      const { secureApiRequest } = await import('../utils/csrfProtection');
      await secureApiRequest('POST', '/api/auth/logout', {});
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  };

  // Fetches the user profile from the server and updates local storage
  getProfile = async (): Promise<User> => {
    const response = await apiRequest('GET', '/api/auth/me');
    const user: User = await response.json();
    localStorage.setItem(this.userKey, JSON.stringify(user));
    return user;
  };

  //same but updates the profile
  updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiRequest('PUT', '/api/auth/me', data);
    const user: User = await response.json();
    localStorage.setItem(this.userKey, JSON.stringify(user));
    return user;
  };

  changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    await apiRequest('PATCH', '/api/auth/me/password', data);
  };

  requestPasswordReset = async (data: PasswordResetRequest): Promise<void> => {
    await apiRequest('POST', '/api/auth/password-reset/request', data);
  };

  confirmPasswordReset = async (data: PasswordResetConfirmRequest): Promise<void> => {
    await apiRequest('POST', '/api/auth/password-reset/confirm', data);
  };

  uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const user = this.getUser();
    if (!user) throw new Error('User not authenticated');
    const response = await fetch(`/api/users/${user.id}/avatar`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    return await response.json();
  };

  deleteAvatar = async (): Promise<void> => {
    const user = this.getUser();
    if (!user) throw new Error('User not authenticated');
    await apiRequest('DELETE', `/api/users/${user.id}/avatar`);
  };

  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getUser();
  }

  // Clear tokens if they're invalid (e.g., JWT signature mismatch)
  clearInvalidTokens(): void {
    console.log('🧹 Clearing potentially invalid tokens');
    this.clearTokens();
  }  signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters to ensure local redirect
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('🔄 Starting Google sign-in...');
      
      let result;
      try {
        // Try popup first
        result = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // If popup is blocked, show error with instructions
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.message?.includes('popup') ||
            popupError.message?.includes('Cross-Origin-Opener-Policy')) {
          console.warn('🚫 Popup blocked, instructing user to allow popups');
          throw new Error('Please allow popups for this site and try again. You may need to click the Google sign-in button again.');
        }
        throw popupError;
      }
      
      console.log('✅ Google sign-in successful:', result.user.email);
      
      const idToken = await result.user.getIdToken();
      console.log('🔑 Got ID token, sending to backend...');

      const response = await apiRequest('POST', '/api/auth/google', { idToken });
      const authData: AuthResponse = await response.json();
      console.log('✅ Backend authentication successful');

      this.setTokens(authData.accessToken, authData.refreshToken, authData.user);
      return authData;
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      throw error;
    }
  };

  signUpWithGoogle = async (): Promise<AuthResponse> => {
    return this.signInWithGoogle();
  };

  handleGoogleCallback = async (code: string): Promise<AuthResponse> => {
    const response = await apiRequest('POST', '/api/auth/google/callback', { code });
    const authData: AuthResponse = await response.json();
    this.setTokens(authData.accessToken, authData.refreshToken, authData.user);
    return authData;
  };

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  ensureValidToken = async (): Promise<string> => {
    let token = this.getAccessToken();
    if (!token) throw new Error('No access token available');
    if (this.isTokenExpired(token)) {
      token = await this.refreshAccessToken();
    }
    return token;
  };
}

export const authService = new AuthService();