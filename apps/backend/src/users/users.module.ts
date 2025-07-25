import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, JwtService],
  exports: [UsersService],
})
export class UsersModule {}
