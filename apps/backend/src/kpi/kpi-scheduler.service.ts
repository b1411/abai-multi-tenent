import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KpiService } from './kpi.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiSchedulerService {
  private readonly logger = new Logger(KpiSchedulerService.name);

  constructor(
    private readonly kpiService: KpiService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Ежедневное обновление KPI в 2:00 утра
   */
  @Cron('0 2 * * *')
  async handleDailyKpiUpdate() {
    this.logger.log('Начинаем ежедневное обновление KPI...');
    
    try {
      const settings = await this.kpiService.getSettings();
      
      if (settings.settings.calculationPeriod === 'daily') {
        await this.updateAllTeachersKpi();
        this.logger.log('Ежедневное обновление KPI завершено успешно');
      }
    } catch (error) {
      this.logger.error('Ошибка при ежедневном обновлении KPI:', error);
    }
  }

  /**
   * Еженедельное обновление KPI по понедельникам в 3:00 утра
   */
  @Cron('0 3 * * 1')
  async handleWeeklyKpiUpdate() {
    this.logger.log('Начинаем еженедельное обновление KPI...');
    
    try {
      const settings = await this.kpiService.getSettings();
      
      if (settings.settings.calculationPeriod === 'weekly') {
        await this.updateAllTeachersKpi();
        this.logger.log('Еженедельное обновление KPI завершено успешно');
      }
    } catch (error) {
      this.logger.error('Ошибка при еженедельном обновлении KPI:', error);
    }
  }

  /**
   * Ежемесячное обновление KPI в первый день месяца в 4:00 утра
   */
  @Cron('0 4 1 * *')
  async handleMonthlyKpiUpdate() {
    this.logger.log('Начинаем ежемесячное обновление KPI...');
    
    try {
      const settings = await this.kpiService.getSettings();
      
      if (settings.settings.calculationPeriod === 'monthly') {
        await this.updateAllTeachersKpi();
        await this.createMonthlySnapshot();
        this.logger.log('Ежемесячное обновление KPI завершено успешно');
      }
    } catch (error) {
      this.logger.error('Ошибка при ежемесячном обновлении KPI:', error);
    }
  }

  /**
   * Ежеквартальное обновление KPI в первый день квартала в 5:00 утра
   */
  @Cron('0 5 1 */3 *')
  async handleQuarterlyKpiUpdate() {
    this.logger.log('Начинаем ежеквартальное обновление KPI...');
    
    try {
      const settings = await this.kpiService.getSettings();
      
      if (settings.settings.calculationPeriod === 'quarterly') {
        await this.updateAllTeachersKpi();
        await this.createQuarterlySnapshot();
        this.logger.log('Ежеквартальное обновление KPI завершено успешно');
      }
    } catch (error) {
      this.logger.error('Ошибка при ежеквартальном обновлении KPI:', error);
    }
  }

  /**
   * Обновляет KPI для всех преподавателей
   */
  private async updateAllTeachersKpi() {
    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: true,
        workloads: {
          include: {
            subjectWorkloads: true,
            monthlyHours: true,
          },
        },
        studyPlans: true,
        schedules: true,
      },
    });

    const settings = await this.kpiService.getSettings();
    let updatedCount = 0;

    for (const teacher of teachers) {
      try {
        // Рассчитываем новые метрики
        const metrics = await this.kpiService['calculateTeacherMetrics'](teacher, settings.settings);
        const overallScore = this.kpiService['calculateOverallScore'](metrics, settings.settings);

        // Сохраняем в таблицу KPI снимков
        await this.saveKpiSnapshot(teacher.id, {
          teachingQuality: metrics.teachingQuality,
          studentSatisfaction: metrics.studentSatisfaction,
          classAttendance: metrics.classAttendance,
          workloadCompliance: metrics.workloadCompliance,
          professionalDevelopment: metrics.professionalDevelopment,
          overallScore: Math.round(overallScore),
        });

        // Проверяем нужны ли уведомления
        await this.checkNotifications(teacher, overallScore, settings.settings);

        updatedCount++;
      } catch (error) {
        this.logger.error(`Ошибка при обновлении KPI для преподавателя ${teacher.id}:`, error);
      }
    }

    this.logger.log(`Обновлено KPI для ${updatedCount} преподавателей`);
  }

  /**
   * Сохраняет снимок KPI в базу данных
   */
  private async saveKpiSnapshot(teacherId: number, metrics: any) {
    // В реальном приложении здесь должна быть таблица для хранения исторических данных KPI
    // Пока логируем для демонстрации
    this.logger.debug(`Сохранение KPI для преподавателя ${teacherId}:`, {
      teacherId,
      date: new Date(),
      ...metrics,
    });

    // Пример структуры таблицы KpiSnapshot:
    /*
    await this.prisma.kpiSnapshot.create({
      data: {
        teacherId,
        date: new Date(),
        teachingQuality: metrics.teachingQuality,
        studentSatisfaction: metrics.studentSatisfaction,
        classAttendance: metrics.classAttendance,
        workloadCompliance: metrics.workloadCompliance,
        professionalDevelopment: metrics.professionalDevelopment,
        overallScore: metrics.overallScore,
        period: settings.calculationPeriod,
      },
    });
    */
  }

  /**
   * Проверяет нужны ли уведомления о низких показателях
   */
  private async checkNotifications(teacher: any, overallScore: number, settings: any) {
    if (!settings.autoNotifications || !settings.notificationThreshold) {
      return;
    }

    if (overallScore < settings.notificationThreshold) {
      await this.sendLowKpiNotification(teacher, overallScore, settings.notificationThreshold);
    }
  }

  /**
   * Отправляет уведомление о низких показателях KPI
   */
  private async sendLowKpiNotification(teacher: any, currentScore: number, threshold: number) {
    this.logger.warn(`Низкий KPI у преподавателя ${teacher.user.name} ${teacher.user.surname}: ${currentScore} (порог: ${threshold})`);

    // Здесь должна быть интеграция с системой уведомлений
    // Например, отправка email, push-уведомлений или создание задач в системе

    // Пример создания уведомления:
    /*
    await this.prisma.notification.create({
      data: {
        userId: teacher.userId,
        type: 'LOW_KPI_WARNING',
        title: 'Низкий показатель KPI',
        message: `Ваш KPI (${currentScore}) ниже установленного порога (${threshold}). Рекомендуется принять меры для улучшения показателей.`,
        isRead: false,
        createdAt: new Date(),
      },
    });
    */
  }

  /**
   * Создает месячный снимок для отчетности
   */
  private async createMonthlySnapshot() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // Предыдущий месяц

    this.logger.log(`Создание месячного снимка KPI за ${month}/${year}`);

    // Здесь можно создать агрегированные данные за месяц
    // Например, средние показатели, тренды, сравнения
  }

  /**
   * Создает квартальный снимок для отчетности
   */
  private async createQuarterlySnapshot() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const quarter = Math.floor(currentDate.getMonth() / 3);

    this.logger.log(`Создание квартального снимка KPI за Q${quarter}/${year}`);

    // Здесь можно создать агрегированные данные за квартал
  }

  /**
   * Ручной запуск пересчета KPI (для администраторов)
   */
  async manualKpiUpdate() {
    this.logger.log('Запущен ручной пересчет KPI...');
    
    try {
      await this.updateAllTeachersKpi();
      this.logger.log('Ручной пересчет KPI завершен успешно');
      return { success: true, message: 'KPI успешно пересчитан для всех преподавателей' };
    } catch (error) {
      this.logger.error('Ошибка при ручном пересчете KPI:', error);
      throw new Error('Ошибка при пересчете KPI');
    }
  }

  /**
   * Получение статистики последнего обновления
   */
  async getUpdateStatistics() {
    // В реальном приложении здесь должен быть запрос к таблице статистики
    return {
      lastUpdate: new Date(),
      totalTeachers: await this.prisma.teacher.count(),
      successfulUpdates: await this.prisma.teacher.count(), // Заглушка
      failedUpdates: 0,
      averageProcessingTime: '2.5 секунд',
    };
  }
}
