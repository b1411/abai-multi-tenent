import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ImportStudyPlanFileDto {
  @ApiProperty({ description: 'ID преподавателя (Teacher.id или userId преподавателя)', example: 12 })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const n = Number(value);
      return isNaN(n) ? undefined : n;
    }
    return value;
  })
  @IsNumber()
  teacherId: number;

  @ApiProperty({ description: 'Массив ID групп', type: [Number], example: [3, 5] })
  @Transform(({ value }) => {
    // Возможные варианты: уже массив, строка JSON, строка через запятую, одиночное значение
    if (Array.isArray(value)) {
      return value.map(v => Number(v)).filter(v => !isNaN(v));
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(v => Number(v)).filter(v => !isNaN(v));
        }
      } catch {
        // не JSON — продолжаем
      }
      // split по запятой
      return value
        .split(',')
        .map(v => Number(v.trim()))
        .filter(v => !isNaN(v));
    }
    if (value !== undefined && value !== null) {
      const n = Number(value);
      if (!isNaN(n)) return [n];
    }
    return [];
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  groupIds: number[];

  @ApiProperty({ description: 'Название учебного плана (если не указано — возьмем из файла/AI)', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Описание (опционально)', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
