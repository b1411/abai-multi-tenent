import { useState, useEffect } from 'react';
import { workloadService } from '../services/workloadService';
import type {
  TeacherWorkload,
  CreateWorkloadData,
  UpdateWorkloadData,
  WorkloadFilterParams,
  WorkloadAnalytics,
  AddDailyHoursData,
} from '../types/workload';
import type { PaginateResponseDto } from '../types/api';

export const useWorkloads = (initialFilters?: WorkloadFilterParams) => {
  const [workloads, setWorkloads] = useState<PaginateResponseDto<TeacherWorkload> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WorkloadFilterParams>(initialFilters || {});

  const fetchWorkloads = async (newFilters?: WorkloadFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const currentFilters = newFilters || filters;
      const response = await workloadService.getWorkloads(currentFilters);
      setWorkloads(response);
      if (newFilters) {
        setFilters(newFilters);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки нагрузок');
    } finally {
      setLoading(false);
    }
  };

  const createWorkload = async (data: CreateWorkloadData) => {
    setLoading(true);
    setError(null);
    try {
      const newWorkload = await workloadService.createWorkload(data);
      await fetchWorkloads(); // Обновляем список
      return newWorkload;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания нагрузки');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkload = async (id: number, data: UpdateWorkloadData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedWorkload = await workloadService.updateWorkload(id, data);
      await fetchWorkloads(); // Обновляем список
      return updatedWorkload;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления нагрузки');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkload = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await workloadService.deleteWorkload(id);
      await fetchWorkloads(); // Обновляем список
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления нагрузки');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloads();
  }, []);

  return {
    workloads,
    loading,
    error,
    filters,
    fetchWorkloads,
    createWorkload,
    updateWorkload,
    deleteWorkload,
    setFilters,
  };
};

export const useWorkloadDetail = (id: number | null) => {
  const [workload, setWorkload] = useState<TeacherWorkload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkload = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await workloadService.getWorkloadById(id);
      setWorkload(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки нагрузки');
    } finally {
      setLoading(false);
    }
  };

  const addDailyHours = async (data: AddDailyHoursData) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      await workloadService.addDailyHours(id, data);
      await fetchWorkload(); // Обновляем данные
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка добавления часов');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, [id]);

  return {
    workload,
    loading,
    error,
    fetchWorkload,
    addDailyHours,
  };
};

export const useWorkloadAnalytics = (filters?: WorkloadFilterParams) => {
  const [analytics, setAnalytics] = useState<WorkloadAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (newFilters?: WorkloadFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await workloadService.getAnalytics(newFilters || filters);
      setAnalytics(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
  };
};

export const useTeacherWorkloads = (teacherId: number | null, academicYear?: string) => {
  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacherWorkloads = async () => {
    if (!teacherId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await workloadService.getWorkloadsByTeacher(teacherId, academicYear);
      setWorkloads(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки нагрузок преподавателя');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherWorkloads();
  }, [teacherId, academicYear]);

  return {
    workloads,
    loading,
    error,
    fetchTeacherWorkloads,
  };
};
