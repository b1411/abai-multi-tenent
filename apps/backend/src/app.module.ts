import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { BudgetModule } from './budget/budget.module';
import { ReportsModule } from './reports/reports.module';
import { WorkloadModule } from './workload/workload.module';
import { SalariesModule } from './salaries/salaries.module';
import { PerformanceModule } from './performance/performance.module';
import { KpiModule } from './kpi/kpi.module';
import { KtpModule } from './ktp/ktp.module';
import { VacationsModule } from './vacations/vacations.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { FeedbackModule } from './feedback/feedback.module';
import { InventoryModule } from './inventory/inventory.module';
import { SupplyModule } from './supply/supply.module';
import { TasksModule } from './tasks/tasks.module';
import { ChatModule } from './chat/chat.module';
import { CalendarModule } from './calendar/calendar.module';
import { SystemModule } from './system/system.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ActivityMonitoringModule } from './activity-monitoring/activity-monitoring.module';
import { EducationalReportsModule } from './educational-reports/educational-reports.module';
import { EdoModule } from './edo/edo.module';
import { MailModule } from './mail/mail.module';
import { AiTutorsModule } from './ai-tutors/ai-tutors.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import * as path from 'node:path';

const envFile = (() => {
  const p = process.env.ENV_FILE; // например "envs/.env.client1" или "/root/app/.env.client1"
  if (!p) return path.resolve(process.cwd(), '.env');
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
})();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: envFile,
      isGlobal: true,
    }),
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
    BudgetModule,
    ReportsModule,
    WorkloadModule,
    SalariesModule,
    PerformanceModule,
    KpiModule,
    KtpModule,
    VacationsModule,
    LoyaltyModule,
    FeedbackModule,
    InventoryModule,
    SupplyModule,
    TasksModule,
    ChatModule,
    CalendarModule,
    SystemModule,
    DashboardModule,
    ActivityMonitoringModule,
    EducationalReportsModule,
    EdoModule,
    NotificationsModule,
    FilesModule,
    LessonResultsModule,
    AiAssistantModule,
    MailModule,
    AiTutorsModule,
    AiChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, JwtService],
})
export class AppModule { }
