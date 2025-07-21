import { useState, useEffect } from 'react';
import { lessonService } from '../services/lessonService';
import { Lesson, LessonFilters } from '../types/lesson';

interface UseLessonsOptions {
  initialFilters?: LessonFilters;
  autoLoad?: boolean;
}

export const useLessons = (options: UseLessonsOptions = {}) => {
  const { initialFilters = {}, autoLoad = true } = options;
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<LessonFilters>({
    page: 1,
    limit: 10,
    sortBy: 'date',
    order: 'desc',
    ...initialFilters
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const loadLessons = async (customFilters?: LessonFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtersToUse = customFilters || filters;
      const response = await lessonService.getLessons(filtersToUse);
      
      setLessons(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      console.error('Ошибка загрузки уроков:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<LessonFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    loadLessons(updatedFilters);
  };

  const changePage = (page: number) => {
    updateFilters({ page });
  };

  const refetch = () => {
    loadLessons();
  };

  useEffect(() => {
    if (autoLoad) {
      loadLessons();
    }
  }, []);

  return {
    lessons,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    changePage,
    refetch,
    loadLessons
  };
};
