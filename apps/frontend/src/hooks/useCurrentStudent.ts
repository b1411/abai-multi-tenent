import { useState, useEffect } from 'react';
import { studentService, Student } from '../services/studentService';
import { useAuth } from './useAuth';

export const useCurrentStudent = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCurrentStudent = async () => {
    if (!user || user.role !== 'STUDENT') {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentByUserId(user.id);
      setStudent(data);
    } catch (err) {
      console.error('Ошибка загрузки данных студента:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке данных студента');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentStudent();
  }, [user]);

  return {
    student,
    loading,
    error,
    refetch: fetchCurrentStudent,
  };
};
