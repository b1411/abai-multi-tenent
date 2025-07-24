import { useState, useEffect } from 'react';
import { groupService } from '../services/groupService';
import { Group, CreateGroupDto, UpdateGroupDto, GroupStatistics } from '../types/group';

export const useGroups = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [statistics, setStatistics] = useState<GroupStatistics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Загрузить все группы
    const fetchGroups = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await groupService.getAllGroups();
            setGroups(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке групп');
        } finally {
            setLoading(false);
        }
    };

    // Загрузить статистику групп
    const fetchStatistics = async () => {
        try {
            const data = await groupService.getGroupStatistics();
            setStatistics(data);
        } catch (err) {
            console.error('Ошибка при загрузке статистики:', err);
        }
    };

    // Создать новую группу
    const createGroup = async (groupData: CreateGroupDto): Promise<Group> => {
        setLoading(true);
        setError(null);
        try {
            const newGroup = await groupService.createGroup(groupData);
            setGroups(prev => [...prev, newGroup]);
            await fetchStatistics(); // Обновляем статистику
            return newGroup;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при создании группы';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Обновить группу
    const updateGroup = async (id: number, groupData: UpdateGroupDto): Promise<Group> => {
        setLoading(true);
        setError(null);
        try {
            const updatedGroup = await groupService.updateGroup(id, groupData);
            setGroups(prev => prev.map(group =>
                group.id === id ? updatedGroup : group
            ));
            await fetchStatistics(); // Обновляем статистику
            return updatedGroup;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при обновлении группы';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Удалить группу
    const deleteGroup = async (id: number): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await groupService.deleteGroup(id);
            setGroups(prev => prev.filter(group => group.id !== id));
            await fetchStatistics(); // Обновляем статистику
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при удалении группы';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Получить группы по курсу
    const getGroupsByCourse = async (courseNumber: number): Promise<Group[]> => {
        setLoading(true);
        setError(null);
        try {
            const data = await groupService.getGroupsByCourse(courseNumber);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при загрузке групп по курсу';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Добавить студента в группу
    const addStudentToGroup = async (groupId: number, studentId: number): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await groupService.addStudentToGroup(groupId, studentId);
            // Обновляем список групп для отображения актуального количества студентов
            await fetchGroups();
            await fetchStatistics();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при добавлении студента в группу';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Исключить студента из группы
    const removeStudentFromGroup = async (studentId: number): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await groupService.removeStudentFromGroup(studentId);
            // Обновляем список групп для отображения актуального количества студентов
            await fetchGroups();
            await fetchStatistics();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при исключении студента из группы';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Загрузить данные при инициализации
    useEffect(() => {
        fetchGroups();
        fetchStatistics();
    }, []);

    return {
        groups,
        statistics,
        loading,
        error,
        fetchGroups,
        fetchStatistics,
        createGroup,
        updateGroup,
        deleteGroup,
        getGroupsByCourse,
        addStudentToGroup,
        removeStudentFromGroup,
    };
};
