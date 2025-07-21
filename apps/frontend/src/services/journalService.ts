import apiClient from './apiClient';
import type {
    LessonResult,
    GroupJournal,
    CreateLessonResultDto,
    UpdateLessonResultDto,
    BulkAttendanceDto,
    AttendanceStatistics,
    JournalFilters,
    Student
} from '../types/journal';
import { PaginateResponseDto } from '../types/api';

export class JournalService {
    /**
     * Создать новый результат урока (оценку или посещаемость)
     */
    async createLessonResult(data: CreateLessonResultDto): Promise<LessonResult> {
        return await apiClient.post<LessonResult>('/lesson-results', data);
    }

    /**
     * Получить все результаты уроков
     */
    async getAllLessonResults(): Promise<LessonResult[]> {
        return await apiClient.get<LessonResult[]>('/lesson-results');
    }

    /**
     * Получить журнал по уроку (все студенты и их оценки)
     */
    async getJournalByLesson(lessonId: number): Promise<{
        lesson: any;
        students: Student[];
        results: LessonResult[];
    }> {
        return await apiClient.get<{
            lesson: any;
            students: Student[];
            results: LessonResult[];
        }>(`/lesson-results/lesson/${lessonId}/journal`);
    }

    /**
     * Получить все оценки студента по предмету
     */
    async getStudentGradesBySubject(studentId: number, studyPlanId: number): Promise<{
        student: Student;
        studyPlan: any;
        results: LessonResult[];
        statistics: {
            averageGrade: number;
            attendancePercentage: number;
            totalLessons: number;
            attendedLessons: number;
        };
    }> {
        return await apiClient.get<{
            student: Student;
            studyPlan: any;
            results: LessonResult[];
            statistics: {
                averageGrade: number;
                attendancePercentage: number;
                totalLessons: number;
                attendedLessons: number;
            };
        }>(`/lesson-results/student/${studentId}/subject/${studyPlanId}/grades`);
    }

    /**
     * Получить журнал группы за период
     */
    async getGroupJournalByPeriod(
        groupId: number,
        startDate: string,
        endDate: string
    ): Promise<GroupJournal> {
        // Используем прямой axios call для передачи параметров
        const params = new URLSearchParams({ startDate, endDate });
        return await apiClient.get<GroupJournal>(`/lesson-results/group/${groupId}/journal?${params}`);
    }

    /**
     * Массово отметить посещаемость урока
     */
    async bulkMarkAttendance(lessonId: number, data: BulkAttendanceDto): Promise<void> {
        await apiClient.post<void>(`/lesson-results/lesson/${lessonId}/bulk-attendance`, data);
    }

    /**
     * Получить статистику посещаемости
     */
    async getAttendanceStatistics(filters: {
        groupId?: number;
        studyPlanId?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<AttendanceStatistics> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, value.toString());
            }
        });
        return await apiClient.get<AttendanceStatistics>(`/lesson-results/attendance/statistics?${params}`);
    }

    /**
     * Получить результат урока по ID
     */
    async getLessonResult(id: number): Promise<LessonResult> {
        return await apiClient.get<LessonResult>(`/lesson-results/${id}`);
    }

    /**
     * Обновить результат урока
     */
    async updateLessonResult(id: number, data: UpdateLessonResultDto): Promise<LessonResult> {
        return await apiClient.patch<LessonResult>(`/lesson-results/${id}`, data);
    }

    /**
     * Удалить результат урока
     */
    async deleteLessonResult(id: number): Promise<void> {
        await apiClient.delete<void>(`/lesson-results/${id}`);
    }

    /**
     * Получить группы для выбора
     */
    async getGroups(): Promise<Array<{ id: number; name: string; courseNumber: number }>> {
        return await apiClient.get<Array<{ id: number; name: string; courseNumber: number }>>('/groups');
    }

    /**
     * Получить учебные планы для выбора
     */
    async getStudyPlans(): Promise<PaginateResponseDto<{ id: number; name: string; description?: string }>> {
        return await apiClient.get<PaginateResponseDto<{ id: number; name: string; description?: string }>>('/study-plans');
    }

    /**
     * Получить свою группу (для студентов)
     */
    async getMyGroup(): Promise<{ id: number; name: string; courseNumber: number }> {
        return await apiClient.get<{ id: number; name: string; courseNumber: number }>('/students/my-group');
    }

    /**
     * Получить свои учебные планы (для студентов)
     */
    async getMyStudyPlans(): Promise<Array<{ id: number; name: string; description?: string }>> {
        return await apiClient.get<Array<{ id: number; name: string; description?: string }>>('/students/my-study-plans');
    }

    /**
     * Получить свои оценки (для студентов)
     */
    async getMyGrades(filters: {
        studyPlanId?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        student: Student;
        results: LessonResult[];
        statistics: {
            averageGrade: number;
            attendancePercentage: number;
            totalLessons: number;
            attendedLessons: number;
        };
    }> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, value.toString());
            }
        });
        return await apiClient.get<{
            student: Student;
            results: LessonResult[];
            statistics: {
                averageGrade: number;
                attendancePercentage: number;
                totalLessons: number;
                attendedLessons: number;
            };
        }>(`/lesson-results/my-grades?${params}`);
    }

    /**
     * Получить студентов группы
     */
    async getGroupStudents(groupId: number): Promise<Student[]> {
        return await apiClient.get<Student[]>(`/students/group/${groupId}`);
    }

    /**
     * Получить уроки по фильтрам
     */
    async getLessons(filters: {
        groupId?: number;
        studyPlanId?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<any[]> {
        const params = new URLSearchParams();
        // Добавляем параметр для получения простого массива без пагинации
        params.append('noPagination', 'true');
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, value.toString());
            }
        });
        return await apiClient.get<any[]>(`/lessons?${params}`);
    }

    /**
     * Поиск студентов
     */
    async searchStudents(query: string): Promise<Student[]> {
        const params = new URLSearchParams({ q: query });
        const users = await apiClient.get<any[]>(`/users/search?${params}`);
        // Фильтруем только студентов
        return users.filter((user: any) => user.role === 'STUDENT');
    }

    /**
     * Вспомогательные методы для расчета статистики
     */
    calculateAverageGrade(results: LessonResult[]): number {
        const grades = results
            .map(r => [r.lessonScore, r.homeworkScore])
            .flat()
            .filter((grade): grade is number => grade !== undefined && grade !== null);

        if (grades.length === 0) return 0;
        return Math.round((grades.reduce((sum, grade) => sum + grade, 0) / grades.length) * 100) / 100;
    }

    calculateAttendancePercentage(results: LessonResult[]): number {
        const attendanceResults = results.filter(r => r.attendance !== undefined);
        if (attendanceResults.length === 0) return 0;

        const attendedCount = attendanceResults.filter(r => r.attendance === true).length;
        return Math.round((attendedCount / attendanceResults.length) * 100);
    }

    /**
     * Получить цвет оценки в зависимости от значения
     */
    getGradeColor(grade: number): string {
        if (grade >= 5) return 'bg-green-500';
        if (grade >= 4) return 'bg-blue-500';
        if (grade >= 3) return 'bg-yellow-500';
        if (grade >= 2) return 'bg-orange-500';
        return 'bg-red-500';
    }

    /**
     * Получить текстовое описание оценки
     */
    getGradeText(grade: number): string {
        if (grade >= 5) return 'Отлично';
        if (grade >= 4) return 'Хорошо';
        if (grade >= 3) return 'Удовлетворительно';
        if (grade >= 2) return 'Неудовлетворительно';
        return 'Плохо';
    }

    /**
     * Получить текст причины отсутствия
     */
    getAbsentReasonText(reason: 'SICK' | 'FAMILY' | 'OTHER'): string {
        switch (reason) {
            case 'SICK':
                return 'Болезнь';
            case 'FAMILY':
                return 'Семейные обстоятельства';
            case 'OTHER':
                return 'Другие причины';
            default:
                return 'Не указано';
        }
    }
}

export const journalService = new JournalService();
