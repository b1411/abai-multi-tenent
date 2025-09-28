import { Module } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { ChatService } from '../chat/chat.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Module({
  controllers: [ParentsController],
  providers: [ParentsService, PrismaService, JwtService, ChatService, NotificationsService],
  exports: [ParentsService],
})
export class ParentsModule { }
