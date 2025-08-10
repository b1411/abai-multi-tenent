import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginDto, LoginResponse } from '../types/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private isRedirecting: boolean = false;

  constructor() {
    let baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    baseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL; // Ensure no trailing slash
    this.client = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on init
    this.loadTokenFromStorage();

    // Request interceptor to add token and enforce fresh data for specific endpoints
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

  // No cache-busting: rely on server-side freshness and client state updates

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle 401 unauthorized errors
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private loadTokenFromStorage() {
    const token = localStorage.getItem('token');
    if (token) {
      this.token = token;
    }
  }

  private handleUnauthorized() {
    // Prevent multiple redirects
    if (this.isRedirecting) {
      return;
    }

    this.isRedirecting = true;

    // Clear all authentication data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');

    // Clear token in memory
    this.token = null;

    // Redirect to login page
    // Use replace to prevent going back to the protected page
    if (typeof window !== 'undefined') {
      // Add a small delay to ensure localStorage is cleared
      setTimeout(() => {
        window.location.replace('/login');
      }, 100);
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url);
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }

  async postFormData<T>(url: string, formData: FormData): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getBlob(url: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.client.get(url, {
      responseType: 'blob',
    });
    return response.data;
  }

  async postBlob(url: string, data?: unknown): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.client.post(url, data, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new ApiClient();
