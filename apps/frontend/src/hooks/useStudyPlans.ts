import { useState, useEffect } from 'react';
import { studyPlanService } from '../services/studyPlanService';
import { StudyPlan, StudyPlanFilters, StudyPlanResponse, Group, Teacher } from '../types/studyPlan';
import { useAuth } from './useAuth';

export const useStudyPlans = (initialFilters: StudyPlanFilters = {}, useStudentMode: boolean = false) => {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudyPlanFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchStudyPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      // Используем разные методы в зависимости от роли
      const response: StudyPlanResponse = useStudentMode 
        ? await studyPlanService.getMyStudyPlans(filters)
        : await studyPlanService.getStudyPlans(filters);
      setStudyPlans(response.data);
      setPagination({
        page: response.meta.currentPage,
        limit: response.meta.itemsPerPage,
        total: response.meta.totalItems,
        totalPages: response.meta.totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки учебных планов');
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<StudyPlanFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const changePage = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const refetch = () => {
    fetchStudyPlans();
  };

  useEffect(() => {
    fetchStudyPlans();
  }, [filters, useStudentMode]);

  return {
    studyPlans,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    changePage,
    refetch
  };
};

export const useStudyPlan = (id: string) => {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudyPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studyPlanService.getStudyPlan(id);
      setStudyPlan(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки учебного плана');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudyPlan();
    }
  }, [id]);

  return {
    studyPlan,
    loading,
    error,
    refetch: fetchStudyPlan
  };
};

export const useAvailableData = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [groupsResponse, teachersResponse] = await Promise.all([
        studyPlanService.getAvailableGroups(user?.role || 'STUDENT', user?.id),
        studyPlanService.getAvailableTeachers(user?.role || 'STUDENT', user?.id)
      ]);

      setGroups(groupsResponse);
      setTeachers(teachersResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableData();
  }, [user]);

  return {
    groups,
    teachers,
    loading,
    error,
    refetch: fetchAvailableData
  };
};
