import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Module } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

// Import only safe modules (avoid problematic ones)
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { GroupsModule } from '../src/groups/groups.module';
import { ClassroomsModule } from '../src/classrooms/classrooms.module';
import { StudentsModule } from '../src/students/students.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GroupsModule,
    ClassroomsModule,
    StudentsModule,
  ],
})
class MinimalAppModule {}

async function exportSwagger() {
    try {
        console.log('🚀 Запуск экспорта Swagger документации (минимальная версия)...');

        // Создаем приложение без запуска сервера
        const app = await NestFactory.create(MinimalAppModule, { logger: false });

        // Конфигурация Swagger
        const config = new DocumentBuilder()
            .setTitle('Multi-Tenant ABAI API')
            .setDescription('Минимальная версия API документации без проблемных модулей')
            .setVersion('1.0.0')
            .addTag('Auth', 'Аутентификация и авторизация')
            .addTag('Users', 'Управление пользователями')
            .addTag('Groups', 'Управление группами студентов')
            .addTag('Classrooms', 'Управление аудиториями')
            .addTag('Students', 'Управление студентами')
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
            .build();

        // Создаем документ
        const document = SwaggerModule.createDocument(app, config);

        // Определяем пути для сохранения
        const outputDir = path.resolve(process.cwd(), 'docs');
        const jsonPath = path.join(outputDir, 'swagger-minimal.json');
        const yamlPath = path.join(outputDir, 'swagger-minimal.yaml');

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
        console.log('\n🎉 Минимальный экспорт завершен успешно!');

    } catch (error) {
        console.error('❌ Ошибка при экспорте Swagger:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Запускаем экспорт
exportSwagger().catch(error => {
    console.error('❌ Ошибка при запуске экспорта:', error.message);
    process.exit(1);
});
