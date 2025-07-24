import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService, JwtService],
})
export class DashboardModule { }
