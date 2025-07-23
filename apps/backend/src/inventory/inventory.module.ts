import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({

    controllers: [InventoryController],
    providers: [InventoryService, PrismaService, JwtService],
    exports: [InventoryService],
})
export class InventoryModule { }
