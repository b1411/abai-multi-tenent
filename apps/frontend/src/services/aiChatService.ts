import apiClient from './apiClient';

export interface EphemeralToken {
  client_secret: {
    value: string;
    expires_at: number;
  };
}

export type AiChatRole = 'system' | 'user' | 'assistant';

export interface FileRef {
  id: number;
  url: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface AiTutorFile {
  id: number;
  aiTutorId: number;
  fileId: number;
  file?: FileRef;
  createdAt: string;
}

export interface AiTutor {
  id: number;
  subject: string;
  name?: string | null;
  avatarUrl?: string | null;
  extraInstructions?: string | null;
  knowledgeText?: string | null;
  isPublic: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  files?: AiTutorFile[];
}

export interface CreateTutorInput {
  subject: string;
  name?: string;
  avatarUrl?: string;
  extraInstructions?: string;
  isPublic?: boolean;
  fileIds?: number[];
}

export interface UpdateTutorInput {
  subject?: string;
  name?: string | null;
  avatarUrl?: string | null;
  extraInstructions?: string | null;
  isPublic?: boolean;
}

export interface CreateTutorResponse {
  tutor: AiTutor;
  ingest: any | null;
}

export interface AiChatThread {
  id: number;
  tutorId: number;
  ownerId: number;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  tutor?: Pick<AiTutor, 'id' | 'subject' | 'name' | 'avatarUrl'>;
}

export interface AiChatMessage {
  id: number;
  threadId: number;
  role: AiChatRole;
  content: string;
  attachments?: unknown;
  createdAt: string;
}

class AiChatService {
  // Realtime session
  async getEphemeralToken(): Promise<EphemeralToken> {
    return await apiClient.post<EphemeralToken>('/ai-assistant/session');
  }

  isTokenValid(token: EphemeralToken): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return token.client_secret.expires_at > currentTime;
  }

  getTokenTimeRemaining(token: EphemeralToken): number {
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, token.client_secret.expires_at - currentTime);
  }

  // Tutors
  async listTutors(): Promise<AiTutor[]> {
    return await apiClient.get<AiTutor[]>('/ai-tutors');
  }

  async getTutor(id: number): Promise<AiTutor> {
    return await apiClient.get<AiTutor>(`/ai-tutors/${id}`);
  }

  async createTutor(data: CreateTutorInput): Promise<CreateTutorResponse> {
    return await apiClient.post<CreateTutorResponse>('/ai-tutors', data);
  }

  async updateTutor(id: number, data: UpdateTutorInput): Promise<AiTutor> {
    return await apiClient.patch<AiTutor>(`/ai-tutors/${id}`, data);
  }

  async deleteTutor(id: number): Promise<unknown> {
    return await apiClient.delete<unknown>(`/ai-tutors/${id}`);
  }

  async ingestTutorFiles(tutorId: number, fileIds: number[]): Promise<any> {
    return await apiClient.post<any>(`/ai-tutors/${tutorId}/ingest-files`, { fileIds });
  }

  async getTutorPrompt(tutorId: number): Promise<{ prompt: string }> {
    return await apiClient.get<{ prompt: string }>(`/ai-tutors/${tutorId}/prompt`);
  }

  // Threads
  async listThreads(tutorId?: number): Promise<AiChatThread[]> {
    const qs = tutorId ? `?tutorId=${encodeURIComponent(String(tutorId))}` : '';
    return await apiClient.get<AiChatThread[]>(`/ai-chat/threads${qs}`);
  }

  async createThread(tutorId: number, title?: string): Promise<AiChatThread> {
    return await apiClient.post<AiChatThread>('/ai-chat/threads', { tutorId, title });
  }

  async getThread(id: number): Promise<AiChatThread> {
    return await apiClient.get<AiChatThread>(`/ai-chat/threads/${id}`);
  }

  // Messages
  async listMessages(threadId: number, limit = 100, beforeId?: number): Promise<AiChatMessage[]> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (beforeId) params.set('beforeId', String(beforeId));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await apiClient.get<AiChatMessage[]>(`/ai-chat/threads/${threadId}/messages${qs}`);
  }

  async updateThread(id: number, data: { title?: string | null }): Promise<AiChatThread> {
    return await apiClient.patch<AiChatThread>(`/ai-chat/threads/${id}`, data);
  }

  async generateThreadTitle(threadId: number): Promise<AiChatThread> {
    return await apiClient.post<AiChatThread>(`/ai-chat/threads/${threadId}/generate-title`);
  }

  async sendMessage(threadId: number, content: string): Promise<AiChatMessage> {
    const response = await apiClient.post<{ message: AiChatMessage }>(`/ai-chat/threads/${threadId}/messages`, { content });
    return response.message;
  }
}

export const aiChatService = new AiChatService();
