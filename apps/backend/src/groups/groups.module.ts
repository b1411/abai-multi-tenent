import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, PrismaService, JwtService],
  exports: [GroupsService],
})
export class GroupsModule {}
