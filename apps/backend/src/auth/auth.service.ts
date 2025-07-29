import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login-dto';
import { JwtService } from 'src/jwt/jwt.service';
import { ActivityMonitoringService } from '../activity-monitoring/activity-monitoring.service';
import { compare } from "bcryptjs"
import { Request } from 'express';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService, 
        private readonly jwt: JwtService,
        private activityMonitoringService: ActivityMonitoringService
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
}
