import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Включаем CORS
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Accept, Authorization",
    credentials: true,
  });

  // Глобальная валидация
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger конфигурация
  const config = new DocumentBuilder()
    .setTitle('Multi-Tenant ABAI API')
    .setDescription(`
# 🎓 Multi-Tenant ABAI - Система управления образовательным процессом

## 📋 Описание
Комплексная система для управления образовательным процессом с поддержкой множественной аренды.

## 🚀 Основные возможности
- 🔐 JWT аутентификация и авторизация
- 👥 Управление пользователями с ролями (ADMIN, TEACHER, STUDENT, PARENT, HR, FINANCIST)
- 🏫 Управление группами и аудиториями
- 📖 Учебные планы и уроки
- 📝 Материалы уроков (лекции, видео, тесты, домашние задания)
- 📅 Расписание с автоматической проверкой конфликтов
- 📊 Электронный журнал с оценками и посещаемостью
- 📈 Статистика и аналитика

## 🔑 Аутентификация
Для доступа к защищенным эндпоинтам используйте JWT токен в заголовке Authorization:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## 👤 Роли пользователей
- **ADMIN** - полный доступ ко всем функциям системы
- **TEACHER** - управление уроками, оценками, просмотр журналов
- **STUDENT** - просмотр своих оценок, материалов и расписания
- **PARENT** - просмотр данных своих детей
- **HR** - управление пользователями и отчетами
- **FINANCIST** - управление платежами и финансовой отчетностью

## 📱 Модули системы
- **Auth** - Аутентификация и авторизация
- **Users** - Управление пользователями
- **Groups** - Управление группами студентов
- **Classrooms** - Управление аудиториями
- **Study Plans** - Учебные планы
- **Lessons** - Уроки
- **Materials** - Материалы уроков
- **Schedule** - Расписание занятий
- **Electronic Journal** - Электронный журнал
    `)
    .setVersion('1.0.0')
    .addTag('Auth', 'Аутентификация и авторизация')
    .addTag('Users', 'Управление пользователями')
    .addTag('Groups', 'Управление группами студентов')
    .addTag('Classrooms', 'Управление аудиториями')
    .addTag('Study Plans', 'Учебные планы')
    .addTag('Lessons', 'Уроки')
    .addTag('Materials', 'Материалы уроков')
    .addTag('Schedule', 'Расписание занятий')
    .addTag('Electronic Journal', 'Электронный журнал с оценками и посещаемостью')
    .addTag('Students', 'Управление студентами')
    .addTag('Teachers', 'Управление преподавателями')
    .addTag('Parents', 'Управление родителями')
    .addTag('Payments', 'Система платежей')
    .addTag('AI Assistant', 'AI ассистент с голосовым интерфейсом')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Введите JWT токен',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:8000', 'Development server')
    .addServer('https://api.abai.edu.kz', 'Production server')
    .setContact(
      'ABAI Support Team',
      'https://abai.edu.kz',
      'support@abai.edu.kz'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Настройка Swagger UI
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Multi-Tenant ABAI API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .topbar-wrapper img { content: url('/logo.png'); width: 120px; height: auto; }
      .swagger-ui .topbar { background-color: #1976d2; }
    `,
  });

  // ✅ ЭКСПОРТ SWAGGER JSON - Несколько способов:

  // 1. Эндпоинт для скачивания JSON
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="swagger.json"');
    res.send(JSON.stringify(document, null, 2));
  });

  // 2. Сохранение JSON файла при запуске (опционально)
  if (process.env.NODE_ENV === 'development') {
    const outputPath = path.resolve(process.cwd(), 'docs', 'swagger.json');

    // Создаем директорию docs если её нет
    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`📄 Swagger JSON exported to: ${outputPath}`);
  }

  await app.listen(process.env.BACKEND_PORT ?? 3000);

  console.log(`🚀 Application is running on: http://localhost:${process.env.BACKEND_PORT ?? 3000}`);
  console.log(`📚 Swagger documentation available at: http://localhost:${process.env.BACKEND_PORT ?? 3000}/api`);
  console.log(`📄 Swagger JSON available at: http://localhost:${process.env.BACKEND_PORT ?? 3000}/api-json`);
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
  process.exit(1);
});
