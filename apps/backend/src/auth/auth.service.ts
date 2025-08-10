import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login-dto';
import { JwtService } from 'src/jwt/jwt.service';
import { ActivityMonitoringService } from '../activity-monitoring/activity-monitoring.service';
import { compare } from "bcryptjs"
import { Request } from 'express';
import { randomBytes, createHash } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private readonly jwt: JwtService,
        private activityMonitoringService: ActivityMonitoringService,
        private readonly mailService: MailService,
    ) { }

    async login(loginDto: LoginDto, request?: Request) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await compare(loginDto.password, user.hashedPassword);

        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        const token = this.jwt.sign({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'STUDENT', // Default to 'user' if no role is provided
            rememberMe: loginDto.rememberMe,
        });

        // Создаем сессию для мониторинга активности
        if (request) {
            try {
                const sessionData = this.activityMonitoringService.getSessionDataFromRequest(request);
                await this.activityMonitoringService.createSession(user.id, token, sessionData);
            } catch (error) {
                console.error('Error creating activity session:', error);
                // Не прерываем процесс входа, если не удалось создать сессию
            }
        }

        return { access_token: token, user };
    }

    async logout(token: string) {
        try {
            await this.activityMonitoringService.terminateSession(token);
        } catch (error) {
            console.error('Error terminating session:', error);
        }
    }

    // Forgot password: create token and send email
    async requestPasswordReset(email: string, req?: Request) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        // Do not reveal user existence
        if (!user) return;

        // Generate token and store hash
        const rawToken = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 60 minutes

        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
                ipAddress: req?.ip,
                userAgent: req?.headers['user-agent'] || undefined,
            }
        });

        const frontendUrl = "https://fizmat-academy.abai.live"; // TODO: сделать динамическим
        const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

        // Send email via MailService
        await this.mailService.sendPasswordResetEmail(email, resetUrl);
    }

    // Reset password by token
    async resetPasswordByToken(token: string, newPassword: string) {
        if (!token || !newPassword || newPassword.length < 8) {
            throw new BadRequestException('Некорректные данные');
        }

        const tokenHash = createHash('sha256').update(token).digest('hex');
        const record = await (this.prisma as any).passwordResetToken.findFirst({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: { gt: new Date() },
            }
        });

        if (!record) {
            throw new BadRequestException('Неверный или просроченный токен');
        }

        const { hash } = await import('bcryptjs');
        const hashedPassword = await hash(newPassword, 10);

        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: record.userId }, data: { hashedPassword } }),
            (this.prisma as any).passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
            // Invalidate active sessions
            (this.prisma as any).userSession.updateMany({ where: { userId: record.userId, status: 'ACTIVE' }, data: { status: 'TERMINATED', logoutAt: new Date() } })
        ]);
    }
}
