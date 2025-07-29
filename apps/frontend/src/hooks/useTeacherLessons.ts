import { useState, useEffect } from 'react';
import { vacationService } from '../services/vacationService';

export interface TeacherLesson {
  id: number;
  name: string;
  description?: string;
  date: string;
  studyPlan: {
    id: number;
    name: string;
    description?: string;
  };
  groups: Array<{
    id: number;
    name: string;
  }>;
}

export interface TeacherLessonsResponse {
  teacher: {
    id: number;
    name: string;
  };
  lessons: TeacherLesson[];
}

export const useTeacherLessons = (teacherId?: number) => {
  const [data, setData] = useState<TeacherLessonsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = async () => {
    if (!teacherId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await vacationService.getTeacherLessons(teacherId);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки уроков');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [teacherId]);

  return {
    lessons: data?.lessons || [],
    teacher: data?.teacher || null,
    loading,
    error,
    refetch: fetchLessons
  };
};
