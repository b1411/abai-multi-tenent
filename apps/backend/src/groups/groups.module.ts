import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';

@Module({
  imports: [],
  controllers: [GroupsController],
  providers: [GroupsService, PrismaService, JwtService],
  exports: [GroupsService],
})
export class GroupsModule { }
