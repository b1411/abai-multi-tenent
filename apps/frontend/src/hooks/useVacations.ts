import { useState, useEffect } from 'react';
import { vacationService } from '../services/vacationService';
import {
  Vacation,
  CreateVacationRequest,
  UpdateVacationRequest,
  UpdateVacationStatusRequest,
  VacationFilterParams,
  VacationListResponse,
  VacationSummary,
  TeacherVacationSummary,
  SubstitutionsResponse
} from '../types/vacation';

export const useVacations = (filters?: VacationFilterParams) => {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [summary, setSummary] = useState<VacationSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVacations = async (newFilters?: VacationFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, ...newFilters };
      const response: VacationListResponse = await vacationService.getVacations(params);
      setVacations(response.vacations);
      setSummary(response.summary);
      setTotal(response.total);
      setPage(response.page);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки отпусков');
    } finally {
      setLoading(false);
    }
  };

  const createVacation = async (vacation: CreateVacationRequest): Promise<Vacation> => {
    try {
      const newVacation = await vacationService.createVacation(vacation);
      await loadVacations(); // Перезагружаем список
      return newVacation;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка создания отпуска');
    }
  };

  const updateVacation = async (id: number, vacation: UpdateVacationRequest): Promise<Vacation> => {
    try {
      const updatedVacation = await vacationService.updateVacation(id, vacation);
      await loadVacations(); // Перезагружаем список
      return updatedVacation;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка обновления отпуска');
    }
  };

  const updateVacationStatus = async (id: number, statusUpdate: UpdateVacationStatusRequest): Promise<Vacation> => {
    try {
      const updatedVacation = await vacationService.updateVacationStatus(id, statusUpdate);
      await loadVacations(); // Перезагружаем список
      return updatedVacation;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка изменения статуса');
    }
  };

  const deleteVacation = async (id: number): Promise<void> => {
    try {
      await vacationService.deleteVacation(id);
      await loadVacations(); // Перезагружаем список
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка удаления отпуска');
    }
  };

  useEffect(() => {
    loadVacations();
  }, []);

  return {
    vacations,
    summary,
    total,
    page,
    totalPages,
    loading,
    error,
    loadVacations,
    createVacation,
    updateVacation,
    updateVacationStatus,
    deleteVacation,
    refresh: () => loadVacations()
  };
};

export const useVacation = (id: number) => {
  const [vacation, setVacation] = useState<Vacation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVacation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vacationService.getVacation(id);
      setVacation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки отпуска');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadVacation();
    }
  }, [id]);

  return {
    vacation,
    loading,
    error,
    refresh: loadVacation
  };
};

export const useVacationsSummary = () => {
  const [summary, setSummary] = useState<VacationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vacationService.getVacationsSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary
  };
};

export const useTeacherVacationSummary = (teacherId: number) => {
  const [summary, setSummary] = useState<TeacherVacationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    if (!teacherId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await vacationService.getTeacherVacationSummary(teacherId);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики преподавателя');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [teacherId]);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary
  };
};

export const useSubstitutions = (params?: {
  date?: string;
  department?: string;
  substituteId?: string;
}) => {
  const [substitutions, setSubstitutions] = useState<SubstitutionsResponse['substitutions']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubstitutions = async (newParams?: typeof params) => {
    setLoading(true);
    setError(null);
    try {
      const finalParams = { ...params, ...newParams };
      const data = await vacationService.getSubstitutions(finalParams);
      setSubstitutions(data.substitutions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки замещений');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubstitutions();
  }, []);

  return {
    substitutions,
    loading,
    error,
    loadSubstitutions,
    refresh: () => loadSubstitutions()
  };
};
