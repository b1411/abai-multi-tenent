import { Module } from '@nestjs/common';
import { EdoController } from './edo.controller';
import { EdoService } from './edo.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
    controllers: [EdoController, TemplatesController],
    providers: [EdoService, TemplatesService, PrismaService, UsersService, JwtService],
    exports: [EdoService, TemplatesService],
})
export class EdoModule { }
