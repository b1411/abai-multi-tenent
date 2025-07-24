import { Injectable } from '@nestjs/common';
import { User, UserRole } from 'generated/prisma';
import { sign, verify, decode } from 'jsonwebtoken';

@Injectable()
export class JwtService {
    sign(payload: Partial<User> & { rememberMe?: boolean }): string {
        return sign(
            {
                id: payload.id,
                email: payload.email,
                name: payload.name,
                role: payload.role || UserRole.STUDENT, // Default to STUDENT if no role is provided
            },
            process.env.JWT_SECRET,
            {
                expiresIn: payload.rememberMe ? '30d' : '1h', // 30 days for rememberMe, 1 hour otherwise
                algorithm: 'HS256',
            }
        );
    }

    verify(token: string): { id: number; email: string; name: string; role: UserRole } {
        try {
            return verify(token, process.env.JWT_SECRET) as {
                id: number;
                email: string;
                name: string;
                role: UserRole;
            };
        } catch {
            throw new Error('Invalid token');
        }
    }

    decode(token: string): { id: number; email: string; name: string; role: UserRole } | null {
        try {
            return decode(token) as {
                id: number;
                email: string;
                name: string;
                role: UserRole;
            };
        } catch {
            return null;
        }
    }
}
