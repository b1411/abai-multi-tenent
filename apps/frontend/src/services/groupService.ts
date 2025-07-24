import { API_BASE_URL } from '../utils';
import { Group, CreateGroupDto, UpdateGroupDto, GroupStatistics } from '../types/group';

const API_URL = `${API_BASE_URL}groups`;

export const groupService = {
    // Получить все группы
    async getAllGroups(): Promise<Group[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось получить список групп');
        }

        const groups = await response.json();
        
        // Трансформируем данные для совместимости с фронтендом
        return groups.map((group: any) => ({
            ...group,
            studentsCount: group._count?.students || 0,
        }));
    },

    // Получить группу по ID
    async getGroupById(id: number): Promise<Group> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось получить информацию о группе');
        }

        return response.json();
    },

    // Получить группы по номеру курса
    async getGroupsByCourse(courseNumber: number): Promise<Group[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/course/${courseNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось получить группы по курсу');
        }

        const groups = await response.json();
        
        // Трансформируем данные для совместимости с фронтендом
        return groups.map((group: any) => ({
            ...group,
            studentsCount: group._count?.students || 0,
        }));
    },

    // Получить статистику по группам
    async getGroupStatistics(): Promise<GroupStatistics> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/statistics`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось получить статистику групп');
        }

        return response.json();
    },

    // Создать новую группу
    async createGroup(groupData: CreateGroupDto): Promise<Group> {
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(groupData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не удалось создать группу');
        }

        return response.json();
    },

    // Обновить группу
    async updateGroup(id: number, groupData: UpdateGroupDto): Promise<Group> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(groupData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не удалось обновить группу');
        }

        return response.json();
    },

    // Удалить группу
    async deleteGroup(id: number): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не удалось удалить группу');
        }
    },

    // Получить расписание группы
    async getGroupSchedule(id: number): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}/schedule`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось получить расписание группы');
        }

        return response.json();
    },

    // Получить учебные планы группы
    async getGroupStudyPlans(id: number): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}/study-plans`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось получить учебные планы группы');
        }

        return response.json();
    },

    // Добавить студента в группу
    async addStudentToGroup(groupId: number, studentId: number): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${groupId}/students/${studentId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не удалось добавить студента в группу');
        }
    },

    // Исключить студента из группы
    async removeStudentFromGroup(studentId: number): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/students/${studentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не удалось исключить студента из группы');
        }
    },
};
