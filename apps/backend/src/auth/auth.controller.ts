import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ 
    summary: 'Вход в систему',
    description: `
Аутентификация пользователя в системе.

**Доступные роли:**

**Пример использования:**
\`\`\`json
{
  "email": "teacher@abai.edu.kz",
  "password": "securePassword123"
}
\`\`\`
    `
  })
  @ApiBody({
    type: LoginDto,
    description: 'Данные для входа в систему',
    examples: {
      teacher: {
        summary: 'Вход преподавателя',
        description: 'Пример входа для преподавателя',
        value: {
          email: 'teacher@abai.edu.kz',
          password: 'password123'
        }
      },
      admin: {
        summary: 'Вход администратора',
        description: 'Пример входа для администратора',
        value: {
          email: 'admin@abai.edu.kz',
          password: 'admin123'
        }
      },
      student: {
        summary: 'Вход студента',
        description: 'Пример входа для студента',
        value: {
          email: 'student@abai.edu.kz',
          password: 'student123'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Успешная аутентификация',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT токен для авторизации',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVhY2hlckBhYmFpLmVkdS5reiIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.example'
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'teacher@abai.edu.kz' },
            name: { type: 'string', example: 'Иван' },
            surname: { type: 'string', example: 'Петров' },
            middlename: { type: 'string', example: 'Сергеевич' },
            role: { type: 'string', example: 'TEACHER', enum: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST'] },
            phone: { type: 'string', example: '+7 700 123 45 67' },
            avatar: { type: 'string', example: 'https://example.com/avatar.jpg' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Неверные учетные данные',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Некорректные данные запроса',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: ['email must be an email', 'password should not be empty']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return this.authService.login(loginDto, request);
  }
  
  @Post('forgot-password')
  @ApiOperation({ summary: 'Запрос на восстановление пароля' })
  @ApiBody({ schema: { properties: { email: { type: 'string', format: 'email' } } } })
  async forgotPassword(@Body('email') email: string, @Req() req: Request) {
    await this.authService.requestPasswordReset(email, req);
    // Не раскрываем, существует ли email
    return { message: 'Если такой аккаунт существует, мы отправили инструкции на почту.' };
  }
  
  @Post('reset-password')
  @ApiOperation({ summary: 'Сброс пароля по токену' })
  @ApiBody({ schema: { properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } } } })
  async resetPassword(@Body() body: { token: string; password: string }) {
    await this.authService.resetPasswordByToken(body.token, body.password);
    return { message: 'Пароль обновлен. Войдите с новым паролем.' };
  }
}
