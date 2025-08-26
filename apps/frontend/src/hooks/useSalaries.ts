import { useState, useEffect } from 'react';
import { salaryService } from '../services/salaryService';
import { 
  Salary, 
  SalaryFilter, 
  SalaryStatistics, 
  CreateSalaryDto,
  SalaryPaginatedResponse 
} from '../types/salary';

export const useSalaries = (initialFilters?: SalaryFilter) => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [statistics, setStatistics] = useState<SalaryStatistics | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SalaryFilter>(initialFilters || {});
  const [monthlySummary, setMonthlySummary] = useState<any | null>(null);

  // Загрузка списка зарплат
  const fetchSalaries = async (newFilters?: SalaryFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtersToUse = newFilters || filters;
      const response: SalaryPaginatedResponse = await salaryService.getSalaries(filtersToUse);
      
      setSalaries(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке зарплат');
      console.error('Error fetching salaries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статистики
  const fetchStatistics = async (year?: number, month?: number) => {
    try {
      const stats = await salaryService.getSalaryStatistics(year, month);
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching salary statistics:', err);
    }
  };

  // Сводка по месяцам года
  const fetchMonthlySummary = async (year: number) => {
    try {
      const summary = await salaryService.getMonthlySummary(year);
      setMonthlySummary(summary);
    } catch (err) {
      console.error('Error fetching monthly summary:', err);
    }
  };

  // Создание новой зарплаты
  const createSalary = async (salaryData: CreateSalaryDto): Promise<Salary | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const newSalary = await salaryService.createSalary(salaryData);
      
      // Обновляем список зарплат
      await fetchSalaries();
      await fetchStatistics();
      
      return newSalary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании зарплаты');
      console.error('Error creating salary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Обновление зарплаты
  const updateSalary = async (id: number, salaryData: Partial<CreateSalaryDto>): Promise<Salary | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedSalary = await salaryService.updateSalary(id, salaryData);
      
      // Обновляем список зарплат
      await fetchSalaries();
      await fetchStatistics();
      
      return updatedSalary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении зарплаты');
      console.error('Error updating salary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Удаление зарплаты
  const deleteSalary = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await salaryService.deleteSalary(id);
      
      // Обновляем список зарплат
      await fetchSalaries();
      await fetchStatistics();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении зарплаты');
      console.error('Error deleting salary:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Утверждение зарплаты
  const approveSalary = async (id: number): Promise<Salary | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const approvedSalary = await salaryService.approveSalary(id);
      
      // Обновляем список зарплат
      await fetchSalaries();
      await fetchStatistics();
      
      return approvedSalary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при утверждении зарплаты');
      console.error('Error approving salary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Отметка зарплаты как выплаченной
  const markSalaryAsPaid = async (id: number): Promise<Salary | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const paidSalary = await salaryService.markSalaryAsPaid(id);
      
      // Обновляем список зарплат
      await fetchSalaries();
      await fetchStatistics();
      
      return paidSalary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отметке зарплаты как выплаченной');
      console.error('Error marking salary as paid:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Обновление фильтров
  const updateFilters = (newFilters: Partial<SalaryFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchSalaries(updatedFilters);
  };

  // Сброс фильтров
  const resetFilters = () => {
    const defaultFilters: SalaryFilter = { page: 1, limit: 10 };
    setFilters(defaultFilters);
    fetchSalaries(defaultFilters);
  };

  // Изменение страницы
  const changePage = (page: number) => {
    updateFilters({ page });
  };

  // Изменение количества элементов на странице
  const changeLimit = (limit: number) => {
    updateFilters({ page: 1, limit });
  };

  // Пересчет зарплат через новую систему
  const recalculateSalaries = async (filters?: { month?: number; year?: number }) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await salaryService.recalculateSalaries(filters);
      
      await fetchSalaries();
      await fetchStatistics(filters?.year, filters?.month);
      if (filters?.year) await fetchMonthlySummary(filters.year);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при пересчете зарплат');
      console.error('Error recalculating salaries:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Генерация отсутствующих зарплат за месяц
  const generateMonth = async (month: number, year: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await salaryService.generateSalariesForMonth(month, year);
      await fetchSalaries({ ...filters, month, year });
      await fetchStatistics(year, month);
      await fetchMonthlySummary(year);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при генерации зарплат');
      console.error('Error generating salaries for month:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Получить сводку по зарплатам
  const getPayrollSummary = async (month: number, year: number) => {
    try {
      return await salaryService.getPayrollSummary(month, year);
    } catch (err) {
      console.error('Error fetching payroll summary:', err);
      return null;
    }
  };

  // Получить детали расчета зарплаты
  const getPayrollDetails = async (teacherId: number, month: number, year: number) => {
    try {
      return await salaryService.getPayrollDetails(teacherId, month, year);
    } catch (err) {
      console.error('Error fetching payroll details:', err);
      return null;
    }
  };

  // Управление ставками преподавателей
  const getTeacherSalaryRate = async (teacherId: number) => {
    try {
      return await salaryService.getTeacherSalaryRate(teacherId);
    } catch (err) {
      console.error('Error fetching teacher salary rate:', err);
      return null;
    }
  };

  const createTeacherSalaryRate = async (teacherId: number, rateData: any) => {
    try {
      setLoading(true);
      const result = await salaryService.createTeacherSalaryRate(teacherId, rateData);
      
      // Обновляем данные после изменения ставки
      await fetchSalaries();
      await fetchStatistics();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании ставки');
      console.error('Error creating teacher salary rate:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Отработанные часы
  const getWorkedHours = async (teacherId: number, month: number, year: number) => {
    try {
      return await salaryService.getWorkedHours(teacherId, month, year);
    } catch (err) {
      console.error('Error fetching worked hours:', err);
      return null;
    }
  };

  // Workflow управления зарплатами
  const getPendingApprovals = async () => {
    try {
      return await salaryService.getPendingApprovals();
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      return [];
    }
  };

  const editSalaryAdjustments = async (salaryId: number, adjustments: any) => {
    try {
      setLoading(true);
      const result = await salaryService.editSalaryAdjustments(salaryId, adjustments);
      
      // Обновляем данные после редактирования
      await fetchSalaries();
      await fetchStatistics();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при редактировании надбавок');
      console.error('Error editing salary adjustments:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const rejectSalary = async (salaryId: number, reason: string) => {
    try {
      setLoading(true);
      const result = await salaryService.rejectSalary(salaryId, reason);
      
      // Обновляем данные после отклонения
      await fetchSalaries();
      await fetchStatistics();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отклонении зарплаты');
      console.error('Error rejecting salary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Начальная загрузка данных
  useEffect(() => {
    fetchSalaries();
    fetchStatistics();
  }, []);

  return {
    // Данные
    salaries,
    statistics,
    monthlySummary,
    pagination,
    filters,
    loading,
    error,
    
    // Методы
    fetchSalaries,
    fetchStatistics,
    fetchMonthlySummary,
    generateMonth,
    createSalary,
    updateSalary,
    deleteSalary,
    approveSalary,
    markSalaryAsPaid,
    updateFilters,
    resetFilters,
    changePage,
    changeLimit,
    recalculateSalaries,
    
    // Утилиты
    refresh: () => {
      fetchSalaries();
      fetchStatistics();
    },
    clearError: () => setError(null)
  };
};
