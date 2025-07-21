import { useState, useEffect } from 'react';
import { studentService, Student, StudentGrades, StudentStatistics } from '../services/studentService';
import { useAuth } from './useAuth';

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStudents = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      let data: Student[] = [];
      
      if (user.role === 'ADMIN' || user.role === 'HR') {
        // Админ и HR видят всех студентов
        data = await studentService.getAllStudents();
      } else if (user.role === 'TEACHER') {
        // Учитель видит студентов своих групп
        // TODO: Нужно будет добавить метод для получения групп учителя
        data = await studentService.getAllStudents();
      } else if (user.role === 'PARENT') {
        // Родитель видит только своих детей
        // TODO: Нужно будет добавить метод для получения детей родителя
        data = [];
      } else if (user.role === 'STUDENT') {
        // Студент видит только свою группу
        const studentData = await studentService.getStudentByUserId(user.id);
        data = await studentService.getStudentsByGroup(studentData.groupId);
      }

      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке студентов');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByGroup = async (groupId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentsByGroup(groupId);
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке студентов группы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    fetchStudentsByGroup,
  };
};

export const useStudent = (studentId?: number) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<StudentGrades | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStudent = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentById(id);
      
      // Проверяем права доступа
      if (user) {
        if (user.role === 'STUDENT' && data.userId !== user.id) {
          throw new Error('Нет доступа к информации о другом студенте');
        }
        if (user.role === 'PARENT') {
          // Проверяем, является ли пользователь родителем этого студента
          const isParent = data.Parents?.some(parent => parent.user.id === user.id);
          if (!isParent) {
            throw new Error('Нет доступа к информации о чужом ребенке');
          }
        }
      }

      setStudent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке данных студента');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentGrades = async (id: number) => {
    try {
      const data = await studentService.getStudentGrades(id);
      setGrades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке оценок');
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudent(studentId);
    }
  }, [studentId, user]);

  return {
    student,
    grades,
    loading,
    error,
    refetch: () => studentId && fetchStudent(studentId),
    fetchGrades: () => studentId && fetchStudentGrades(studentId),
  };
};

export const useStudentStatistics = () => {
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentStatistics();
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

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
};
