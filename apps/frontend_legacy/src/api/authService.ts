import apiClient from './client';
import { LoginDto } from './Api';

export interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
  middlename?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'HR' | 'FINANCIST';
  phone?: string;
  avatar?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// Тип для ответа API (с опциональными полями)
interface ApiUser {
  id?: number;
  email?: string;
  name?: string;
  surname?: string;
  middlename?: string;
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'HR' | 'FINANCIST';
  phone?: string;
  avatar?: string;
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  private convertApiUserToUser(apiUser: ApiUser): User {
    if (!apiUser.id || !apiUser.email || !apiUser.name || !apiUser.surname || !apiUser.role) {
      throw new Error('Incomplete user data received from API');
    }
    
    return {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.name,
      surname: apiUser.surname,
      middlename: apiUser.middlename,
      role: apiUser.role,
      phone: apiUser.phone,
      avatar: apiUser.avatar,
    };
  }

  async login(credentials: LoginDto): Promise<LoginResponse> {
    try {
      const response = await apiClient.auth.authControllerLogin(credentials);
      
      if (response.data.access_token && response.data.user) {
        const user = this.convertApiUserToUser(response.data.user);
        
        this.setToken(response.data.access_token);
        this.setUser(user);
        
        // Устанавливаем токен в API клиент
        apiClient.setSecurityData(response.data.access_token);
        
        return {
          access_token: response.data.access_token,
          user: user
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.error?.message || 'Ошибка входа в систему');
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    apiClient.setSecurityData(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
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
      apiClient.setSecurityData(token);
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
