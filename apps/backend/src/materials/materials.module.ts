import { Module } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
  controllers: [MaterialsController],
  providers: [MaterialsService, PrismaService, JwtService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
