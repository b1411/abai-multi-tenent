import { useState, useEffect, useCallback } from 'react';
import { Alumni, AlumniFilters, AlumniStats } from '../types/alumni';
import { alumniService } from '../services/alumniService';

export const useAlumni = (initialFilters?: AlumniFilters) => {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlumniFilters>(initialFilters || {});

  const loadAlumni = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alumniService.getAlumni(filters);
      setAlumni(data);
    } catch (err) {
      setError('Ошибка при загрузке данных выпускников');
      console.error('Error loading alumni:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<AlumniFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  useEffect(() => {
    loadAlumni();
  }, [loadAlumni]);

  return {
    alumni,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch: loadAlumni
  };
};

export const useAlumniDetail = (id: number) => {
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlumni = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alumniService.getAlumniById(id);
      setAlumni(data);
    } catch (err) {
      setError('Ошибка при загрузке данных выпускника');
      console.error('Error loading alumni detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateAlumni = useCallback(async (updates: Partial<Alumni>) => {
    try {
      setError(null);
      const updatedAlumni = await alumniService.updateAlumni(id, updates);
      if (updatedAlumni) {
        setAlumni(updatedAlumni);
      }
      return updatedAlumni;
    } catch (err) {
      setError('Ошибка при обновлении данных выпускника');
      console.error('Error updating alumni:', err);
      return null;
    }
  }, [id]);

  useEffect(() => {
    loadAlumni();
  }, [loadAlumni]);

  return {
    alumni,
    loading,
    error,
    updateAlumni,
    refetch: loadAlumni
  };
};

export const useAlumniStats = () => {
  const [stats, setStats] = useState<AlumniStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alumniService.getAlumniStats();
      setStats(data);
    } catch (err) {
      setError('Ошибка при загрузке статистики');
      console.error('Error loading alumni stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  };
};

export const useAlumniOptions = () => {
  const [graduationYears, setGraduationYears] = useState<number[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [years, industriesData] = await Promise.all([
          alumniService.getGraduationYears(),
          alumniService.getIndustries()
        ]);
        setGraduationYears(years);
        setIndustries(industriesData);
      } catch (err) {
        console.error('Error loading alumni options:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  return {
    graduationYears,
    industries,
    loading
  };
};
