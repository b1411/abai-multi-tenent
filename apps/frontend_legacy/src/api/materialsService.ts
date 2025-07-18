import apiClient from './client';
import { ContentType } from './Api';
import authService from './authService';

export interface CreateQuizDto {
    name: string;
    duration?: number;
    maxScore?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
}

export interface CreateHomeworkDto {
    name: string;
    deadline: string;
    materialsId?: number;
}

export interface CreateLessonMaterialsDto {
    lecture?: string;
    videoUrl?: string;
    presentationUrl?: string;
    quiz?: CreateQuizDto;
    homework?: CreateHomeworkDto;
}

export interface Question {
    id: number;
    name: string;
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';
    answers: Answer[];
}

export interface Answer {
    id: number;
    name: string;
    isCorrect: boolean;
}

export interface Quiz {
    id: number;
    name: string;
    duration?: number;
    maxScore?: number;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    questions: Question[];
}

export interface Homework {
    id: number;
    name: string;
    deadline: string;
    additionalFiles?: any[];
}

export interface Materials {
    id: number;
    lecture?: string;
    videoUrl?: string;
    presentationUrl?: string;
    quiz?: Quiz;
    homework?: Homework;
    additionalFiles?: any[];
    createdAt: string;
    updatedAt: string;
}

export const materialsService = {
    // Создание полных материалов для урока
    async createLessonMaterials(lessonId: number, data: CreateLessonMaterialsDto): Promise<Materials> {
        apiClient.setSecurityData(authService.getToken());
        const response = await apiClient.request({
            path: `/materials/lesson/${lessonId}/create-full-materials`,
            method: 'POST',
            body: data,
            type: ContentType.Json,
        });

        return response.data;
    },

    // Получение материалов урока
    async getLessonMaterials(lessonId: number): Promise<Materials | null> {
        apiClient.setSecurityData(authService.getToken());
        try {
            const response = await apiClient.request({
                path: `/materials/lesson/${lessonId}`,
                method: 'GET',
            });

            return response.data;
        } catch (error: any) {
            if (error.status === 404) {
                return null; // Материалы еще не созданы
            }
            throw error;
        }
    },

    // Получение материалов по ID
    async getMaterials(id: number): Promise<Materials> {
        apiClient.setSecurityData(authService.getToken());
        const response = await apiClient.request({
            path: `/materials/${id}`,
            method: 'GET',
        });

        return response.data;
    },

    // Обновление материалов
    async updateMaterials(id: number, data: Partial<CreateLessonMaterialsDto>): Promise<Materials> {
        apiClient.setSecurityData(authService.getToken());
        const response = await apiClient.request({
            path: `/materials/${id}`,
            method: 'PATCH',
            body: data,
            type: ContentType.Json,
        });

        return response.data;
    },

    // Удаление материалов
    async deleteMaterials(id: number): Promise<{ message: string }> {
        apiClient.setSecurityData(authService.getToken());
        const response = await apiClient.request({
            path: `/materials/${id}`,
            method: 'DELETE',
        });

        return response.data;
    },

    // Получение всех материалов
    async getAllMaterials(): Promise<Materials[]> {
        apiClient.setSecurityData(authService.getToken());
        const response = await apiClient.request({
            path: '/materials',
            method: 'GET',
        });

        return response.data;
    },
};
