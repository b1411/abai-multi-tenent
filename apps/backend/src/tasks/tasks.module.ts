import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
    controllers: [TasksController],
    providers: [TasksService, PrismaService, JwtService],
    exports: [TasksService],
})
export class TasksModule { }
