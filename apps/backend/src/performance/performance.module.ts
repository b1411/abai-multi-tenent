import { Module } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  controllers: [PerformanceController],
  providers: [PerformanceService, PrismaService, JwtService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
