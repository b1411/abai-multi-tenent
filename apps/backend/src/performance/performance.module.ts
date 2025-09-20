import { Module } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { TenantConfigService } from 'src/common/tenant-config.service';

@Module({
  controllers: [PerformanceController],
  providers: [PerformanceService, PrismaService, JwtService, TenantConfigService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
