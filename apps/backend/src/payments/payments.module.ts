import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, JwtService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
