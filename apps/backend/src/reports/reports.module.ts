import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { SystemModule } from '../system/system.module';

@Module({
    imports: [SystemModule],
    controllers: [ReportsController],
    providers: [ReportsService, PrismaService, JwtService],
    exports: [ReportsService],
})
export class ReportsModule { }
