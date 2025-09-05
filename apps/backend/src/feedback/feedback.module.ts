import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackService } from './feedback.service';
import { JwtService } from 'src/jwt/jwt.service';
import { KpiModule } from 'src/kpi/kpi.module';
import { EventService } from 'src/common/events/event.service';
import { FeedbackKpiSubscriber } from './subscribers/feedback-kpi.subscriber';
import { EmotionalStateService } from './emotional-state/emotional-state.service';
import { EmotionalStateSubscriber } from './subscribers/emotional-state.subscriber';

@Module({
    imports: [KpiModule],
    controllers: [FeedbackController],
    providers: [FeedbackService, PrismaService, JwtService, EventService, FeedbackKpiSubscriber, EmotionalStateService, EmotionalStateSubscriber],
    exports: [FeedbackService],
})
export class FeedbackModule { }
