import { Injectable, Logger } from '@nestjs/common';
import { KpiService } from 'src/kpi/kpi.service';
import { EventService, DomainEventType, DomainEvent } from 'src/common/events/event.service';

/**
 * Подписчик: реагирует на событие FEEDBACK_SUBMITTED и пересчитывает KPI преподавателей.
 */
@Injectable()
export class FeedbackKpiSubscriber {
  private readonly logger = new Logger(FeedbackKpiSubscriber.name);

  constructor(
    private readonly kpiService: KpiService,
    eventService: EventService,
  ) {
    eventService.on(DomainEventType.FEEDBACK_SUBMITTED, (e) => this.handle(e));
  }

  private async handle(e: DomainEvent<{ studentId?: number; items: Array<{
    templateId: number;
    responseId: number;
    aboutTeacherId?: number | null;
    answers: any;
    period: string;
    submittedAt: Date | string | null;
  }> }>) {
    if (!e.payload?.items?.length) return;

    for (const item of e.payload.items) {
      if (!item.aboutTeacherId) continue;
      try {
        await this.kpiService.calculatePeriodicKpiScore(item.aboutTeacherId);
      } catch (err) {
        this.logger.error(`KPI recalculation failed for teacher ${item.aboutTeacherId}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
}
