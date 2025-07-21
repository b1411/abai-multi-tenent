import apiClient from './apiClient';

export interface NeuroAbaiRequest {
  message: string;
  scenario: string;
  files?: File[];
}

class NeuroAbaiService {
  /**
   * Отправляет сообщение в Neuro Abai AI
   */
  async sendMessage(data: NeuroAbaiRequest): Promise<string> {
    const formData = new FormData();
    formData.append('message', data.message);
    formData.append('scenario', data.scenario);
    
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await apiClient.postFormData<string>('/ai-assistant/openai-responses', formData);
    return response;
  }
}

export const neuroAbaiService = new NeuroAbaiService();
