import { Module } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
  controllers: [ParentsController],
  providers: [ParentsService, PrismaService, JwtService],
  exports: [ParentsService],
})
export class ParentsModule {}
