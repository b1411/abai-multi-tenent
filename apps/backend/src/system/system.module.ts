import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  imports: [],
  controllers: [SystemController],
  providers: [SystemService, PrismaService, JwtService],
  exports: [SystemService],
})
export class SystemModule { }
