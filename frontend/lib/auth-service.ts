import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildUrl, getAuthHeaders } from './api-config';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: any;
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      expires_in: number;
    };
  };
  message: string;
}

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user'
};

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success && data.data.session) {
        // Store tokens securely
        await this.storeTokens(data.data.session);
        await this.storeUser(data.data.user);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success && data.data.session) {
        await this.storeTokens(data.data.session);
        await this.storeUser(data.data.user);
      }

      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // Store tokens securely
  private async storeTokens(session: any) {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, session.access_token],
      [STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token]
    ]);
  }

  // Store user data
  private async storeUser(user: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  // Get stored access token
  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  // Get stored user
  async getUser() {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  // Logout
  async logout() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER
    ]);
  }

  // Get auth headers for API calls
  async getAuthHeaders() {
    const token = await this.getAccessToken();
    return getAuthHeaders(token || undefined);
  }
}

export const authService = new AuthService();
