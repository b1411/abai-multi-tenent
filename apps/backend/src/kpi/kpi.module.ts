import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  imports: [],
  controllers: [KpiController],
  providers: [KpiService, PrismaService, JwtService],
  exports: [KpiService],
})
export class KpiModule { }
