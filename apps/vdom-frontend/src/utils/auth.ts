/**
 * Authentication utilities for managing user sessions
 */

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
}

export class AuthManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'user_profile';

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    try {
      // Basic JWT validation - check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Get current user profile
   */
  static getCurrentUser(): User | null {
    const userStr = sessionStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Set authentication token and user profile
   */
  static setAuth(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    
    try {
      // Decode JWT payload to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        email: payload.email,
        name: payload.name,
        isAdmin: payload.isAdmin || false
      };
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
    }
  }

  /**
   * Clear authentication data
   */
  static clearAuth(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get authentication token
   */
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Login with Google OAuth
   */
  static async loginWithGoogle(accessToken: string): Promise<void> {
    const response = await fetch('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Authentication failed');
    }

    const { jwt } = await response.json();
    this.setAuth(jwt);
  }
}
