import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  controllers: [CalendarController],
  providers: [CalendarService, PrismaService, JwtService],
  exports: [CalendarService],
})
export class CalendarModule { }
