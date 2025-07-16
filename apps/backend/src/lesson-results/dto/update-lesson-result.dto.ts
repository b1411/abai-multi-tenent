import { PartialType } from '@nestjs/swagger';
import { CreateLessonResultDto } from './create-lesson-result.dto';

export class UpdateLessonResultDto extends PartialType(CreateLessonResultDto) {}
