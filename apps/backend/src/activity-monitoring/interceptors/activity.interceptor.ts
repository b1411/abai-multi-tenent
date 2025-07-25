import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityMonitoringService } from '../activity-monitoring.service';
import { ActivityType } from '../../../generated/prisma';
import { Request } from 'express';

@Injectable()
export class ActivityInterceptor implements NestInterceptor {
  constructor(private activityMonitoringService: ActivityMonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Получаем информацию о пользователе из запроса
    const user = (request as any).user;
    const sessionToken = this.extractSessionToken(request);

    return next.handle().pipe(
      tap(
        (data) => {
          // Успешный запрос
          this.logActivity(request, response, user, sessionToken, startTime, true, data);
        },
        (error) => {
          // Ошибка в запросе
          this.logActivity(request, response, user, sessionToken, startTime, false, null, error);
        },
      ),
    );
  }

  private async logActivity(
    request: Request,
    response: any,
    user: any,
    sessionToken: string | null,
    startTime: number,
    success: boolean,
    responseData?: any,
    error?: any,
  ) {
    try {
      if (!user || !user.id) {
        console.log('ActivityInterceptor: Skipping activity log - no user or user ID');
        return;
      }

      // Дополнительная проверка - является ли user.id числом
      const userId = parseInt(user.id);
      if (isNaN(userId)) {
        console.warn('ActivityInterceptor: Invalid user ID:', user.id);
        return;
      }

      const duration = Date.now() - startTime;
      const method = request.method;
      const url = request.url;
      const statusCode = response.statusCode;

      // Определяем тип активности на основе HTTP метода и URL
      let activityType: ActivityType = ActivityType.API_REQUEST;
      let action = `${method} ${url}`;

      if (method === 'POST') {
        activityType = ActivityType.CREATE;
        action = `create_${this.getEntityFromUrl(url)}`;
      } else if (method === 'PUT' || method === 'PATCH') {
        activityType = ActivityType.UPDATE;
        action = `update_${this.getEntityFromUrl(url)}`;
      } else if (method === 'DELETE') {
        activityType = ActivityType.DELETE;
        action = `delete_${this.getEntityFromUrl(url)}`;
      } else if (method === 'GET') {
        activityType = ActivityType.PAGE_VIEW;
        action = `view_${this.getEntityFromUrl(url)}`;
      }

      // Обновляем активность сессии
      if (sessionToken) {
        await this.activityMonitoringService.updateSessionActivity(sessionToken, url);
      }

      // Логируем активность
      await this.activityMonitoringService.logActivity(userId, sessionToken, {
        type: activityType,
        action,
        description: this.getActionDescription(method, url, success),
        method,
        url,
        route: request.route?.path,
        statusCode,
        requestData: this.sanitizeRequestData(request),
        responseData: this.sanitizeResponseData(responseData),
        duration,
        success,
        errorMessage: error?.message,
        entityType: this.getEntityFromUrl(url),
        entityId: this.getEntityIdFromUrl(url),
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }
  }

  private extractSessionToken(request: Request): string | null {
    const authorization = request.headers.authorization;
    if (authorization && authorization.startsWith('Bearer ')) {
      return authorization.substring(7);
    }
    return null;
  }

  private getEntityFromUrl(url: string): string {
    const segments = url.split('/').filter(Boolean);
    if (segments.length > 0) {
      return segments[0].replace(/\?.*$/, ''); // удаляем query параметры
    }
    return 'unknown';
  }

  private getEntityIdFromUrl(url: string): string | undefined {
    const segments = url.split('/').filter(Boolean);
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      // Проверяем, является ли сегмент числом (ID)
      if (/^\d+$/.test(segment)) {
        return segment;
      }
    }
    return undefined;
  }

  private getActionDescription(method: string, url: string, success: boolean): string {
    const entity = this.getEntityFromUrl(url);
    const status = success ? 'успешно' : 'с ошибкой';
    
    switch (method) {
      case 'POST':
        return `Создание ${entity} ${status}`;
      case 'PUT':
      case 'PATCH':
        return `Обновление ${entity} ${status}`;
      case 'DELETE':
        return `Удаление ${entity} ${status}`;
      case 'GET':
        return `Просмотр ${entity} ${status}`;
      default:
        return `Запрос ${method} к ${entity} ${status}`;
    }
  }

  private sanitizeRequestData(request: Request): any {
    const { body, query, params } = request;
    
    // Удаляем чувствительные данные
    const sanitized = {
      body: this.removeSensitiveFields(body),
      query,
      params,
    };

    return Object.keys(sanitized).some(key => 
      sanitized[key] && Object.keys(sanitized[key]).length > 0
    ) ? sanitized : undefined;
  }

  private sanitizeResponseData(data: any): any {
    if (!data || typeof data !== 'object') return undefined;
    
    // Ограничиваем размер логируемых данных
    const stringified = JSON.stringify(data);
    if (stringified.length > 1000) {
      return { _truncated: true, _size: stringified.length };
    }
    
    return this.removeSensitiveFields(data);
  }

  private removeSensitiveFields(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveFields = [
      'password', 'hashedPassword', 'token', 'secret', 
      'apiKey', 'privateKey', 'creditCard', 'ssn'
    ];
    
    const cleaned = { ...obj };
    
    for (const field of sensitiveFields) {
      if (cleaned[field]) {
        cleaned[field] = '[REDACTED]';
      }
    }
    
    return cleaned;
  }
}
