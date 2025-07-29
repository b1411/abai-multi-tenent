import { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord, FakePositionsFilters, AnalyticsData } from '../types/fakePositions';
import { useAuth } from './useAuth';
import mockData from '../data/mockAttendanceData.json';

export const useFakePositions = (filters: FakePositionsFilters = {}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Имитация загрузки данных
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [filters]);

  // Фильтрация данных по роли пользователя
  const filteredData = useMemo(() => {
    let data = mockData as AttendanceRecord[];

    // Фильтрация по роли
    if (user?.role === 'TEACHER') {
      // Для демонстрации предположим, что текущий пользователь - это учитель с ID = 1
      data = data.filter(record => record.teacherId === 1);
    }

    // Применение фильтров
    if (filters.dateFrom) {
      data = data.filter(record => record.date >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      data = data.filter(record => record.date <= filters.dateTo!);
    }

    if (filters.teacherId) {
      data = data.filter(record => record.teacherId === filters.teacherId);
    }

    if (filters.teacherName) {
      data = data.filter(record => 
        record.teacherName.toLowerCase().includes(filters.teacherName!.toLowerCase())
      );
    }

    if (filters.subject) {
      data = data.filter(record => 
        record.subject.toLowerCase().includes(filters.subject!.toLowerCase())
      );
    }

    if (filters.status && filters.status !== 'all') {
      data = data.filter(record => record.status === filters.status);
    }

    return data;
  }, [user, filters]);

  // Вычисление аналитики
  const analytics: AnalyticsData = useMemo(() => {
    const total = filteredData.length;
    const confirmed = filteredData.filter(r => r.status === 'confirmed').length;
    const mismatch = filteredData.filter(r => r.status === 'mismatch').length;
    const absent = filteredData.filter(r => r.status === 'absent').length;

    // Подсчет нарушений по преподавателям
    const violationsByTeacher = filteredData.reduce((acc, record) => {
      if (record.status !== 'confirmed') {
        acc[record.teacherName] = (acc[record.teacherName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topViolators = Object.entries(violationsByTeacher)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([teacherName, violations]) => ({ teacherName, violations }));

    // Статистика по предметам
    const subjectStats = filteredData.reduce((acc, record) => {
      const subject = record.subject;
      if (!acc[subject]) {
        acc[subject] = { total: 0, violations: 0 };
      }
      acc[subject].total++;
      if (record.status !== 'confirmed') {
        acc[subject].violations++;
      }
      return acc;
    }, {} as Record<string, { total: number; violations: number }>);

    const subjectStatsArray = Object.entries(subjectStats)
      .map(([subject, stats]) => ({
        subject,
        total: stats.total,
        violations: stats.violations
      }))
      .sort((a, b) => b.violations - a.violations);

    return {
      totalRecords: total,
      confirmed,
      mismatch,
      absent,
      confirmedPercentage: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      mismatchPercentage: total > 0 ? Math.round((mismatch / total) * 100) : 0,
      absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
      topViolators,
      subjectStats: subjectStatsArray
    };
  }, [filteredData]);

  // Получение уникальных преподавателей для фильтра
  const teacherOptions = useMemo(() => {
    const teachers = Array.from(new Set(mockData.map(record => ({
      id: record.teacherId,
      name: record.teacherName
    }))));
    return teachers.filter((teacher, index, self) => 
      index === self.findIndex(t => t.id === teacher.id)
    );
  }, []);

  // Получение уникальных предметов для фильтра
  const subjectOptions = useMemo(() => {
    return Array.from(new Set(mockData.map(record => record.subject))).sort();
  }, []);

  return {
    data: filteredData,
    analytics,
    teacherOptions,
    subjectOptions,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    }
  };
};
