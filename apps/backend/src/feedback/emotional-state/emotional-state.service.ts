import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EMO_TREND_THRESHOLD } from '../constants/emotional';

interface FeedbackSubmittedItem {
  templateId: number;
  responseId: number;
  aboutTeacherId?: number | null;
  answers: Record<string, any>;
  period: string;
  submittedAt: Date | string | null;
}

@Injectable()
export class EmotionalStateService {
  private readonly logger = new Logger(EmotionalStateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordBatch(studentId: number | undefined, items: FeedbackSubmittedItem[]) {
    if (!studentId || !items?.length) return;

    // Берём последние ответы (может быть batch из нескольких форм)
    for (const item of items) {
      const extracted = this.extract(item.answers);
      if (!extracted) continue;

      try {
        const previous = await this.prisma.emotionalState.findUnique({
          where: { studentId },
          select: {
            mood: true,
            concentration: true,
            socialization: true,
            motivation: true,
          },
        });

        const mood = extracted.mood;
        const concentration = extracted.concentration;
        const socialization = extracted.socialization;
        const motivation = extracted.motivation;

        const moodTrend = previous ? this.trend(previous.mood, mood) : 'neutral';
        const concentrationTrend = previous ? this.trend(previous.concentration, concentration) : 'neutral';
        const socializationTrend = previous ? this.trend(previous.socialization, socialization) : 'neutral';
        const motivationTrend = previous ? this.trend(previous.motivation, motivation) : 'neutral';

        // upsert текущего snapshot
        await this.prisma.emotionalState.upsert({
          where: { studentId },
          create: {
            studentId,
            mood,
            moodDesc: this.descMood(mood),
            moodTrend: moodTrend,
            concentration,
            concentrationDesc: this.descConcentration(concentration),
            concentrationTrend: concentrationTrend,
            socialization,
            socializationDesc: this.descSocialization(socialization),
            socializationTrend: socializationTrend,
            motivation,
            motivationDesc: this.descMotivation(motivation),
            motivationTrend: motivationTrend,
          },
          update: {
            mood,
            moodDesc: this.descMood(mood),
            moodTrend: moodTrend,
            concentration,
            concentrationDesc: this.descConcentration(concentration),
            concentrationTrend: concentrationTrend,
            socialization,
            socializationDesc: this.descSocialization(socialization),
            socializationTrend: socializationTrend,
            motivation,
            motivationDesc: this.descMotivation(motivation),
            motivationTrend: motivationTrend,
          },
        });

        // Расчёт производных
        const stress = this.computeStress(mood, motivation);
        const engagement = this.computeEngagement(motivation, socialization);

        // Запись в историю (snapshot)
        try {
          await this.prisma.emotionalStateHistory.create({
            data: {
              studentId,
              submissionId: item.responseId ?? undefined,
              mood,
              concentration,
              socialization,
              motivation,
              stress: stress ?? undefined,
              engagement: engagement ?? undefined,
              moodTrend,
              concentrationTrend,
              socializationTrend,
              motivationTrend,
            },
          });
        } catch (historyErr) {
          if ((historyErr as any)?.code === 'P2002') {
            // duplicate (studentId, submissionId) snapshot – idempotent skip
          } else {
            this.logger.error(
              `Failed to insert EmotionalStateHistory for student ${studentId}: ${
                historyErr instanceof Error ? historyErr.message : historyErr
              }`,
            );
          }
        }
      } catch (err) {
        this.logger.error(`Failed to upsert emotional state for student ${studentId}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  private extract(ans: Record<string, any>) {
    // поддерживаем разные ключи
    const moodRaw = ans.mood_today ?? ans.overall_satisfaction;
    const concentrationRaw = ans.concentration_level;
    const socializationRaw = ans.socialization_level;
    const motivationRaw = ans.motivation_level;
    if (
      moodRaw === undefined &&
      concentrationRaw === undefined &&
      socializationRaw === undefined &&
      motivationRaw === undefined
    ) return null;

    return {
      mood: this.normalize(moodRaw),
      concentration: this.normalize(concentrationRaw),
      socialization: this.normalize(socializationRaw),
      motivation: this.normalize(motivationRaw),
    };
  }

  private normalize(v: any): number {
    if (v === undefined || v === null) return 50;
    if (typeof v === 'number') {
      if (v <= 5) return Math.round(((v - 1) / 4) * 100);
      if (v <= 10) return Math.round(((v - 1) / 9) * 100);
      return Math.min(Math.max(v, 0), 100);
    }
    if (typeof v === 'boolean') return v ? 100 : 0;
    return 50;
  }

  private trend(prev: number, curr: number): string {
    const diff = curr - prev;
    if (diff > EMO_TREND_THRESHOLD) return 'up';
    if (diff < -EMO_TREND_THRESHOLD) return 'down';
    return 'neutral';
  }

  private descMood(v: number): string {
    if (v >= 80) return 'Отличное настроение';
    if (v >= 60) return 'Хорошее настроение';
    if (v >= 40) return 'Нейтральное настроение';
    if (v >= 20) return 'Плохое настроение';
    return 'Очень плохое настроение';
  }

  private descConcentration(v: number): string {
    if (v >= 80) return 'Высокая концентрация';
    if (v >= 60) return 'Хорошая концентрация';
    if (v >= 40) return 'Средняя концентрация';
    if (v >= 20) return 'Низкая концентрация';
    return 'Очень низкая концентрация';
  }

  private descSocialization(v: number): string {
    if (v >= 80) return 'Высокая социализация';
    if (v >= 60) return 'Хорошая социализация';
    if (v >= 40) return 'Средняя социализация';
    if (v >= 20) return 'Низкая социализация';
    return 'Очень низкая социализация';
  }

  private descMotivation(v: number): string {
    if (v >= 80) return 'Высокая мотивация';
    if (v >= 60) return 'Хорошая мотивация';
    if (v >= 40) return 'Средняя мотивация';
    if (v >= 20) return 'Низкая мотивация';
    return 'Очень низкая мотивация';
  }

  private computeStress(mood?: number, motivation?: number): number | null {
    if (mood === undefined || mood === null || motivation === undefined || motivation === null) return null;
    return Math.max(0, Math.min(100, Math.round(100 - (mood + motivation) / 2)));
  }

  private computeEngagement(motivation?: number, socialization?: number): number | null {
    if (motivation === undefined || motivation === null || socialization === undefined || socialization === null) return null;
    return Math.max(0, Math.min(100, Math.round((motivation + socialization) / 2)));
  }
}
