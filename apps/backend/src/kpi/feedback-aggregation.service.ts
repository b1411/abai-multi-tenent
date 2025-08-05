import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface KpiAggregationResult {
  metricType: string;
  score: number;
  responseCount: number;
  confidence: number; // 0-1, уверенность в результате
  details: {
    averageRating?: number;
    positiveResponses?: number;
    totalResponses?: number;
    breakdownByQuestion?: { [questionId: string]: number };
  };
}

@Injectable()
export class FeedbackAggregationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Агрегирует фидбеки студентов для расчета KPI удержания конкретного преподавателя
   */
  async aggregateStudentRetentionKpi(teacherId: number): Promise<KpiAggregationResult> {
    // Получаем студентов данного преподавателя
    const studentsOfTeacher = await this.prisma.student.findMany({
      where: {
        group: {
          studyPlans: {
            some: {
              teacherId: teacherId,
            },
          },
        },
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (studentsOfTeacher.length === 0) {
      return {
        metricType: 'STUDENT_RETENTION',
        score: 0,
        responseCount: 0,
        confidence: 0,
        details: {
          totalResponses: 0,
          positiveResponses: 0,
        },
      };
    }

    const studentUserIds = studentsOfTeacher.map(s => s.user.id);

    // Получаем фидбеки от студентов с KPI-вопросами об удержании
    // Убираем требование aboutTeacherId, так как считаем что все фидбеки студентов относятся к их преподавателю
    const retentionFeedbacks = await this.prisma.feedbackResponse.findMany({
      where: {
        userId: {
          in: studentUserIds,
        },
        user: {
          role: 'STUDENT',
        },
        isCompleted: true,
        template: {
          hasKpiQuestions: true,
          kpiMetrics: {
            has: 'STUDENT_RETENTION',
          },
        },
        // Фидбеки за последние 3 месяца
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        template: true,
      },
    });

    if (retentionFeedbacks.length === 0) {
      return {
        metricType: 'STUDENT_RETENTION',
        score: 0,
        responseCount: 0,
        confidence: 0,
        details: {
          totalResponses: 0,
        },
      };
    }

    return this.aggregateKpiFromFeedbacks(retentionFeedbacks, 'STUDENT_RETENTION');
  }

  /**
   * Агрегирует фидбеки для любого типа KPI метрики
   */
  aggregateKpiFromFeedbacks(
    feedbacks: any[],
    metricType: string
  ): KpiAggregationResult {
    let totalScore = 0;
    let totalWeight = 0;
    let responseCount = 0;
    const questionBreakdown: { [questionId: string]: number } = {};
    let positiveResponses = 0;

    feedbacks.forEach(feedback => {
      const answers = feedback.answers;
      const template = feedback.template;
      const questions = template.questions as any[];

      questions
        .filter(q => q.kpiMetric === metricType && q.isKpiRelevant !== false)
        .forEach(question => {
          const answer = answers[question.id];
          
          if (answer !== undefined && answer !== null) {
            const scoreResult = this.convertAnswerToScore(answer, question);
            
            if (scoreResult.score >= 0) {
              const weight = question.kpiWeight || 1;
              totalScore += scoreResult.score * weight;
              totalWeight += weight;
              responseCount++;

              // Записываем детализацию по вопросам
              if (!questionBreakdown[question.id]) {
                questionBreakdown[question.id] = 0;
              }
              questionBreakdown[question.id] += scoreResult.score;

              // Считаем позитивные ответы (>= 60%)
              if (scoreResult.score >= 60) {
                positiveResponses++;
              }
            }
          }
        });
    });

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const confidence = this.calculateConfidence(responseCount, feedbacks.length);

    return {
      metricType,
      score: Math.round(finalScore),
      responseCount,
      confidence,
      details: {
        averageRating: finalScore,
        positiveResponses,
        totalResponses: responseCount,
        breakdownByQuestion: questionBreakdown,
      },
    };
  }

  /**
   * Конвертирует ответ в числовой балл (0-100)
   */
  private convertAnswerToScore(answer: any, question: any): { score: number; isValid: boolean } {
    switch (question.type) {
      case 'YES_NO':
        return {
          score: answer === true ? 100 : 0,
          isValid: typeof answer === 'boolean',
        };

      case 'RATING_1_5':
        if (typeof answer === 'number' && answer >= 1 && answer <= 5) {
          return {
            score: ((answer - 1) / 4) * 100, // Нормализуем к 0-100
            isValid: true,
          };
        }
        break;

      case 'RATING_1_10':
        if (typeof answer === 'number' && answer >= 1 && answer <= 10) {
          return {
            score: ((answer - 1) / 9) * 100, // Нормализуем к 0-100
            isValid: true,
          };
        }
        break;

      case 'SINGLE_CHOICE':
        if (typeof answer === 'number' && question.options?.length > 0) {
          // Предполагаем, что варианты идут от худшего к лучшему
          const maxIndex = question.options.length - 1;
          return {
            score: (answer / maxIndex) * 100,
            isValid: answer >= 0 && answer <= maxIndex,
          };
        }
        break;

      case 'MULTIPLE_CHOICE':
        if (Array.isArray(answer) && question.options?.length > 0) {
          // Для множественного выбора считаем процент выбранных позитивных вариантов
          const positiveOptions = question.positiveOptions || []; // Массив индексов позитивных вариантов
          const selectedPositive = answer.filter(idx => positiveOptions.includes(idx)).length;
          const totalPositive = positiveOptions.length;
          
          return {
            score: totalPositive > 0 ? (selectedPositive / totalPositive) * 100 : 50,
            isValid: true,
          };
        }
        break;

      case 'EMOTIONAL_SCALE':
        // Эмоциональная шкала (обычно 1-5, где 5 - очень хорошо)
        if (typeof answer === 'number' && answer >= 1 && answer <= 5) {
          return {
            score: ((answer - 1) / 4) * 100,
            isValid: true,
          };
        }
        break;

      case 'TEXT':
        // Для текстовых ответов можно добавить анализ тональности в будущем
        // Пока возвращаем нейтральный балл
        if (typeof answer === 'string' && answer.trim().length > 0) {
          return {
            score: 50, // Нейтральный балл
            isValid: true,
          };
        }
        break;

      default:
        // Неизвестный тип вопроса
        break;
    }

    return { score: -1, isValid: false };
  }

  /**
   * Рассчитывает уверенность в результате на основе количества ответов
   */
  private calculateConfidence(responseCount: number, totalFeedbacks: number): number {
    if (responseCount === 0) return 0;

    // Базовая уверенность на основе количества ответов
    let confidence = Math.min(responseCount / 10, 1); // 10+ ответов = максимальная уверенность

    // Бонус за полноту ответов в фидбеках
    if (totalFeedbacks > 0) {
      const completenessBonus = Math.min(responseCount / totalFeedbacks, 1) * 0.2;
      confidence = Math.min(confidence + completenessBonus, 1);
    }

    return Math.round(confidence * 100) / 100; // Округляем до 2 знаков
  }

  /**
   * Агрегирует все KPI метрики для преподавателя на основе фидбеков
   */
  async aggregateAllKpiMetricsForTeacher(teacherId: number): Promise<{ [metricType: string]: KpiAggregationResult }> {
    const kpiMetrics = [
      'STUDENT_RETENTION',
      'TEACHER_SATISFACTION', 
      'TEACHING_QUALITY',
      'LESSON_EFFECTIVENESS',
      'RECOMMENDATION',
      'OVERALL_EXPERIENCE'
    ];

    const results: { [metricType: string]: KpiAggregationResult } = {};

    for (const metricType of kpiMetrics) {
      try {
        if (metricType === 'STUDENT_RETENTION') {
          results[metricType] = await this.aggregateStudentRetentionKpi(teacherId);
        } else {
          results[metricType] = await this.aggregateGenericKpiMetric(teacherId, metricType);
        }
      } catch (error) {
        console.error(`Error aggregating ${metricType} for teacher ${teacherId}:`, error);
        results[metricType] = {
          metricType,
          score: 0,
          responseCount: 0,
          confidence: 0,
          details: { totalResponses: 0 },
        };
      }
    }

    return results;
  }

  /**
   * Агрегирует любую KPI метрику для преподавателя
   */
  private async aggregateGenericKpiMetric(teacherId: number, metricType: string): Promise<KpiAggregationResult> {
    // Получаем студентов данного преподавателя
    const studentsOfTeacher = await this.prisma.student.findMany({
      where: {
        group: {
          studyPlans: {
            some: {
              teacherId: teacherId,
            },
          },
        },
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (studentsOfTeacher.length === 0) {
      return {
        metricType,
        score: 0,
        responseCount: 0,
        confidence: 0,
        details: { totalResponses: 0 },
      };
    }

    const studentUserIds = studentsOfTeacher.map(s => s.user.id);

    // Получаем фидбеки с данной KPI метрикой
    const feedbacks = await this.prisma.feedbackResponse.findMany({
      where: {
        userId: {
          in: studentUserIds,
        },
        user: {
          role: 'STUDENT',
        },
        isCompleted: true,
        template: {
          hasKpiQuestions: true,
          kpiMetrics: {
            has: metricType,
          },
        },
        // Фидбеки за последние 3 месяца
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        template: true,
      },
    });

    if (feedbacks.length === 0) {
      return {
        metricType,
        score: 0,
        responseCount: 0,
        confidence: 0,
        details: { totalResponses: 0 },
      };
    }

    return this.aggregateKpiFromFeedbacks(feedbacks, metricType);
  }

  /**
   * Получает статистику по фидбек-агрегации для дашборда
   */
  async getFeedbackAggregationStats(): Promise<{
    totalFeedbacks: number;
    kpiRelevantFeedbacks: number;
    teachersWithFeedbacks: number;
    averageResponseRate: number;
    metricsCoverage: { [metricType: string]: number };
  }> {
    const totalFeedbacks = await this.prisma.feedbackResponse.count({
      where: {
        isCompleted: true,
      },
    });

    const kpiRelevantFeedbacks = await this.prisma.feedbackResponse.count({
      where: {
        isCompleted: true,
        template: {
          hasKpiQuestions: true,
        },
      },
    });

    // Считаем преподавателей, для которых есть фидбеки от их студентов
    const teachersWithFeedbacks = await this.prisma.teacher.count({
      where: {
        studyPlans: {
          some: {
            group: {
              some: {
                students: {
                  some: {
                    user: {
                      feedbackResponses: {
                        some: {
                          isCompleted: true,
                          template: {
                            hasKpiQuestions: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const totalTeachers = await this.prisma.teacher.count();
    const averageResponseRate = totalTeachers > 0 ? (teachersWithFeedbacks / totalTeachers) * 100 : 0;

    // Статистика по покрытию метрик
    const kpiMetrics = [
      'STUDENT_RETENTION',
      'TEACHER_SATISFACTION',
      'TEACHING_QUALITY',
      'LESSON_EFFECTIVENESS',
      'RECOMMENDATION',
      'OVERALL_EXPERIENCE'
    ];

    const metricsCoverage: { [metricType: string]: number } = {};

    for (const metricType of kpiMetrics) {
      const count = await this.prisma.feedbackResponse.count({
        where: {
          isCompleted: true,
          template: {
            hasKpiQuestions: true,
            kpiMetrics: {
              has: metricType,
            },
          },
        },
      });
      metricsCoverage[metricType] = count;
    }

    return {
      totalFeedbacks,
      kpiRelevantFeedbacks,
      teachersWithFeedbacks,
      averageResponseRate: Math.round(averageResponseRate),
      metricsCoverage,
    };
  }
}
