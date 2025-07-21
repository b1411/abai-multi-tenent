import { useState, useEffect } from 'react';
import { Classroom, ClassroomFilter, ClassroomStatistics } from '../types/classroom';
import ClassroomService from '../services/classroomService';

export const useClassrooms = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ClassroomService.getAllClassrooms();
      setClassrooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке аудиторий');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const createClassroom = async (classroomData: Parameters<typeof ClassroomService.createClassroom>[0]) => {
    try {
      const newClassroom = await ClassroomService.createClassroom(classroomData);
      setClassrooms(prev => [...prev, newClassroom]);
      return newClassroom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании аудитории';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateClassroom = async (id: number, classroomData: Parameters<typeof ClassroomService.updateClassroom>[1]) => {
    try {
      const updatedClassroom = await ClassroomService.updateClassroom(id, classroomData);
      setClassrooms(prev => prev.map(c => c.id === id ? updatedClassroom : c));
      return updatedClassroom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при обновлении аудитории';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteClassroom = async (id: number) => {
    try {
      await ClassroomService.deleteClassroom(id);
      setClassrooms(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении аудитории';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const filterClassrooms = (filter: ClassroomFilter) => {
    return ClassroomService.filterClassrooms(classrooms, filter);
  };

  return {
    classrooms,
    loading,
    error,
    fetchClassrooms,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    filterClassrooms,
  };
};

export const useClassroomById = (id: number) => {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ClassroomService.getClassroomById(id);
        setClassroom(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке аудитории');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClassroom();
    }
  }, [id]);

  return { classroom, loading, error };
};

export const useClassroomStatistics = () => {
  const [statistics, setStatistics] = useState<ClassroomStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ClassroomService.getClassroomStatistics();
        setStatistics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке статистики');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return { statistics, loading, error };
};

export const useBuildings = () => {
  const [buildings, setBuildings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ClassroomService.getBuildings();
        setBuildings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке зданий');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  return { buildings, loading, error };
};

export const useEquipmentTypes = () => {
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipmentTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ClassroomService.getEquipmentTypes();
        setEquipmentTypes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке типов оборудования');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentTypes();
  }, []);

  return { equipmentTypes, loading, error };
};
