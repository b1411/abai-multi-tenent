import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { ActivityMonitoringModule } from '../activity-monitoring/activity-monitoring.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [ActivityMonitoringModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtService],
})
export class AuthModule { }
