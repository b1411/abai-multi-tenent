import { 
  IsString, 
  IsArray, 
  IsOptional, 
  IsBoolean, 
  IsInt, 
  IsNotEmpty,
  Length,
  Min,
  Max,
  ValidateNested,
  ArrayNotEmpty,
  IsEnum
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole, FeedbackFrequency } from 'generated/prisma';

class QuestionDto {
  @IsString({ message: 'ID вопроса должен быть строкой' })
  @IsNotEmpty({ message: 'ID вопроса не может быть пустым' })
  id: string;

  @IsString({ message: 'Текст вопроса должен быть строкой' })
  @IsNotEmpty({ message: 'Текст вопроса не может быть пустым' })
  @Length(5, 500, { message: 'Текст вопроса должен быть от 5 до 500 символов' })
  question: string;

  @IsEnum(['RATING_1_5', 'RATING_1_10', 'TEXT', 'EMOTIONAL_SCALE', 'YES_NO', 'TEACHER_RATING'], {
    message: 'Неверный тип вопроса'
  })
  type: string;

  @IsString({ message: 'Категория должна быть строкой' })
  @IsNotEmpty({ message: 'Категория не может быть пустой' })
  category: string;

  @IsOptional()
  @IsBoolean({ message: 'required должно быть булевым значением' })
  required?: boolean;

  // Для вопросов типа TEACHER_RATING можно указать ограниченный список преподавателей
  @IsOptional()
  @IsArray({ message: 'teacherIds должен быть массивом идентификаторов преподавателей' })
  teacherIds?: number[];

  // KPI-маркировка вопроса (дополнительно, для упрощённой системы KPI)
  @IsOptional()
  @IsBoolean({ message: 'isKpiRelevant должно быть булевым значением' })
  isKpiRelevant?: boolean;

  @IsOptional()
  @IsString({ message: 'kpiMetric должна быть строкой' })
  kpiMetric?: string;

  @IsOptional()
  @IsInt({ message: 'kpiWeight должен быть числом' })
  kpiWeight?: number;
}

export class CreateFeedbackTemplateDto {
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Название не может быть пустым' })
  @Length(3, 100, { message: 'Название должно быть от 3 до 100 символов' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEnum(UserRole, { message: 'Неверная роль пользователя' })
  role: UserRole;

  @IsString({ message: 'Заголовок должен быть строкой' })
  @IsNotEmpty({ message: 'Заголовок не может быть пустым' })
  @Length(5, 200, { message: 'Заголовок должен быть от 5 до 200 символов' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @Length(0, 1000, { message: 'Описание должно быть не более 1000 символов' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsArray({ message: 'Вопросы должны быть массивом' })
  @ArrayNotEmpty({ message: 'Должен быть хотя бы один вопрос' })
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @IsOptional()
  @IsBoolean({ message: 'isActive должно быть булевым значением' })
  isActive?: boolean;

  @IsEnum(FeedbackFrequency, { message: 'Неверная частота опроса' })
  frequency: FeedbackFrequency;

  @IsOptional()
  @IsInt({ message: 'Приоритет должен быть числом' })
  @Min(0, { message: 'Приоритет не может быть отрицательным' })
  @Max(10, { message: 'Приоритет не может быть больше 10' })
  priority?: number;

  // Агрегированные KPI-флаги на уровне шаблона
  @IsOptional()
  @IsBoolean({ message: 'hasKpiQuestions должно быть булевым значением' })
  hasKpiQuestions?: boolean;

  @IsOptional()
  @IsArray({ message: 'kpiMetrics должен быть массивом' })
  kpiMetrics?: string[];
}
