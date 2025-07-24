import apiClient from './apiClient';
import {
  Task,
  TaskResponse,
  CreateTaskData,
  UpdateTaskData,
  TaskFilter,
  TaskStats,
  TaskCategory,
  CreateCategoryData,
} from '../types/task';

export const taskService = {
  // Получить список задач
  async getTasks(filter: TaskFilter = {}): Promise<TaskResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiClient.get<TaskResponse>(`/tasks?${params.toString()}`);
  },

  // Получить задачу по ID
  async getTask(id: number): Promise<Task> {
    return await apiClient.get<Task>(`/tasks/${id}`);
  },

  // Создать новую задачу
  async createTask(data: CreateTaskData): Promise<Task> {
    return await apiClient.post<Task>('/tasks', data);
  },

  // Обновить задачу
  async updateTask(id: number, data: UpdateTaskData): Promise<Task> {
    return await apiClient.patch<Task>(`/tasks/${id}`, data);
  },

  // Удалить задачу
  async deleteTask(id: number): Promise<void> {
    await apiClient.delete<void>(`/tasks/${id}`);
  },

  // Получить статистику задач
  async getTaskStats(): Promise<TaskStats> {
    return await apiClient.get<TaskStats>('/tasks/stats');
  },

  // Получить категории задач
  async getCategories(): Promise<TaskCategory[]> {
    return await apiClient.get<TaskCategory[]>('/tasks/categories');
  },

  // Создать категорию
  async createCategory(data: CreateCategoryData): Promise<TaskCategory> {
    return await apiClient.post<TaskCategory>('/tasks/categories', data);
  },
};
