import { useState, useEffect } from 'react';
import { teacherService } from '../services/teacherService';
import type { Teacher, TeacherFilters, TeacherStatistics } from '../types/teacher';

export const useTeachers = (filters?: TeacherFilters) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      
      if (filters && Object.keys(filters).length > 0) {
        data = await teacherService.filterTeachers(filters);
      } else {
        data = await teacherService.getTeachers();
      }
      
      setTeachers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке преподавателей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [JSON.stringify(filters)]);

  const refreshTeachers = () => {
    fetchTeachers();
  };

  return {
    teachers,
    loading,
    error,
    refreshTeachers
  };
};

export const useTeacher = (id: number | null) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacher = async (teacherId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherService.getTeacher(teacherId);
      setTeacher(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке преподавателя');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTeacher(id);
    } else {
      setTeacher(null);
    }
  }, [id]);

  const refreshTeacher = () => {
    if (id) {
      fetchTeacher(id);
    }
  };

  return {
    teacher,
    loading,
    error,
    refreshTeacher
  };
};

export const useTeacherStatistics = () => {
  const [statistics, setStatistics] = useState<TeacherStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherService.getTeacherStatistics();
      setStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const refreshStatistics = () => {
    fetchStatistics();
  };

  return {
    statistics,
    loading,
    error,
    refreshStatistics
  };
};

export const useTeacherActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTeacher = async (teacherData: { userId: number; specialization?: string; qualification?: string; experience?: number }) => {
    try {
      setLoading(true);
      setError(null);
      const teacher = await teacherService.createTeacher(teacherData);
      return teacher;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании преподавателя');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTeacher = async (id: number, teacherData: { specialization?: string; qualification?: string; experience?: number }) => {
    try {
      setLoading(true);
      setError(null);
      const teacher = await teacherService.updateTeacher(id, teacherData);
      return teacher;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении преподавателя');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTeacher = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await teacherService.deleteTeacher(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении преподавателя');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportTeachers = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    try {
      setLoading(true);
      setError(null);
      const blob = await teacherService.exportTeachers(format);
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teachers.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при экспорте данных');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changeEmploymentType = async (id: number, newType: 'STAFF' | 'PART_TIME') => {
    try {
      setLoading(true);
      setError(null);
      const teacher = await teacherService.changeEmploymentType(id, newType);
      return teacher;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при изменении типа занятости');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTeacher,
    updateTeacher,
    deleteTeacher,
    exportTeachers,
    changeEmploymentType,
    loading,
    error
  };
};
