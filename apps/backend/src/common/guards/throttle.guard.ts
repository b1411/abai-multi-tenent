import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { THROTTLE_KEY, ThrottleOptions } from '../decorators/throttle.decorator';

@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly cache = new Map<string, { count: number; resetTime: number }>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const throttleOptions = this.reflector.getAllAndOverride<ThrottleOptions>(THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!throttleOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);
    const now = Date.now();

    let record = this.cache.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + throttleOptions.ttl * 1000,
      };
      this.cache.set(key, record);
      return true;
    }

    if (record.count >= throttleOptions.limit) {
      throw new HttpException(
        `Too many requests. Limit: ${throttleOptions.limit} per ${throttleOptions.ttl} seconds`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    return true;
  }

  private generateKey(request: any): string {
    const userId = request.user?.id;
    const ip = request.ip || request.connection.remoteAddress;
    const route = request.route?.path || request.url;
    
    return `${userId || ip}:${route}`;
  }
}
