import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { TenantConfigService } from 'src/common/tenant-config.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, JwtService, TenantConfigService],
  exports: [UsersService],
})
export class UsersModule {}
