import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login-dto';
import { JwtService } from 'src/jwt/jwt.service';
import { compare } from "bcryptjs"
import { access } from 'fs';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private readonly jwt: JwtService) { }

    async login(loginDto: LoginDto) {
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

        return { access_token: token, user };
    }
}
