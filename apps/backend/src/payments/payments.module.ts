import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, NotificationsService, JwtService],
  exports: [PaymentsService],
})
export class PaymentsModule { }
