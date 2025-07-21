import { Module } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
  controllers: [ClassroomsController],
  providers: [ClassroomsService, PrismaService, JwtService],
  exports: [ClassroomsService],
})
export class ClassroomsModule {}
