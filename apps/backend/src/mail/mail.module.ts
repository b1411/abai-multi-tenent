import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { ActivityMonitoringService } from 'src/activity-monitoring/activity-monitoring.service';

@Module({
    imports: [
        MailerModule.forRootAsync({
            useFactory: () => ({
                transport: {
                    host: process.env.SMTP_HOST,
                    port: +process.env.SMTP_PORT,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                    secure: false,
                    tls: {
                        rejectUnauthorized: false, // For self-signed certs
                    }
                },
                defaults: {
                    from: process.env.FROM_EMAIL || '<no-reply@example.com>'
                }
            })
        }),
    ],
    providers: [MailService, AuthService, PrismaService, ActivityMonitoringService, JwtService],
    controllers: [MailController],
    exports: [MailService]
})
export class MailModule { }
