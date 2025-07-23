import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { LoyaltyFilterDto, MetricType, PeriodType } from './dto/loyalty-filter.dto';
import { ReviewReactionDto } from './dto/review-reaction.dto';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(createReviewDto: CreateReviewDto, userId: number) {
    return await this.prisma.studentReview.create({
      data: {
        ...createReviewDto,
        studentId: userId,
        createdAt: new Date(),
      },
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
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getReviews(filter: LoyaltyFilterDto) {
    const where: any = {};

    if (filter.teacherId) {
      where.teacherId = filter.teacherId;
    }

    if (filter.groupId) {
      where.groupId = filter.groupId;
    }

    if (filter.rating) {
      where.rating = filter.rating;
    }

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) {
        where.createdAt.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.createdAt.lte = new Date(filter.dateTo);
      }
    }

    const reviews = await this.prisma.studentReview.findMany({
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
      orderBy: {
        [filter.sortBy || 'createdAt']: filter.sortOrder || 'desc',
      },
      skip: ((filter.page || 1) - 1) * (filter.limit || 10),
      take: filter.limit || 10,
    });

    const total = await this.prisma.studentReview.count({ where });

    return {
      data: reviews,
      total,
      page: filter.page || 1,
      limit: filter.limit || 10,
      totalPages: Math.ceil(total / (filter.limit || 10)),
    };
  }

  async getReview(id: number) {
    return await this.prisma.studentReview.findUnique({
      where: { id },
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

  async addReaction(reviewId: number, reactionDto: ReviewReactionDto, userId: number) {
    return await this.prisma.reviewReaction.upsert({
      where: {
        reviewId_userId_type: {
          reviewId,
          userId,
          type: reactionDto.type,
        },
      },
      update: {
        type: reactionDto.type,
      },
      create: {
        reviewId,
        userId,
        type: reactionDto.type,
      },
    });
  }

  async getAnalytics(filter: LoyaltyFilterDto) {
    const dateFilter = this.buildDateFilter(filter);

    const totalReviews = await this.prisma.studentReview.count({
      where: dateFilter,
    });

    const averageRating = await this.prisma.studentReview.aggregate({
      where: dateFilter,
      _avg: {
        rating: true,
      },
    });

    const ratingDistribution = await this.prisma.studentReview.groupBy({
      by: ['rating'],
      where: dateFilter,
      _count: {
        rating: true,
      },
    });

    const topTeachers = await this.prisma.studentReview.groupBy({
      by: ['teacherId'],
      where: dateFilter,
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
    });

    const teachersWithNames = await Promise.all(
      topTeachers.map(async (teacher) => {
        const teacherData = await this.prisma.teacher.findUnique({
          where: { id: teacher.teacherId },
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
        return {
          ...teacher,
          teacher: teacherData,
        };
      }),
    );

    return {
      totalReviews,
      averageRating: averageRating._avg.rating || 0,
      ratingDistribution,
      topTeachers: teachersWithNames,
    };
  }

  async getTrends(filter: LoyaltyFilterDto) {
    const period = filter.period || PeriodType.MONTH;
    const dateFilter = this.buildDateFilter(filter);

    // Используем Prisma groupBy вместо raw SQL для избежания ошибок GROUP BY
    const startDate = dateFilter.createdAt?.gte || new Date('2020-01-01');
    const endDate = dateFilter.createdAt?.lte || new Date();

    try {
      // Получаем все отзывы в диапазоне дат
      const reviews = await this.prisma.studentReview.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          rating: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Группируем данные по периодам в JavaScript
      const trendsMap = new Map<string, { sum: number; count: number }>();

      reviews.forEach((review) => {
        let periodKey: string;
        const date = new Date(review.createdAt);

        switch (period) {
          case PeriodType.MONTH: {
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          }
          case PeriodType.QUARTER: {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          }
          case PeriodType.YEAR: {
            periodKey = `${date.getFullYear()}-01-01`;
            break;
          }
          default: {
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
          }
        }

        if (!trendsMap.has(periodKey)) {
          trendsMap.set(periodKey, { sum: 0, count: 0 });
        }

        const current = trendsMap.get(periodKey);
        if (current) {
          current.sum += review.rating;
          current.count += 1;
        }
      });

      // Преобразуем в массив результатов
      const trends = Array.from(trendsMap.entries()).map(([period, data]) => ({
        period,
        average_rating: data.count > 0 ? data.sum / data.count : 0,
        review_count: data.count,
      }));

      // Сортируем по периоду
      trends.sort((a, b) => a.period.localeCompare(b.period));

      return trends;
    } catch (error) {
      console.error('Error getting trends:', error);
      return [];
    }
  }

  async getTeacherAnalytics(teacherId: number, filter: LoyaltyFilterDto) {
    const dateFilter = this.buildDateFilter(filter);
    const where = { ...dateFilter, teacherId };

    const totalReviews = await this.prisma.studentReview.count({ where });

    const averageRating = await this.prisma.studentReview.aggregate({
      where,
      _avg: { rating: true },
    });

    const ratingDistribution = await this.prisma.studentReview.groupBy({
      by: ['rating'],
      where,
      _count: { rating: true },
    });

    const recentReviews = await this.prisma.studentReview.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      totalReviews,
      averageRating: averageRating._avg.rating || 0,
      ratingDistribution,
      recentReviews,
    };
  }

  async getGroupAnalytics(groupId: number, filter: LoyaltyFilterDto) {
    const dateFilter = this.buildDateFilter(filter);
    const where = { ...dateFilter, groupId };

    const totalReviews = await this.prisma.studentReview.count({ where });

    const averageRating = await this.prisma.studentReview.aggregate({
      where,
      _avg: { rating: true },
    });

    const teacherRatings = await this.prisma.studentReview.groupBy({
      by: ['teacherId'],
      where,
      _avg: { rating: true },
      _count: { rating: true },
    });

    const teachersWithNames = await Promise.all(
      teacherRatings.map(async (teacher) => {
        const teacherData = await this.prisma.teacher.findUnique({
          where: { id: teacher.teacherId },
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
        return {
          ...teacher,
          teacher: teacherData,
        };
      }),
    );

    return {
      totalReviews,
      averageRating: averageRating._avg.rating || 0,
      teacherRatings: teachersWithNames,
    };
  }

  async getSummary(filter: LoyaltyFilterDto) {
    const dateFilter = this.buildDateFilter(filter);

    const summary = await Promise.all([
      this.prisma.studentReview.count({ where: dateFilter }),
      this.prisma.studentReview.aggregate({
        where: dateFilter,
        _avg: { rating: true },
      }),
      this.prisma.studentReview.groupBy({
        by: ['teacherId'],
        where: dateFilter,
        _count: { teacherId: true },
      }),
      this.prisma.studentReview.groupBy({
        by: ['groupId'],
        where: dateFilter,
        _count: { groupId: true },
      }),
      this.getRepeatPurchaseRate(dateFilter),
    ]);

    const [totalReviews, avgRating, teacherCounts, groupCounts, repeatPurchaseRate] = summary;

    return {
      totalReviews,
      averageRating: avgRating._avg.rating || 0,
      activeTeachers: teacherCounts.length,
      activeGroups: groupCounts.length,
      satisfactionRate: avgRating._avg.rating ? (avgRating._avg.rating / 5) * 100 : 0,
      repeatPurchaseRate,
    };
  }

  // Новый метод для расчета процента повторных покупок
  async getRepeatPurchaseRate(dateFilter?: any) {
    try {
      // Получаем всех студентов, которые делали покупки в указанном периоде
      const studentsWithPayments = await this.prisma.student.findMany({
        include: {
          Payment: {
            where: {
              status: 'paid',
              paymentDate: dateFilter?.createdAt ? {
                gte: dateFilter.createdAt.gte,
                lte: dateFilter.createdAt.lte,
              } : undefined,
            },
            orderBy: { paymentDate: 'asc' },
          },
        },
      });

      let totalStudents = 0;
      let studentsWithRepeatPurchases = 0;

      for (const student of studentsWithPayments) {
        const payments = student.Payment;
        if (payments.length > 0) {
          totalStudents++;
          
          // Проверяем, есть ли у студента более одной покупки
          if (payments.length > 1) {
            studentsWithRepeatPurchases++;
          }
        }
      }

      return totalStudents > 0 ? (studentsWithRepeatPurchases / totalStudents) * 100 : 0;
    } catch (error) {
      console.error('Error calculating repeat purchase rate:', error);
      return 0;
    }
  }

  // Новый метод для получения детальной аналитики повторных покупок
  async getRepeatPurchaseAnalytics(filter: LoyaltyFilterDto) {
    const dateFilter = this.buildDateFilter(filter);

    try {
      // Получаем записи повторных покупок
      const repeatPurchases = await this.prisma.repeatPurchase.findMany({
        where: {
          createdAt: dateFilter?.createdAt ? {
            gte: dateFilter.createdAt.gte,
            lte: dateFilter.createdAt.lte,
          } : undefined,
        },
        include: {
          student: {
            include: {
              user: {
                select: { name: true, surname: true },
              },
              group: {
                select: { name: true },
              },
            },
          },
          firstPurchase: true,
          secondPurchase: true,
        },
      });

      // Группируем по периодам между покупками
      const purchaseIntervals = repeatPurchases.reduce((acc, purchase) => {
        const interval = purchase.daysBetween;
        let category = '';

        if (interval <= 30) category = '0-30 дней';
        else if (interval <= 90) category = '31-90 дней';
        else if (interval <= 180) category = '91-180 дней';
        else category = '180+ дней';

        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Средний интервал между покупками
      const avgInterval = repeatPurchases.length > 0
        ? repeatPurchases.reduce((sum, p) => sum + p.daysBetween, 0) / repeatPurchases.length
        : 0;

      return {
        totalRepeatPurchases: repeatPurchases.length,
        purchaseIntervals,
        averageInterval: Math.round(avgInterval),
        repeatPurchases: repeatPurchases.slice(0, 20), // Последние 20 для отображения
      };
    } catch (error) {
      console.error('Error getting repeat purchase analytics:', error);
      return {
        totalRepeatPurchases: 0,
        purchaseIntervals: {},
        averageInterval: 0,
        repeatPurchases: [],
      };
    }
  }

  // Метод для автоматического создания записей повторных покупок
  async updateRepeatPurchases() {
    try {
      // Получаем всех студентов с их платежами
      const studentsWithPayments = await this.prisma.student.findMany({
        include: {
          Payment: {
            where: { status: 'paid' },
            orderBy: { paymentDate: 'asc' },
          },
        },
      });

      for (const student of studentsWithPayments) {
        const payments = student.Payment;
        
        for (let i = 1; i < payments.length; i++) {
          const firstPayment = payments[i - 1];
          const secondPayment = payments[i];

          if (firstPayment.paymentDate && secondPayment.paymentDate) {
            const daysBetween = Math.floor(
              (new Date(secondPayment.paymentDate).getTime() - 
               new Date(firstPayment.paymentDate).getTime()) / 
              (1000 * 60 * 60 * 24)
            );

            // Создаем запись повторной покупки, если её еще нет
            await this.prisma.repeatPurchase.upsert({
              where: {
                studentId_firstPurchaseId_secondPurchaseId: {
                  studentId: student.id,
                  firstPurchaseId: firstPayment.id,
                  secondPurchaseId: secondPayment.id,
                },
              },
              create: {
                studentId: student.id,
                firstPurchaseId: firstPayment.id,
                secondPurchaseId: secondPayment.id,
                daysBetween,
              },
              update: {
                daysBetween,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating repeat purchases:', error);
    }
  }

  private buildDateFilter(filter: LoyaltyFilterDto) {
    const where: any = {};

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) {
        where.createdAt.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.createdAt.lte = new Date(filter.dateTo);
      }
    }

    return where;
  }
}
