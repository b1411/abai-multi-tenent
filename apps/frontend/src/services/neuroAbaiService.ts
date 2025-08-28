import apiClient from './apiClient';

export interface NeuroAbaiRequest {
  message?: string;
  messages?: { role: 'user' | 'assistant'; content: string }[];
  scenario?: string;
  files?: File[];
}

class NeuroAbaiService {
  /**
   * Отправляет сообщение в Neuro Abai AI
   */
  async sendMessage(data: NeuroAbaiRequest): Promise<string> {
    const formData = new FormData();

    // prefer explicit messages array (conversation history); fallback to single message
    let plainMessage = '';
    if (data.messages && Array.isArray(data.messages)) {
      formData.append('messages', JSON.stringify(data.messages));
      plainMessage = data.messages.map(m => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`).join('\n\n');
    } else if (data.message) {
      formData.append('messages', JSON.stringify([{ role: 'user', content: data.message }]));
      plainMessage = data.message;
    } else {
      formData.append('messages', JSON.stringify([]));
      plainMessage = '';
    }

    // also send plain concatenated message so backend endpoints expecting `message` receive full history
    formData.append('message', plainMessage);

    if (data.scenario) formData.append('context', JSON.stringify({ scenario: data.scenario }));

    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => formData.append('files', file));
    }

    const response = await apiClient.postFormData<string>('/ai-assistant/openai-responses', formData);
    return response;
  }

  async createSuggestion(data: { curriculumPlanId: number; message?: string; files?: File[] }) {
    const formData = new FormData();
    formData.append('curriculumPlanId', String(data.curriculumPlanId));
    if (data.message) formData.append('message', data.message);
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => formData.append('files', file));
    }
    const response = await apiClient.postFormData<any>('/ai-assistant/suggestions', formData);
    return response;
  }

  async getSuggestion(id: number) {
    return await apiClient.get<any>(`/ai-assistant/suggestions/${id}`);
  }

  async applySuggestion(id: number) {
    return await apiClient.post<any>(`/ai-assistant/suggestions/${id}/apply`);
  }

  async getTools() {
    return await apiClient.get<any>('/ai-assistant/tools');
  }

  async agentAction(actionId: string, args?: any, dryRun: boolean = true) {
    return await apiClient.post<any>('/ai-assistant/agent-action', { actionId, args, dryRun });
  }

  async generateActions(data: { message?: string; messages?: any[]; context?: any; files?: File[] }) {
    const formData = new FormData();

    // send conversation history when available
    if (data.messages && Array.isArray(data.messages)) {
      formData.append('messages', JSON.stringify(data.messages));
    } else if (data.message) {
      formData.append('message', data.message);
    } else {
      formData.append('message', '');
    }

    if (data.context) formData.append('context', JSON.stringify(data.context));
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => formData.append('files', file));
    }
    return await apiClient.postFormData<any>('/ai-assistant/generate-actions', formData);
  }
}

export const neuroAbaiService = new NeuroAbaiService();
