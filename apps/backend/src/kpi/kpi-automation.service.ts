import { Injectable, Logger } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiAutomationService {
    private readonly logger = new Logger(KpiAutomationService.name);
    private intervalId: NodeJS.Timeout | null = null;

    constructor(
        private readonly kpiService: KpiService,
        private readonly prisma: PrismaService,
    ) {
        // Запускаем проверку расписания каждый час
        this.startScheduleChecker();
    }

    /**
     * Запускает проверку расписания
     */
    private startScheduleChecker() {
        // Проверяем каждый час, нужно ли запускать обновление KPI
        this.intervalId = setInterval(() => {
            this.checkAndRunScheduledUpdates().catch(error => {
                this.logger.error('Error in scheduled KPI update:', error);
            });
        }, 60 * 60 * 1000); // 1 час

        this.logger.log('KPI автоматическое обновление запущено (проверка каждый час)');
    }

    /**
     * Останавливает автоматические обновления
     */
    stopAutomation() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.logger.log('KPI автоматическое обновление остановлено');
        }
    }

    /**
     * Проверяет и запускает запланированные обновления
     */
    private async checkAndRunScheduledUpdates() {
        try {
            const settings = await this.kpiService.getSettings();
            const now = new Date();

            // Проверяем, нужно ли обновлять KPI
            if (this.shouldRunUpdate(settings.settings.calculationPeriod, now)) {
                this.logger.log(`Запуск запланированного обновления KPI (период: ${settings.settings.calculationPeriod})`);
                await this.runAutomaticKpiUpdate();
            }
        } catch (error) {
            this.logger.error('Ошибка при проверке запланированных обновлений:', error);
        }
    }

    /**
     * Определяет, нужно ли запускать обновление
     */
    private shouldRunUpdate(period: string, now: Date): boolean {
        const hour = now.getHours();
        const dayOfWeek = now.getDay(); // 0 = воскресенье, 1 = понедельник
        const dayOfMonth = now.getDate();

        switch (period) {
            case 'daily':
                // Запускаем в 2:00 каждый день
                return hour === 2;

            case 'weekly':
                // Запускаем в понедельник в 3:00
                return dayOfWeek === 1 && hour === 3;

            case 'monthly':
                // Запускаем 1 числа каждого месяца в 4:00
                return dayOfMonth === 1 && hour === 4;

            case 'quarterly':
                // Запускаем в первый день квартала в 5:00
                {
                    const month = now.getMonth() + 1; // 1-12
                    const isFirstDayOfQuarter = dayOfMonth === 1 && (month === 1 || month === 4 || month === 7 || month === 10);
                    return isFirstDayOfQuarter && hour === 5;
                }

            default:
                return false;
        }
    }

    /**
     * Выполняет автоматическое обновление KPI
     */
    private async runAutomaticKpiUpdate() {
        try {
            const startTime = Date.now();

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
            let successCount = 0;
            let errorCount = 0;

            // Пересчитываем KPI для каждого преподавателя
            for (const teacher of teachers) {
                try {
                    const metrics = await this.kpiService['calculateTeacherMetrics'](teacher, settings.settings);
                    const overallScore = this.kpiService['calculateOverallScore'](metrics, settings.settings);

                    // Сохраняем результаты (в реальном приложении - в таблицу KpiSnapshot)
                    await this.saveKpiSnapshot(teacher.id, {
                        teachingQuality: metrics.teachingQuality,
                        studentSatisfaction: metrics.studentSatisfaction,
                        classAttendance: metrics.classAttendance,
                        workloadCompliance: metrics.workloadCompliance,
                        professionalDevelopment: metrics.professionalDevelopment,
                        overallScore: Math.round(overallScore),
                    });

                    // Проверяем нужны ли уведомления
                    if (settings.settings.autoNotifications &&
                        settings.settings.notificationThreshold &&
                        overallScore < settings.settings.notificationThreshold) {
                        this.sendLowKpiNotification(teacher, overallScore, settings.settings.notificationThreshold);
                    }

                    successCount++;
                } catch (error) {
                    errorCount++;
                    this.logger.error(`Ошибка при обновлении KPI для преподавателя ${teacher.id}:`, error);
                }
            }

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            this.logger.log(`Автоматическое обновление KPI завершено: успешно ${successCount}, ошибок ${errorCount}, время ${processingTime}ms`);

            // Сохраняем статистику обновления
            await this.saveUpdateStatistics({
                totalTeachers: teachers.length,
                successfulUpdates: successCount,
                failedUpdates: errorCount,
                processingTime,
                updateType: 'automatic',
            });

        } catch (error) {
            this.logger.error('Критическая ошибка при автоматическом обновлении KPI:', error);
        }
    }

    /**
     * Сохраняет снимок KPI
     */
    private async saveKpiSnapshot(teacherId: number, metrics: any) {
        // В реальном приложении здесь должно быть сохранение в таблицу KpiSnapshot
        this.logger.debug(`Сохранение KPI для преподавателя ${teacherId}: общий балл ${metrics.overallScore}`);

        // Пример структуры для будущего внедрения:
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
            calculatedAt: new Date(),
          },
        });
        */
    }

    /**
     * Отправляет уведомление о низких показателях
     */
    private sendLowKpiNotification(teacher: any, currentScore: number, threshold: number) {
        this.logger.warn(
            `Низкий KPI у преподавателя ${teacher.user.name} ${teacher.user.surname}: ${currentScore} (порог: ${threshold})`
        );

        // В реальном приложении здесь должна быть интеграция с системой уведомлений
        // Например:
        /*
        await this.notificationService.send({
          userId: teacher.userId,
          type: 'LOW_KPI_WARNING',
          title: 'Требуется улучшение показателей KPI',
          message: `Ваш текущий KPI (${currentScore}) ниже установленного порога (${threshold}).`,
          data: {
            currentScore,
            threshold,
            teacherId: teacher.id,
          },
        });
        */
    }

    /**
     * Сохраняет статистику обновления
     */
    private async saveUpdateStatistics(stats: any) {
        // В реальном приложении здесь должно быть сохранение в таблицу статистики
        this.logger.log('Статистика обновления KPI:', stats);

        // Пример структуры для будущего внедрения:
        /*
        await this.prisma.kpiUpdateStatistics.create({
          data: {
            updateDate: new Date(),
            totalTeachers: stats.totalTeachers,
            successfulUpdates: stats.successfulUpdates,
            failedUpdates: stats.failedUpdates,
            processingTimeMs: stats.processingTime,
            updateType: stats.updateType,
            triggeredBy: 'system',
          },
        });
        */
    }

    /**
     * Ручной запуск обновления KPI
     */
    async manualUpdate(triggeredBy: string = 'admin') {
        this.logger.log(`Запуск ручного обновления KPI пользователем: ${triggeredBy}`);

        try {
            const result = await this.kpiService.manualKpiRecalculation();

            // Сохраняем статистику ручного обновления
            await this.saveUpdateStatistics({
                ...result.statistics,
                updateType: 'manual',
                triggeredBy,
            });

            return result;
        } catch (error) {
            this.logger.error('Ошибка при ручном обновлении KPI:', error);
            throw error;
        }
    }

    /**
     * Получает статистику автоматических обновлений
     */
    async getAutomationStatus() {
        const settings = await this.kpiService.getSettings();

        return {
            isActive: this.intervalId !== null,
            calculationPeriod: settings.settings.calculationPeriod,
            autoNotifications: settings.settings.autoNotifications,
            notificationThreshold: settings.settings.notificationThreshold,
            nextScheduledUpdate: this.getNextUpdateTime(settings.settings.calculationPeriod),
            lastAutomaticUpdate: new Date(), // В реальности - из таблицы статистики
            totalAutomaticUpdates: 0, // В реальности - из таблицы статистики
        };
    }

    /**
     * Вычисляет время следующего обновления
     */
    private getNextUpdateTime(period: string): Date {
        const now = new Date();
        const next = new Date(now);

        switch (period) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                next.setHours(2, 0, 0, 0);
                break;
            case 'weekly': {
                const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
                next.setDate(next.getDate() + daysUntilMonday);
                next.setHours(3, 0, 0, 0);
                break;
            }
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                next.setDate(1);
                next.setHours(4, 0, 0, 0);
                break;
            case 'quarterly': {
                const currentQuarter = Math.floor(next.getMonth() / 3);
                const nextQuarterMonth = (currentQuarter + 1) * 3;
                if (nextQuarterMonth >= 12) {
                    next.setFullYear(next.getFullYear() + 1);
                    next.setMonth(0);
                } else {
                    next.setMonth(nextQuarterMonth);
                }
                next.setDate(1);
                next.setHours(5, 0, 0, 0);
                break;
            }
            default:
                // Если период неизвестен, ставим на завтра
                next.setDate(next.getDate() + 1);
                next.setHours(2, 0, 0, 0);
        }

        return next;
    }

    /**
     * Очистка при завершении приложения
     */
    onModuleDestroy() {
        this.stopAutomation();
    }
}
