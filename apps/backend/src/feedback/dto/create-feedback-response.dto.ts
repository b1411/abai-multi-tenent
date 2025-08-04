import { 
  IsInt, 
  IsObject, 
  IsOptional, 
  IsBoolean, 
  IsString, 
  IsNotEmpty,
  Min
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFeedbackResponseDto {
  @IsInt({ message: 'ID шаблона должен быть числом' })
  @Min(1, { message: 'ID шаблона должен быть больше 0' })
  templateId: number;

  @IsObject({ message: 'Ответы должны быть объектом' })
  @IsNotEmpty({ message: 'Ответы не могут быть пустыми' })
  @Transform(({ value }) => {
    // Санитизация текстовых ответов
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'string') {
          // Базовая санитизация: удаляем HTML теги и лишние пробелы
          sanitized[key] = String(val)
            .replace(/<[^>]*>/g, '') // удаляем HTML теги
            .trim()
            .substring(0, 5000); // ограничиваем длину
        } else {
          sanitized[key] = val;
        }
      }
      return sanitized;
    }
    return value;
  })
  answers: Record<string, any>; // JSON объект с ответами

  @IsOptional()
  @IsBoolean({ message: 'isCompleted должно быть булевым значением' })
  isCompleted?: boolean;

  @IsOptional()
  @IsString({ message: 'Период должен быть строкой' })
  @Transform(({ value }) => value?.trim())
  period?: string;

  @IsOptional()
  @IsInt({ message: 'ID преподавателя должен быть числом' })
  @Min(1, { message: 'ID преподавателя должен быть больше 0' })
  aboutTeacherId?: number;
}
