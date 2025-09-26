import apiClient from './apiClient';

export const userService = {
  async getUsersByRole(role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN' | 'FINANCIST' | 'HR'): Promise<any[]> {
    return await apiClient.get<any[]>(`/users/role/${role}`);
  },
};

