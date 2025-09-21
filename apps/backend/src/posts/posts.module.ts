import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';

@Module({
  controllers: [PostsController],
  providers: [PostService, PrismaService, JwtService, AuthGuard, RolesGuard],
  exports: [PostService],
})
export class PostsModule {}
