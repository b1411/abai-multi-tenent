import { Module } from '@nestjs/common';
import { StudyPlansService } from './study-plans.service';
import { StudyPlansController } from './study-plans.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { RbacService } from 'src/rbac/rbac.service';

@Module({
  controllers: [StudyPlansController],
  providers: [StudyPlansService, PrismaService, JwtService, RbacService],
})
export class StudyPlansModule { }
