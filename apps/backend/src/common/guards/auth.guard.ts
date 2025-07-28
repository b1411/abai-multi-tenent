
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
        const url = request.url;
        const method = request.method;
        
        console.log(`🔐 AuthGuard: ${method} ${url}`);
        
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            console.log(`❌ AuthGuard: No token found in request to ${method} ${url}`);
            console.log(`❌ AuthGuard: Authorization header:`, request.headers.authorization);
            throw new UnauthorizedException('No token provided');
        }
        
        console.log(`🔍 AuthGuard: Token found, verifying...`);
        
        try {
            const payload = this.jwtService.verify(token);
            
            console.log(`✅ AuthGuard: Token valid for user:`, {
                id: payload.id,
                email: payload.email,
                role: payload.role
            });
            
            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            request['user'] = payload;
            
            return true;
        } catch (error) {
            console.log(`❌ AuthGuard: Token verification failed for ${method} ${url}:`, error.message);
            throw new UnauthorizedException('Invalid token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
