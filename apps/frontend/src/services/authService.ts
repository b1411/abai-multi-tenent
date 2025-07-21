import { LoginDto, LoginResponse, User } from '../types/api';
import apiClient from './apiClient';

class AuthService {
  private tokenKey = 'token';
  private userKey = 'user';

  async login(credentials: LoginDto): Promise<LoginResponse> {
    try {
      const response = await apiClient.login(credentials);
      
      if (response.access_token && response.user) {
        this.setToken(response.access_token);
        this.setUser(response.user);
        
        // Set token in API client
        apiClient.setToken(response.access_token);
        
        return response;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Authentication failed');
    }
  }

  logout(): void {
    this.clearAuthData();
  }

  private clearAuthData(): void {
    // Clear all auth-related data from localStorage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    
    // Clear token in API client
    apiClient.setToken(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    // Also set in API client
    apiClient.setToken(token);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  initializeFromStorage(): void {
    const token = this.getToken();
    if (token) {
      apiClient.setToken(token);
    }
  }

  hasRole(role: User['role']): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  hasAnyRole(roles: User['role'][]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }
}

export default new AuthService();
