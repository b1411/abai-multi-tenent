import { Injectable } from '@nestjs/common';
import { User } from 'generated/prisma';
import { sign, verify, decode } from 'jsonwebtoken';

@Injectable()
export class JwtService {
    sign(payload: Partial<User> & { rememberMe?: boolean }): string {
        return sign(
            {
                id: payload.id,
                email: payload.email,
                name: payload.name,
                role: payload.role || 'user', // Default to 'user' if no role is provided
            },
            process.env.JWT_SECRET,
            {
                expiresIn: payload.rememberMe ? '30d' : '1h', // 30 days for rememberMe, 1 hour otherwise
                algorithm: 'HS256',
            }
        );
    }

    verify(token: string): { id: string; email: string; name: string; role: string } {
        try {
            return verify(token, process.env.JWT_SECRET) as {
                id: string;
                email: string;
                name: string;
                role: string;
            };
        } catch {
            throw new Error('Invalid token');
        }
    }

    decode(token: string): { id: string; email: string; name: string; role: string } | null {
        try {
            return decode(token) as {
                id: string;
                email: string;
                name: string;
                role: string;
            };
        } catch {
            return null;
        }
    }
}
