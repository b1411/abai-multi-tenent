import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';

export interface ThrottleOptions {
  ttl: number; // время в секундах
  limit: number; // количество запросов
}

export const Throttle = (ttl: number, limit: number) =>
  SetMetadata(THROTTLE_KEY, { ttl, limit });
