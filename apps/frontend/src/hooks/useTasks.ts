import { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
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

export const useTasks = (initialFilter: TaskFilter = {}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);

  const fetchTasks = async (newFilter?: TaskFilter) => {
    try {
      setLoading(true);
      setError(null);
      const filterToUse = newFilter || filter;
      const response: TaskResponse = await taskService.getTasks(filterToUse);
      setTasks(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке задач');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (data: CreateTaskData): Promise<Task | null> => {
    try {
      setError(null);
      const newTask = await taskService.createTask(data);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании задачи');
      return null;
    }
  };

  const updateTask = async (id: number, data: UpdateTaskData): Promise<Task | null> => {
    try {
      setError(null);
      const updatedTask = await taskService.updateTask(id, data);
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении задачи');
      return null;
    }
  };

  const deleteTask = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении задачи');
      return false;
    }
  };

  const updateFilter = (newFilter: Partial<TaskFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    fetchTasks(updatedFilter);
  };

  const resetFilter = () => {
    const defaultFilter: TaskFilter = { page: 1, limit: 10 };
    setFilter(defaultFilter);
    fetchTasks(defaultFilter);
  };

  const changePage = (page: number) => {
    updateFilter({ page });
  };

  const changePageSize = (limit: number) => {
    updateFilter({ page: 1, limit });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    pagination,
    filter,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateFilter,
    resetFilter,
    changePage,
    changePageSize,
  };
};

export const useTaskStats = () => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTaskStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};

export const useTaskCategories = () => {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке категорий');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (data: CreateCategoryData): Promise<TaskCategory | null> => {
    try {
      setError(null);
      const newCategory = await taskService.createCategory(data);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании категории');
      return null;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
  };
};

export const useTask = (id: number) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTask(id);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке задачи');
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (data: UpdateTaskData): Promise<Task | null> => {
    try {
      setError(null);
      const updatedTask = await taskService.updateTask(id, data);
      setTask(updatedTask);
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении задачи');
      return null;
    }
  };

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

  return {
    task,
    loading,
    error,
    fetchTask,
    updateTask,
  };
};
