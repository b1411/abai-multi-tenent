import { Injectable, Logger } from '@nestjs/common';

export enum DomainEventType {
  FEEDBACK_SUBMITTED = 'feedback_submitted',
}

export interface DomainEvent<T = any> {
  type: DomainEventType;
  payload: T;
  occurredAt: Date;
  meta?: Record<string, any>;
}

type Handler = (event: DomainEvent) => Promise<void> | void;

/**
 * Простейшая синхронная шина доменных событий (in-memory).
 * Можно позже заменить на очередь (BullMQ / Redis), не меняя интерфейс подписчиков.
 */
@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private handlers: Map<DomainEventType, Handler[]> = new Map();

  on(type: DomainEventType, handler: Handler) {
    const list = this.handlers.get(type) || [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  emit<T>(type: DomainEventType, payload: T, meta?: Record<string, any>) {
    const event: DomainEvent<T> = {
      type,
      payload,
      occurredAt: new Date(),
      meta,
    };
    const list = this.handlers.get(type);
    if (!list || list.length === 0) return;
    for (const h of list) {
      try {
        const res = h(event);
        if (res instanceof Promise) {
          res.catch(err => this.logger.error(`Handler error for ${type}: ${err?.message || err}`));
        }
      } catch (err) {
        this.logger.error(`Handler throw for ${type}: ${err?.message || err}`);
      }
    }
  }
}
