import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { StudyPlansModule } from './study-plans/study-plans.module';
import { JwtService } from './jwt/jwt.service';
import { AuthModule } from './auth/auth.module';
import { LessonsModule } from './lessons/lessons.module';
import { MaterialsModule } from './materials/materials.module';
import { ParentsModule } from './parents/parents.module';
import { TeachersModule } from './teachers/teachers.module';
import { StudentsModule } from './students/students.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { QuizModule } from './quiz/quiz.module';
import { HomeworkModule } from './homework/homework.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { LessonResultsModule } from './lesson-results/lesson-results.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';

@Module({
  imports: [
    StudyPlansModule, 
    AuthModule, 
    LessonsModule, 
    MaterialsModule, 
    UsersModule, 
    GroupsModule, 
    HomeworkModule, 
    QuizModule, 
    ClassroomsModule, 
    ScheduleModule, 
    StudentsModule, 
    TeachersModule, 
    ParentsModule, 
    PaymentsModule, 
    NotificationsModule, 
    FilesModule, 
    LessonResultsModule,
    AiAssistantModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, JwtService],
})
export class AppModule {}
