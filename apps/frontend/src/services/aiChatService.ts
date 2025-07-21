import apiClient from './apiClient';

export interface EphemeralToken {
  client_secret: {
    value: string;
    expires_at: number;
  };
}

class AiChatService {
  /**
   * Получает ephemeral token для OpenAI Realtime API
   */
  async getEphemeralToken(): Promise<EphemeralToken> {
    const response = await apiClient.post<EphemeralToken>('/ai-assistant/session');
    return response;
  }

  /**
   * Проверяет, действителен ли токен
   */
  isTokenValid(token: EphemeralToken): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return token.client_secret.expires_at > currentTime;
  }

  /**
   * Получает оставшееся время жизни токена в секундах
   */
  getTokenTimeRemaining(token: EphemeralToken): number {
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, token.client_secret.expires_at - currentTime);
  }
}

export const aiChatService = new AiChatService();
