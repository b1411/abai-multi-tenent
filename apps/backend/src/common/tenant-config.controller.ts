import { Controller, Get } from '@nestjs/common';
import { TenantConfigService } from './tenant-config.service';

@Controller('tenant-config')
export class TenantConfigController {
  constructor(private readonly tenantConfig: TenantConfigService) {}

  @Get()
  getConfig() {
    return {
      periodType: this.tenantConfig.periodType,
      gradeSystem: this.tenantConfig.gradeSystem,
    };
  }
}
