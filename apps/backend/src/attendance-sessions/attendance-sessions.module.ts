import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttendanceSessionsService } from './attendance-sessions.service';
import { AttendanceSessionsController } from './attendance-sessions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  imports: [ConfigModule],
  controllers: [AttendanceSessionsController],
  providers: [AttendanceSessionsService, PrismaService, JwtService],
  exports: [AttendanceSessionsService],
})
export class AttendanceSessionsModule { }
