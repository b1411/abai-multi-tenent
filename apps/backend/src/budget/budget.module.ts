import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService, PrismaService, JwtService],
  exports: [BudgetService],
})
export class BudgetModule { }
