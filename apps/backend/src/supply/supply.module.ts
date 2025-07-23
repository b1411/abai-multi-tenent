import { Module } from '@nestjs/common';
import { SupplyController } from './supply.controller';
import { SupplyService } from './supply.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
    imports: [],
    controllers: [SupplyController],
    providers: [SupplyService, PrismaService],
    exports: [SupplyService],
})
export class SupplyModule { }
