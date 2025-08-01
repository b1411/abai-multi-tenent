import { Module } from '@nestjs/common';
import { EducationalReportsService } from './educational-reports.service';
import { EducationalReportsController } from './educational-reports.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  controllers: [EducationalReportsController],
  providers: [EducationalReportsService, PrismaService, JwtService],
  exports: [EducationalReportsService],
})
export class EducationalReportsModule { }
