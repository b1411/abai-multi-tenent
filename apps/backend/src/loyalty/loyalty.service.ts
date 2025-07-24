import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyFilter, PeriodType } from './dto/loyalty-filter.dto';
import { CreateReviewRequest } from './dto/create-review.dto';
import { ReviewReactionDto } from './dto/review-reaction.dto';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  // Получение отзывов из существующих данных feedback
  async getReviews(filter?: LoyaltyFilter) {
    const where: any = { isPublished: true };
    const take = filter?.limit || 10;
    const skip = filter?.page ? (filter.page - 1) * take : 0;

    // Фильтры по дате
    if (filter?.dateFrom || filter?.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.createdAt.lte = new Date(filter.dateTo);
    }

    // Фильтр по рейтингу
    if (filter?.rating) {
      where.rating = filter.rating;
    }

    // Фильтр по учителю
    if (filter?.teacherId) {
      where.teacherId = filter.teacherId;
    }

    // Фильтр по группе
    if (filter?.groupId) {
      where.groupId = filter.groupId;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.studentReview.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
            },
          },
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
          reactions: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.studentReview.count({ where }),
    ]);

    return {
      data: reviews,
      total,
      page: filter?.page || 1,
      totalPages: Math.ceil(total / take),
      limit: take,
    };
  }

  // Создание отзыва (через feedback или напрямую)
  async createReview(userId: number, createReviewDto: CreateReviewRequest) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return await this.prisma.studentReview.create({
      data: {
        ...createReviewDto,
        studentId: student.id,
        isModerated: true,
        isPublished: true,
        createdAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Аналитика лояльности на основе feedback данных
  async getAnalytics(filter?: LoyaltyFilter) {
    const dateFilter = this.buildDateFilter(filter);
    const whereWithPublished = { ...dateFilter, isPublished: true };

    // Получаем данные из отзывов
    const [reviews, ratingDistribution, topTeachers] = await Promise.all([
      this.prisma.studentReview.findMany({
        where: whereWithPublished,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.studentReview.groupBy({
        by: ['rating'],
        where: whereWithPublished,
        _count: {
          rating: true,
        },
        orderBy: {
          rating: 'asc',
        },
      }),
      this.prisma.studentReview.groupBy({
        by: ['teacherId'],
        where: whereWithPublished,
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
        orderBy: {
          _avg: {
            rating: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Дополняем данными о преподавателях
    const teacherIds = topTeachers.map(t => t.teacherId);
    const teachers = await this.prisma.teacher.findMany({
      where: { id: { in: teacherIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    const topTeachersWithData = topTeachers.map(teacher => ({
      ...teacher,
      teacher: teachers.find(t => t.id === teacher.teacherId),
    }));

    return {
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0,
      ratingDistribution,
      topTeachers: topTeachersWithData,
    };
  }

  // Анализ лояльности на основе feedback responses
  async getFeedbackBasedLoyalty(filter?: LoyaltyFilter) {
    const period = filter?.period || this.getCurrentPeriod();
    
    // Получаем ответы из feedback форм, связанных с удовлетворенностью
    const feedbackResponses = await this.prisma.feedbackResponse.findMany({
      where: {
        isCompleted: true,
        period,
        template: {
          name: {
            in: ['student_satisfaction', 'course_evaluation', 'teacher_rating'],
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
          },
        },
        template: true,
      },
    });

    // Анализируем ответы
    const loyaltyMetrics = this.analyzeFeedbackForLoyalty(feedbackResponses);
    
    return {
      period,
      totalResponses: feedbackResponses.length,
      ...loyaltyMetrics,
    };
  }

  // Анализ эмоционального состояния студентов
  async getEmotionalLoyalty(filter?: LoyaltyFilter) {
    const dateFilter = this.buildDateFilter(filter);
    
    const emotionalStates = await this.prisma.emotionalState.findMany({
      where: {
        updatedAt: dateFilter.createdAt,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const averages = emotionalStates.reduce(
      (acc, state) => {
        acc.mood += state.mood;
        acc.motivation += state.motivation;
        acc.satisfaction += (state.mood + state.motivation) / 2;
        return acc;
      },
      { mood: 0, motivation: 0, satisfaction: 0 }
    );

    const count = emotionalStates.length;
    if (count > 0) {
      averages.mood = Math.round(averages.mood / count);
      averages.motivation = Math.round(averages.motivation / count);
      averages.satisfaction = Math.round(averages.satisfaction / count);
    }

    // Группировка по группам
    const byGroup = emotionalStates.reduce((acc, state) => {
      const groupName = state.student.group.name;
      if (!acc[groupName]) {
        acc[groupName] = {
          students: 0,
          totalMood: 0,
          totalMotivation: 0,
        };
      }
      acc[groupName].students++;
      acc[groupName].totalMood += state.mood;
      acc[groupName].totalMotivation += state.motivation;
      return acc;
    }, {} as Record<string, any>);

    // Вычисляем средние по группам
    const groupStats = Object.entries(byGroup).map(([group, stats]) => ({
      group,
      students: stats.students,
      averageMood: Math.round(stats.totalMood / stats.students),
      averageMotivation: Math.round(stats.totalMotivation / stats.students),
      loyaltyScore: Math.round((stats.totalMood + stats.totalMotivation) / (2 * stats.students)),
    }));

    return {
      totalStudents: count,
      averages,
      groupStats,
      emotionalStates,
    };
  }

  // Получение трендов лояльности
  async getTrends(filter?: LoyaltyFilter) {
    const periodType = filter?.period || 'month';
    
    // Получаем данные за последние периоды
    const trends = await this.getTrendsByPeriod(periodType);
    
    return trends;
  }

  // Сводная информация о лояльности
  async getSummary(filter?: LoyaltyFilter) {
    const dateFilter = this.buildDateFilter(filter);
    const whereWithPublished = { ...dateFilter, isPublished: true };

    const [
      totalReviews,
      averageRatingResult,
      activeTeachers,
      activeGroups,
      emotionalData,
      repeatPurchases,
    ] = await Promise.all([
      this.prisma.studentReview.count({
        where: whereWithPublished,
      }),
      this.prisma.studentReview.aggregate({
        where: whereWithPublished,
        _avg: {
          rating: true,
        },
      }),
      this.prisma.studentReview.groupBy({
        by: ['teacherId'],
        where: whereWithPublished,
      }).then(results => results.length),
      this.prisma.studentReview.groupBy({
        by: ['groupId'],
        where: whereWithPublished,
      }).then(results => results.length),
      this.getEmotionalLoyalty(filter),
      this.getRepeatPurchaseRate(filter),
    ]);

    const averageRating = averageRatingResult._avg.rating || 0;
    const satisfactionRate = emotionalData.averages.satisfaction || 0;
    const repeatPurchaseRate = repeatPurchases.rate || 0;

    return {
      totalReviews,
      averageRating,
      activeTeachers,
      activeGroups,
      satisfactionRate,
      repeatPurchaseRate,
      loyaltyScore: Math.round((averageRating / 5 * 100 + satisfactionRate + repeatPurchaseRate) / 3),
    };
  }

  // Анализ повторных покупок
  async getRepeatPurchaseRate(filter?: LoyaltyFilter) {
    const dateFilter = this.buildDateFilter(filter);

    const repeatPurchases = await this.prisma.repeatPurchase.findMany({
      where: {
        createdAt: dateFilter.createdAt,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    const totalStudents = await this.prisma.student.count();
    const studentsWithRepeatPurchases = new Set(repeatPurchases.map(rp => rp.studentId)).size;
    
    const rate = totalStudents > 0 ? Math.round((studentsWithRepeatPurchases / totalStudents) * 100) : 0;

    return {
      rate,
      totalStudents,
      studentsWithRepeatPurchases,
      averageDaysBetween: repeatPurchases.length > 0 
        ? Math.round(repeatPurchases.reduce((sum, rp) => sum + rp.daysBetween, 0) / repeatPurchases.length)
        : 0,
    };
  }

  // Реакции на отзывы
  async addReaction(reviewId: number, userId: number, reactionDto: ReviewReactionDto) {
    return await this.prisma.reviewReaction.upsert({
      where: {
        reviewId_userId_type: {
          reviewId,
          userId,
          type: reactionDto.type,
        },
      },
      create: {
        reviewId,
        userId,
        type: reactionDto.type,
      },
      update: {},
    });
  }

  // Получение одного отзыва
  async getReview(id: number) {
    return await this.prisma.studentReview.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });
  }

  // Аналитика по учителю
  async getTeacherAnalytics(teacherId: number, filter?: LoyaltyFilter) {
    const dateFilter = this.buildDateFilter(filter);
    const where = { teacherId, isPublished: true, ...dateFilter };

    const [reviews, averageRating, feedbackData] = await Promise.all([
      this.prisma.studentReview.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.studentReview.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.getTeacherFeedbackData(teacherId, filter),
    ]);

    return {
      teacherId,
      totalReviews: reviews.length,
      averageRating: averageRating._avg.rating || 0,
      reviews,
      feedbackData,
    };
  }

  // Аналитика по группе
  async getGroupAnalytics(groupId: number, filter?: LoyaltyFilter) {
    const dateFilter = this.buildDateFilter(filter);
    const where = { groupId, isPublished: true, ...dateFilter };

    const [reviews, groupData, emotionalData] = await Promise.all([
      this.prisma.studentReview.findMany({
        where,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
            },
          },
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.findUnique({
        where: { id: groupId },
        include: {
          students: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
            },
          },
        },
      }),
      this.getGroupEmotionalData(groupId, filter),
    ]);

    return {
      groupId,
      group: groupData,
      totalReviews: reviews.length,
      reviews,
      emotionalData,
    };
  }

  // Вспомогательные методы
  private buildDateFilter(filter?: LoyaltyFilter) {
    const dateFilter: any = {};
    
    if (filter?.dateFrom || filter?.dateTo) {
      dateFilter.createdAt = {};
      if (filter.dateFrom) dateFilter.createdAt.gte = new Date(filter.dateFrom);
      if (filter.dateTo) dateFilter.createdAt.lte = new Date(filter.dateTo);
    }

    return dateFilter;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private analyzeFeedbackForLoyalty(responses: any[]) {
    const metrics = {
      averageSatisfaction: 0,
      recommendationScore: 0,
      teacherRatings: [] as any[],
      courseRatings: [] as any[],
    };

    responses.forEach(response => {
      const answers = response.answers;
      
      // Анализируем различные типы ответов
      if (answers.overall_satisfaction) {
        metrics.averageSatisfaction += answers.overall_satisfaction;
      }
      
      if (answers.recommend_course !== undefined) {
        metrics.recommendationScore += answers.recommend_course ? 100 : 0;
      }
      
      if (answers.teacher_rating && answers.teacher_id) {
        metrics.teacherRatings.push({
          teacherId: answers.teacher_id,
          rating: answers.teacher_rating,
          comment: answers.teacher_comment,
        });
      }
    });

    const count = responses.length;
    if (count > 0) {
      metrics.averageSatisfaction = Math.round(metrics.averageSatisfaction / count);
      metrics.recommendationScore = Math.round(metrics.recommendationScore / count);
    }

    return metrics;
  }

  private async getTrendsByPeriod(periodType: string) {
    const periods = this.generatePeriods(periodType, 12); // Последние 12 периодов
    
    const trends = await Promise.all(
      periods.map(async (period) => {
        const startDate = this.getPeriodStartDate(period, periodType);
        const endDate = this.getPeriodEndDate(period, periodType);
        
        const [reviewCount, averageRating] = await Promise.all([
          this.prisma.studentReview.count({
            where: {
              isPublished: true,
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
          this.prisma.studentReview.aggregate({
            where: {
              isPublished: true,
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            _avg: {
              rating: true,
            },
          }),
        ]);
        
        return {
          period: startDate,
          review_count: reviewCount,
          average_rating: averageRating._avg.rating || 0,
        };
      })
    );
    
    return trends;
  }

  private generatePeriods(periodType: string, count: number): string[] {
    const periods: string[] = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      let period: string;
      
      if (periodType === 'month') {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (periodType === 'quarter') {
        const quarter = Math.floor((now.getMonth() - i * 3) / 3) + 1;
        const year = now.getFullYear() - Math.floor(i / 4);
        period = `${year}-Q${quarter}`;
      } else {
        period = String(now.getFullYear() - i);
      }
      
      periods.push(period);
    }
    
    return periods;
  }

  private getPeriodStartDate(period: string, periodType: string): Date {
    if (periodType === 'month') {
      const [year, month] = period.split('-').map(Number);
      return new Date(year, month - 1, 1);
    } else if (periodType === 'quarter') {
      const [year, quarterStr] = period.split('-');
      const quarter = parseInt(quarterStr.replace('Q', ''));
      return new Date(parseInt(year), (quarter - 1) * 3, 1);
    } else {
      return new Date(parseInt(period), 0, 1);
    }
  }

  private getPeriodEndDate(period: string, periodType: string): Date {
    if (periodType === 'month') {
      const [year, month] = period.split('-').map(Number);
      return new Date(year, month, 0);
    } else if (periodType === 'quarter') {
      const [year, quarterStr] = period.split('-');
      const quarter = parseInt(quarterStr.replace('Q', ''));
      return new Date(parseInt(year), quarter * 3, 0);
    } else {
      return new Date(parseInt(period), 11, 31);
    }
  }

  private async getTeacherFeedbackData(teacherId: number, filter?: LoyaltyFilter) {
    // Получаем feedback данные для конкретного учителя
    const responses = await this.prisma.feedbackResponse.findMany({
      where: {
        isCompleted: true,
        template: {
          name: {
            in: ['teacher_evaluation', 'course_evaluation'],
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    // Фильтруем ответы, связанные с данным учителем
    const teacherResponses = responses.filter(response => {
      const answers = response.answers as any;
      return answers && answers.teacher_id === teacherId;
    });

    return this.analyzeFeedbackForLoyalty(teacherResponses);
  }

  private async getGroupEmotionalData(groupId: number, filter?: LoyaltyFilter) {
    const dateFilter = this.buildDateFilter(filter);
    
    const students = await this.prisma.student.findMany({
      where: { groupId },
      include: {
        EmotionalState: true,
      },
    });

    const emotionalStates = students
      .map(student => student.EmotionalState)
      .filter(Boolean);

    if (emotionalStates.length === 0) return null;

    const averages = emotionalStates.reduce(
      (acc, state) => {
        acc.mood += state.mood;
        acc.motivation += state.motivation;
        acc.concentration += state.concentration;
        acc.socialization += state.socialization;
        return acc;
      },
      { mood: 0, motivation: 0, concentration: 0, socialization: 0 }
    );

    const count = emotionalStates.length;
    Object.keys(averages).forEach(key => {
      averages[key] = Math.round(averages[key] / count);
    });

    return {
      studentsCount: count,
      averages,
      emotionalStates,
    };
  }

  // Утилиты форматирования (совместимость с фронтендом)
  formatRating(rating: number): string {
    return `${rating}/5`;
  }

  getRatingLabel(rating: number): string {
    if (rating >= 4.5) return 'Отлично';
    if (rating >= 3.5) return 'Хорошо';
    if (rating >= 2.5) return 'Удовлетворительно';
    if (rating >= 1.5) return 'Плохо';
    return 'Очень плохо';
  }

  getRatingColor(rating: number): string {
    if (rating >= 4.5) return '#10B981';
    if (rating >= 3.5) return '#F59E0B';
    if (rating >= 2.5) return '#EF4444';
    return '#DC2626';
  }

  formatTeacherName(teacher: any): string {
    if (!teacher?.user) return 'Неизвестный учитель';
    return `${teacher.user.name} ${teacher.user.surname}`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ru-RU').format(new Date(date));
  }

  getDefaultFilter(): LoyaltyFilter {
    return {
      period: PeriodType.MONTH,
      page: 1,
      limit: 10,
    };
  }

  // Получение feedback ответов для отображения в модуле лояльности
  async getFeedbackResponses(filter?: LoyaltyFilter) {
    const where: any = { isCompleted: true };
    const take = filter?.limit || 10;
    const skip = filter?.page ? (filter.page - 1) * take : 0;

    // Фильтр по периоду
    if (filter?.period) {
      const currentPeriod = this.getCurrentPeriod();
      where.period = currentPeriod;
    }

    // Фильтр по дате
    if (filter?.dateFrom || filter?.dateTo) {
      where.submittedAt = {};
      if (filter.dateFrom) where.submittedAt.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.submittedAt.lte = new Date(filter.dateTo);
    }

    // Получаем только ответы из форм, связанных с лояльностью
    where.template = {
      name: {
        in: ['student_satisfaction', 'course_evaluation', 'teacher_rating', 'teacher_evaluation'],
      },
    };

    const [responses, total] = await Promise.all([
      this.prisma.feedbackResponse.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              role: true,
              student: {
                select: {
                  id: true,
                  group: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.feedbackResponse.count({ where }),
    ]);

    // Обрабатываем ответы для удобного отображения
    const processedResponses = responses.map(response => {
      const answers = response.answers as any;
      
      return {
        id: response.id,
        submittedAt: response.submittedAt,
        period: response.period,
        user: response.user,
        template: response.template,
        answers: answers,
        // Извлекаем ключевые метрики для отображения
        displayData: {
          overallSatisfaction: answers.overall_satisfaction || null,
          teacherRating: answers.teacher_rating || null,
          teacherComment: answers.teacher_comment || null,
          recommendCourse: answers.recommend_course || null,
          mood: answers.mood_today || null,
          motivation: answers.motivation_level || null,
          concentration: answers.concentration_level || null,
        },
      };
    });

    return {
      data: processedResponses,
      total,
      page: filter?.page || 1,
      totalPages: Math.ceil(total / take),
      limit: take,
    };
  }

  // Получение конкретного feedback ответа
  async getFeedbackResponse(id: number) {
    const response = await this.prisma.feedbackResponse.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
            student: {
              select: {
                id: true,
                group: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            title: true,
            questions: true,
          },
        },
      },
    });

    if (!response) {
      throw new Error('Feedback response not found');
    }

    return {
      ...response,
      answers: response.answers as any,
    };
  }

  // Статистика по feedback ответам
  async getFeedbackResponsesStats(filter?: LoyaltyFilter) {
    const dateFilter = this.buildDateFilter(filter);
    
    const where = {
      isCompleted: true,
      template: {
        name: {
          in: ['student_satisfaction', 'course_evaluation', 'teacher_rating', 'teacher_evaluation'],
        },
      },
      ...dateFilter,
    };

    const [
      totalResponses,
      responsesByTemplate,
      responsesByPeriod,
      averageRatings,
    ] = await Promise.all([
      this.prisma.feedbackResponse.count({ where }),
      
      this.prisma.feedbackResponse.groupBy({
        by: ['templateId'],
        where,
        _count: { id: true },
      }),
      
      this.prisma.feedbackResponse.groupBy({
        by: ['period'],
        where,
        _count: { id: true },
        orderBy: { period: 'desc' },
      }),
      
      // Тут нужно будет агрегировать JSON поля отдельно
      this.getAverageRatingsFromResponses(filter),
    ]);

    return {
      totalResponses,
      responsesByTemplate,
      responsesByPeriod,
      averageRatings,
    };
  }

  private async getAverageRatingsFromResponses(filter?: LoyaltyFilter) {
    const dateFilter = this.buildDateFilter(filter);
    
    const responses = await this.prisma.feedbackResponse.findMany({
      where: {
        isCompleted: true,
        template: {
          name: {
            in: ['student_satisfaction', 'course_evaluation', 'teacher_rating'],
          },
        },
        ...dateFilter,
      },
      select: {
        answers: true,
      },
    });

    let totalSatisfaction = 0;
    let satisfactionCount = 0;
    let totalTeacherRating = 0;
    let teacherRatingCount = 0;
    let recommendCount = 0;
    let totalRecommend = 0;

    responses.forEach(response => {
      const answers = response.answers as any;
      
      if (answers.overall_satisfaction) {
        totalSatisfaction += answers.overall_satisfaction;
        satisfactionCount++;
      }
      
      if (answers.teacher_rating) {
        totalTeacherRating += answers.teacher_rating;
        teacherRatingCount++;
      }
      
      if (answers.recommend_course !== undefined) {
        recommendCount++;
        if (answers.recommend_course) {
          totalRecommend++;
        }
      }
    });

    return {
      averageSatisfaction: satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0,
      averageTeacherRating: teacherRatingCount > 0 ? totalTeacherRating / teacherRatingCount : 0,
      recommendationRate: recommendCount > 0 ? (totalRecommend / recommendCount) * 100 : 0,
    };
  }
}
