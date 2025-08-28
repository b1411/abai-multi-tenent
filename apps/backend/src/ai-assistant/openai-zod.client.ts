// Опциональный клиент с использованием официальной библиотеки openai + zod parse helper.
// Пока основной код использует fetch + response_format json_schema. Этот клиент демонстрационный.

import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';

// Согласовано с simpleScheduleSchema
export const SimpleScheduleZ = z.object({
  lessons: z.array(z.object({
    day: z.number().int().min(1).max(5),
    slot: z.number().int().min(1).max(8),
    studyPlanId: z.number().int(),
    groupId: z.number().int(),
    teacherId: z.number().int(),
    classroomId: z.number().int().optional().nullable(),
    recurrence: z.literal('weekly')
  }))
});
export type SimpleScheduleZType = z.infer<typeof SimpleScheduleZ>;

export class OpenAiZodClient {
  private readonly client: OpenAI;
  constructor(apiKey?: string) {
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    this.client = new OpenAI({ apiKey });
  }

  async generateSimpleSchedule(prompt: string): Promise<SimpleScheduleZType> {
    const res = await this.client.responses.parse({
      model: 'gpt-4o-2024-08-06',
      input: [
        { role: 'system', content: 'Сформируй учебное расписание. Возвращай только JSON.' },
        { role: 'user', content: prompt }
      ],
      text: { format: zodTextFormat(SimpleScheduleZ, 'simple_schedule') }
    });
    return res.output_parsed;
  }
}
