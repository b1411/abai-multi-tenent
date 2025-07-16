import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, PrismaService, JwtService],
  exports: [StudentsService],
})
export class StudentsModule {}
