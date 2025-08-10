import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PublicFilesController } from './public-files.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  controllers: [FilesController, PublicFilesController],
  providers: [FilesService, PrismaService, JwtService],
  exports: [FilesService],
})
export class FilesModule { }
