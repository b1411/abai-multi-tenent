import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { InvoiceGeneratorService } from './invoice-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, InvoiceGeneratorService, PrismaService, NotificationsService, JwtService],
  exports: [PaymentsService, InvoiceGeneratorService],
})
export class PaymentsModule { }
