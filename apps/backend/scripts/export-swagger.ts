import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import path from 'path';
import fs from 'fs';
import { AppModule } from '../src/app.module'; // Импортируем основной модуль приложения
import yaml from 'js-yaml'; // Импортируем js-yaml для работы с YAML

async function exportSwagger() {
    try {
        console.log('🚀 Запуск экспорта Swagger документации...');

        // Импортируем AppModule (ES modules)

        // Создаем приложение без запуска сервера
        const app = await NestFactory.create(AppModule, { logger: false });

        // Конфигурация Swagger (идентичная main.ts)
        const config = new DocumentBuilder()
            .setTitle('Multi-Tenant ABAI API')
            .setDescription(`
# 🎓 Multi-Tenant ABAI - Система управления образовательным процессом

## 📋 Описание
Комплексная система для управления образовательным процессом с поддержкой множественной аренды.

## 🚀 Основные возможности
- 🔐 JWT аутентификация и авторизация
- 👥 Управление пользователями с ролями (ADMIN, TEACHER, STUDENT, PARENT, HR)
- 🏫 Управление группами и аудиториями
- 📖 Учебные планы и уроки
- 📝 Материалы уроков (лекции, видео, тесты, домашние задания)
- 📅 Расписание с автоматической проверкой конфликтов
- 📊 Электронный журнал с оценками и посещаемостью
- 💰 Система платежей с интеграцией родителей
- 🤖 AI ассистент с голосовым интерфейсом
- 📈 Статистика и аналитика

## 🔑 Аутентификация
Для доступа к защищенным эндпоинтам используйте JWT токен в заголовке Authorization:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## 👤 Роли пользователей
- **ADMIN** - полный доступ ко всем функциям системы
- **HR** - управление пользователями и отчетами
- **TEACHER** - управление уроками, оценками, просмотр журналов
- **STUDENT** - просмотр своих оценок, материалов и расписания
- **PARENT** - просмотр данных своих детей, оплата обучения

## 📱 Модули системы
- **Auth** - Аутентификация и авторизация
- **Users** - Управление пользователями
- **Groups** - Управление группами студентов
- **Classrooms** - Управление аудиториями
- **Study Plans** - Учебные планы
- **Schedule** - Расписание занятий
- **Lessons** - Уроки
- **Materials** - Материалы уроков
- **Lesson Results** - Электронный журнал
- **Students** - Управление студентами
- **Teachers** - Управление преподавателями
- **Parents** - Управление родителями
- **Payments** - Система платежей
- **AI Assistant** - AI ассистент с голосовым интерфейсом
      `)
            .setVersion('1.0.0')
            .addTag('Auth', 'Аутентификация и авторизация')
            .addTag('Users', 'Управление пользователями')
            .addTag('Groups', 'Управление группами студентов')
            .addTag('Classrooms', 'Управление аудиториями')
            .addTag('Study Plans', 'Учебные планы')
            .addTag('Schedule', 'Расписание занятий')
            .addTag('Lessons', 'Уроки')
            .addTag('Materials', 'Материалы уроков')
            .addTag('Lesson Results', 'Электронный журнал с оценками и посещаемостью')
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
            .addServer('http://localhost:3000', 'Development server')
            .addServer('https://api.abai.edu.kz', 'Production server')
            .setContact(
                'ABAI Support Team',
                'https://abai.edu.kz',
                'support@abai.edu.kz'
            )
            .setLicense('MIT', 'https://opensource.org/licenses/MIT')
            .build();

        // Создаем документ
        const document = SwaggerModule.createDocument(app, config);

        // Определяем пути для сохранения
        const outputDir = path.resolve(process.cwd(), 'docs');
        const jsonPath = path.join(outputDir, 'swagger.json');
        const yamlPath = path.join(outputDir, 'swagger.yaml');

        // Создаем директорию если её нет
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`📁 Создана директория: ${outputDir}`);
        }

        // Сохраняем JSON
        fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2));
        console.log(`✅ Swagger JSON сохранен: ${jsonPath}`);

        // Дополнительно можно сохранить в YAML формате
        fs.writeFileSync(yamlPath, yaml.dump(document));
        console.log(`✅ Swagger YAML сохранен: ${yamlPath}`);

        // Показываем статистику
        const stats = {
            paths: Object.keys(document.paths || {}).length,
            tags: (document.tags || []).length,
            components: Object.keys(document.components?.schemas || {}).length,
            fileSize: `${Math.round(fs.statSync(jsonPath).size / 1024)}KB`
        };

        console.log('\n📊 Статистика экспорта:');
        console.log(`   🔗 API эндпоинтов: ${stats.paths}`);
        console.log(`   🏷️  Тегов: ${stats.tags}`);
        console.log(`   📋 Схем данных: ${stats.components}`);
        console.log(`   📄 Размер файла: ${stats.fileSize}`);

        await app.close();
        console.log('\n🎉 Экспорт завершен успешно!');

    } catch (error) {
        console.error('❌ Ошибка при экспорте Swagger:', error.message);
        process.exit(1);
    }
}

// Запускаем экспорт
exportSwagger().catch(error => {
    console.error('❌ Ошибка при запуске экспорта:', error.message);
    process.exit(1);
});
