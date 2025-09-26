import apiClient from './apiClient';

export const userService = {
  async getUsersByRole(role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN' | 'FINANCIST' | 'HR'): Promise<any[]> {
    return await apiClient.get<any[]>(`/users/role/${role}`);
  },

  async updateUser(id: number, userData: any): Promise<any> {
    return await apiClient.patch(`/users/${id}`, userData);
  },

  async updateTeacherProfile(teacherId: number, teacherData: any): Promise<any> {
    return await apiClient.patch(`/teachers/${teacherId}/profile`, teacherData);
  },

  async getUserById(id: number): Promise<any> {
    return await apiClient.get(`/users/${id}`);
  },
};
