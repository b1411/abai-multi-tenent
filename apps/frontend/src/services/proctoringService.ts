import apiClient from './apiClient';

export interface ProctoringSession {
  id: number;
  homeworkId: number;
  studentId: number;
  lessonId?: number;
  topic: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS' | 'FAILED';
  score?: number;
  comment?: string;
  analysisResults?: Record<string, unknown>;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  results?: {
    score?: number;
    feedback?: string;
    analysisResults?: Record<string, unknown>;
  };
  transcript?: Array<{
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    isAudio?: boolean;
  }>;
  homework?: {
    id: number;
    name: string;
    lesson?: {
      id: number;
      name: string;
    };
  };
  student?: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
    };
  };
}

export interface CreateProctoringSessionDto {
  homeworkId: number;
  lessonId?: number;
  topic?: string;
}

export interface ProctoringResultDto {
  sessionId: number;
  score: number;
  comment?: string;
  analysisResults?: Record<string, unknown>;
}

class ProctoringService {
  async createSession(dto: CreateProctoringSessionDto): Promise<ProctoringSession> {
    return await apiClient.post<ProctoringSession>('/proctoring/session', dto);
  }

  async endSession(sessionId: number, results?: Omit<ProctoringResultDto, 'sessionId'>): Promise<ProctoringSession> {
    return await apiClient.post<ProctoringSession>(`/proctoring/session/${sessionId}/end`, results);
  }

  async getSession(sessionId: number): Promise<ProctoringSession> {
    return await apiClient.get<ProctoringSession>(`/proctoring/session/${sessionId}`);
  }

  async getHomeworkSessions(homeworkId: number): Promise<ProctoringSession[]> {
    return await apiClient.get<ProctoringSession[]>(`/proctoring/homework/${homeworkId}/sessions`);
  }

  async getStudentSessions(studentId: number): Promise<ProctoringSession[]> {
    return await apiClient.get<ProctoringSession[]>(`/proctoring/student/${studentId}/sessions`);
  }

  async getAllSessions(filters?: {
    status?: string;
    studentId?: number;
    homeworkId?: number;
    page?: number;
    limit?: number;
  }): Promise<ProctoringSession[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.studentId) params.append('studentId', filters.studentId.toString());
    if (filters?.homeworkId) params.append('homeworkId', filters.homeworkId.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/proctoring/sessions?${queryString}` : '/proctoring/sessions';

    const response = await apiClient.get<{ sessions: ProctoringSession[]; total: number; page: number; limit: number; totalPages: number }>(url);
    return response.sessions;
  }

  async addMessageToTranscript(sessionId: number, message: {
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isAudio?: boolean;
  }): Promise<void> {
    return await apiClient.post(`/proctoring/session/${sessionId}/message`, {
      type: message.type,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      isAudio: message.isAudio
    });
  }
}

export const proctoringService = new ProctoringService();