import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;

  async createEphemeralToken() {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-10-01',
          voice: 'alloy',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`OpenAI API error: ${response.status} - ${error}`);
        throw new Error(`Failed to create ephemeral token: ${response.status}`);
      }

      const data = await response.json();

      return {
        client_secret: data.client_secret,
      };
    } catch (error) {
      this.logger.error('Error creating ephemeral token:', error);
      throw error;
    }
  }
}
