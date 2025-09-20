// Сервис для получения кастомных настроек tenant из .env

import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantConfigService {
  readonly periodType: 'quarter' | 'semester';
  readonly gradeSystem: number;

  constructor() {
    this.periodType =
      (process.env.TENANT_PERIOD_TYPE as 'quarter' | 'semester') || 'quarter';
    this.gradeSystem = Number(process.env.TENANT_GRADE_SYSTEM) || 5;
  }
}
