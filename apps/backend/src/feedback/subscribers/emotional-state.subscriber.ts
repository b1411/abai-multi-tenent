import { Injectable, Logger } from '@nestjs/common';
import { EventService, DomainEventType, DomainEvent } from 'src/common/events/event.service';
import { EmotionalStateService } from 'src/feedback/emotional-state/emotional-state.service';

interface FeedbackSubmittedPayloadItem {
  templateId: number;
  responseId: number;
  aboutTeacherId?: number | null;
  answers: Record<string, any>;
  period: string;
  submittedAt: Date | string | null;
}

interface FeedbackSubmittedPayload {
  studentId?: number;
  items: FeedbackSubmittedPayloadItem[];
}

/**
 * Подписчик: обновляет эмоциональное состояние студента по событию FEEDBACK_SUBMITTED.
 */
@Injectable()
export class EmotionalStateSubscriber {
  private readonly logger = new Logger(EmotionalStateSubscriber.name);

  constructor(
    private readonly emotionalStateService: EmotionalStateService,
    eventService: EventService,
  ) {
    eventService.on(DomainEventType.FEEDBACK_SUBMITTED, (e) => this.handle(e));
  }

  private async handle(e: DomainEvent<FeedbackSubmittedPayload>) {
    if (!e.payload?.studentId || !e.payload.items?.length) return;
    try {
      await this.emotionalStateService.recordBatch(e.payload.studentId, e.payload.items);
    } catch (err) {
      this.logger.error(`Emotional state update failed for student ${e.payload.studentId}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
