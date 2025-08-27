
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from 'src/jwt/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = this.jwtService.verify(
                token
            );
            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            request['user'] = payload;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        // 1. Authorization header
        const authHeader = request.headers.authorization;
        if (authHeader) {
            const [type, token] = authHeader.split(' ');
            if (type === 'Bearer' && token) return token;
        }

        // 2. Query string (для SSE EventSource без кастомных заголовков)
        const qsToken = (request.query['access_token'] || request.query['token']) as string | undefined;
        if (qsToken) return qsToken;

        // 3. Cookie (опционально)
        const cookieAny: any = (request as any).cookies;
        if (cookieAny?.Authorization) {
            const cookieVal: string = cookieAny.Authorization;
            if (cookieVal.startsWith('Bearer ')) {
                return cookieVal.slice(7);
            }
        }

        return undefined;
    }
}
