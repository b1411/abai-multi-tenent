import { ApiResponse } from '../types/api';
import {
  SystemSettings,
  User,
  Role,
  BrandingSettings,
  Integration,
  CreateUserDto,
  UpdateUserDto,
  CreateRoleDto,
  UpdateRoleDto,
  CreateIntegrationDto,
  UpdateIntegrationDto
} from '../types/system';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SystemService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token');
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // System Settings
  async getSystemSettings(): Promise<ApiResponse<SystemSettings>> {
    return this.request('system/settings');
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    return this.request('system/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async downloadBackup(): Promise<Blob> {
    const token = localStorage.getItem('token');
    const url = `${API_URL}system/backup`;
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // Users
  async getUsers(params?: { search?: string; role?: string; status?: string }): Promise<ApiResponse<User[]>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    return this.request(`system/users?${searchParams.toString()}`);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request(`system/users/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<ApiResponse<User>> {
    return this.request('system/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<ApiResponse<User>> {
    return this.request(`system/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request(`system/users/${id}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(id: string): Promise<ApiResponse<{ password: string }>> {
    return this.request(`system/users/${id}/reset-password`, {
      method: 'POST',
    });
  }

  // Roles & Permissions
  async getRoles(): Promise<ApiResponse<Role[]>> {
    return this.request('system/roles');
  }

  async getRole(id: string): Promise<ApiResponse<Role>> {
    return this.request(`system/roles/${id}`);
  }

  async createRole(data: CreateRoleDto): Promise<ApiResponse<Role>> {
    return this.request('system/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: UpdateRoleDto): Promise<ApiResponse<Role>> {
    return this.request(`system/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    return this.request(`system/roles/${id}`, {
      method: 'DELETE',
    });
  }

  async getAvailablePermissions(): Promise<ApiResponse<{ module: string; permissions: string[] }[]>> {
    return this.request('/system/permissions');
  }

  // Branding
  async getBrandingSettings(): Promise<ApiResponse<BrandingSettings>> {
    return this.request('/system/branding');
  }

  async updateBrandingSettings(settings: Partial<BrandingSettings>): Promise<ApiResponse<BrandingSettings>> {
    return this.request('/system/branding', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async uploadLogo(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('logo', file);

    const token = localStorage.getItem('token');
    const url = `${API_URL}/system/branding/logo`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async uploadFavicon(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('favicon', file);

    const token = localStorage.getItem('token');
    const url = `${API_URL}/system/branding/favicon`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Integrations
  async getIntegrations(): Promise<ApiResponse<Integration[]>> {
    return this.request('/system/integrations');
  }

  async getIntegration(id: string): Promise<ApiResponse<Integration>> {
    return this.request(`/system/integrations/${id}`);
  }

  async createIntegration(data: CreateIntegrationDto): Promise<ApiResponse<Integration>> {
    return this.request('/system/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIntegration(id: string, data: UpdateIntegrationDto): Promise<ApiResponse<Integration>> {
    return this.request(`/system/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIntegration(id: string): Promise<ApiResponse<void>> {
    return this.request(`/system/integrations/${id}`, {
      method: 'DELETE',
    });
  }

  async connectIntegration(id: string): Promise<ApiResponse<Integration>> {
    return this.request(`/system/integrations/${id}/connect`, {
      method: 'POST',
    });
  }

  async disconnectIntegration(id: string): Promise<ApiResponse<Integration>> {
    return this.request(`/system/integrations/${id}/disconnect`, {
      method: 'POST',
    });
  }

  async syncIntegration(id: string): Promise<ApiResponse<void>> {
    return this.request(`/system/integrations/${id}/sync`, {
      method: 'POST',
    });
  }
}

export const systemService = new SystemService();
