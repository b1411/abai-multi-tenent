import apiClient from './client';
import { ContentType } from './Api';

export enum AnswerType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT = 'TEXT'
}

export interface CreateAnswerDto {
  name: string;
  isCorrect: boolean;
}

export interface CreateQuestionDto {
  name: string;
  type: AnswerType;
  answers?: CreateAnswerDto[];
}

export interface QuestionResponse {
  id: number;
  name: string;
  type: AnswerType;
  answers: AnswerResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AnswerResponse {
  id: number;
  name: string;
  isCorrect: boolean;
}

export interface QuizResponse {
  id: number;
  name: string;
  duration?: number;
  maxScore?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  questions: QuestionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizSubmissionDto {
  studentId: number;
  answers: string; // JSON string with answers
}

export interface QuizSubmissionResponse {
  id: number;
  studentId: number;
  score?: number;
  feedback?: string;
  submittedAt: string;
  answers: string;
}

export interface QuizStatistics {
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
  questionStatistics: Array<{
    questionId: number;
    questionText: string;
    correctAnswers: number;
    totalAnswers: number;
    successRate: number;
  }>;
}

export const quizService = {
  // Получение квиза с вопросами
  async getQuiz(id: number): Promise<QuizResponse> {
    const response = await apiClient.request({
      path: `/quiz/${id}`,
      method: 'GET',
    });
    return response.data;
  },

  // Получение вопросов квиза
  async getQuestions(quizId: number): Promise<QuestionResponse[]> {
    const response = await apiClient.request({
      path: `/quiz/${quizId}/questions`,
      method: 'GET',
    });
    return response.data;
  },

  // Добавление вопроса к квизу
  async addQuestion(quizId: number, question: CreateQuestionDto): Promise<QuestionResponse> {
    const response = await apiClient.request({
      path: `/quiz/${quizId}/questions`,
      method: 'POST',
      body: question,
      type: ContentType.Json,
    });
    return response.data;
  },

  // Обновление квиза
  async updateQuiz(id: number, data: Partial<{
    name: string;
    duration?: number;
    maxScore?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }>): Promise<QuizResponse> {
    const response = await apiClient.request({
      path: `/quiz/${id}`,
      method: 'PATCH',
      body: data,
      type: ContentType.Json,
    });
    return response.data;
  },

  // Активация/деактивация квиза
  async toggleActive(id: number, isActive: boolean): Promise<QuizResponse> {
    const response = await apiClient.request({
      path: `/quiz/${id}/activate`,
      method: 'PATCH',
      body: { isActive },
      type: ContentType.Json,
    });
    return response.data;
  },

  // Удаление вопроса
  async removeQuestion(questionId: number): Promise<{ message: string }> {
    const response = await apiClient.request({
      path: `/quiz/questions/${questionId}`,
      method: 'DELETE',
    });
    return response.data;
  },

  // Отправка ответов на квиз (для студентов)
  async submitQuiz(quizId: number, submission: CreateQuizSubmissionDto): Promise<QuizSubmissionResponse> {
    const response = await apiClient.request({
      path: `/quiz/${quizId}/submit`,
      method: 'POST',
      body: submission,
      type: ContentType.Json,
    });
    return response.data;
  },

  // Получение результатов квиза (для преподавателей)
  async getSubmissions(quizId: number): Promise<QuizSubmissionResponse[]> {
    const response = await apiClient.request({
      path: `/quiz/${quizId}/submissions`,
      method: 'GET',
    });
    return response.data;
  },

  // Получение статистики квиза
  async getStatistics(quizId: number): Promise<QuizStatistics> {
    const response = await apiClient.request({
      path: `/quiz/${quizId}/statistics`,
      method: 'GET',
    });
    return response.data;
  },

  // Получение активных квизов
  async getActiveQuizzes(): Promise<QuizResponse[]> {
    const response = await apiClient.request({
      path: '/quiz/active',
      method: 'GET',
    });
    return response.data;
  },

  // Получение результатов студента
  async getStudentSubmissions(studentId: number): Promise<QuizSubmissionResponse[]> {
    const response = await apiClient.request({
      path: `/quiz/my-submissions?studentId=${studentId}`,
      method: 'GET',
    });
    return response.data;
  },
};
