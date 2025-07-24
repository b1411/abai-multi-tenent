import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, PrismaService, JwtService, NotificationsService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
