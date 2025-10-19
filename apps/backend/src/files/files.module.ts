import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PublicFilesController } from './public-files.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  imports: [ConfigModule],
  controllers: [FilesController, PublicFilesController],
  providers: [FilesService, PrismaService, JwtService],
  exports: [FilesService],
})
export class FilesModule { }
