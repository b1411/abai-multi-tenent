import apiClient from './apiClient';

export interface Quiz {
  id: number;
  name: string;
  isActive: boolean;
  maxScore?: number;
  duration?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  questions?: QuizQuestion[];
  submissions?: QuizSubmission[];
}

export interface QuizQuestion {
  id?: number;
  name: string; // На бекенде поле называется 'name', а не 'question'
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';
  answers?: QuizAnswer[];
  quizId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface QuizAnswer {
  id?: number;
  name: string;
  isCorrect: boolean;
  questionId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface QuizSubmission {
  id: number;
  studentId: number;
  quizId: number;
  answers?: string; // JSON строка с ответами
  submittedAt: string;
  score?: number;
  feedback?: string;
  student?: {
    user: {
      id: number;
      name: string;
      surname: string;
      email?: string;
    };
  };
}

export interface CreateQuizRequest {
  name: string;
  duration?: number;
  maxScore?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  questions?: CreateQuizQuestionRequest[];
}

export interface CreateQuizQuestionRequest {
  question: string; // На фронтенде используем 'question', но отправляем как 'name'
  options: string[];
  correctAnswer: number | number[];
  score: number;
  multipleAnswers?: boolean;
}

export interface CreateQuestionRequest {
  name: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';
  answers?: {
    name: string;
    isCorrect: boolean;
  }[];
}

export interface CreateQuizSubmissionRequest {
  studentId: number;
  answers?: string;
  score?: number;
  feedback?: string;
}

export interface PaginateQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface PaginateResponse<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export class QuizService {
  async getQuizzes(query?: PaginateQuery): Promise<PaginateResponse<Quiz>> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.order) params.append('order', query.order);
    if (query?.search) params.append('search', query.search);

    return await apiClient.get<PaginateResponse<Quiz>>(`/quiz?${params.toString()}`);
  }

  async getActiveQuizzes(): Promise<Quiz[]> {
    return await apiClient.get<Quiz[]>('/quiz/active');
  }

  async getQuiz(id: number): Promise<Quiz> {
    return await apiClient.get<Quiz>(`/quiz/${id}`);
  }

  async createQuiz(data: CreateQuizRequest): Promise<Quiz> {
    return await apiClient.post<Quiz>('/quiz', data);
  }

  async updateQuiz(id: number, data: Partial<CreateQuizRequest>): Promise<Quiz> {
    return await apiClient.patch<Quiz>(`/quiz/${id}`, data);
  }

  async deleteQuiz(id: number): Promise<void> {
    await apiClient.delete(`/quiz/${id}`);
  }

  async toggleQuizActive(id: number, isActive: boolean): Promise<Quiz> {
    return await apiClient.patch<Quiz>(`/quiz/${id}/activate`, { isActive });
  }

  // Работа с вопросами
  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    return await apiClient.get<QuizQuestion[]>(`/quiz/${quizId}/questions`);
  }

  async addQuestionToQuiz(quizId: number, data: CreateQuestionRequest): Promise<QuizQuestion> {
    return await apiClient.post<QuizQuestion>(`/quiz/${quizId}/questions`, data);
  }

  async deleteQuestion(questionId: number): Promise<void> {
    await apiClient.delete(`/quiz/questions/${questionId}`);
  }

  // Результаты и статистика
  async getQuizSubmissions(quizId: number): Promise<QuizSubmission[]> {
    return await apiClient.get<QuizSubmission[]>(`/quiz/${quizId}/submissions`);
  }

  async submitQuiz(quizId: number, data: CreateQuizSubmissionRequest): Promise<QuizSubmission> {
    return await apiClient.post<QuizSubmission>(`/quiz/${quizId}/submit`, data);
  }

  async getMySubmissions(studentId: number): Promise<QuizSubmission[]> {
    return await apiClient.get<QuizSubmission[]>(`/quiz/my-submissions?studentId=${studentId}`);
  }

  async getQuizStatistics(quizId: number): Promise<any> {
    return await apiClient.get(`/quiz/${quizId}/statistics`);
  }

  // Утилитные методы для конвертации данных между фронтендом и бекендом
  static convertQuestionToBackend(question: CreateQuizQuestionRequest): CreateQuestionRequest {
    return {
      name: question.question,
      type: question.multipleAnswers ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
      answers: question.options.map((option, index) => {
        const isCorrect = question.multipleAnswers
          ? Array.isArray(question.correctAnswer) && question.correctAnswer.includes(index)
          : question.correctAnswer === index;
        
        return {
          name: option,
          isCorrect
        };
      }).filter(answer => answer.name.trim())
    };
  }

  static convertQuestionFromBackend(question: QuizQuestion): CreateQuizQuestionRequest {
    const options = question.answers?.map(answer => answer.name) || [];
    const correctAnswers = question.answers?.map((answer, index) => answer.isCorrect ? index : -1).filter(i => i !== -1) || [];
    
    return {
      question: question.name,
      options,
      correctAnswer: question.type === 'MULTIPLE_CHOICE' ? correctAnswers : (correctAnswers[0] || 0),
      score: 1, // По умолчанию 1 балл
      multipleAnswers: question.type === 'MULTIPLE_CHOICE'
    };
  }
}

export const quizService = new QuizService();
