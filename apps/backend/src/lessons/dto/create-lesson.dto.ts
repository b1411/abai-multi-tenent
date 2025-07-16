import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsDateString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDto {
    @ApiProperty({ 
        description: 'Название урока',
        example: 'Квадратные уравнения',
        maxLength: 255
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiProperty({ 
        description: 'Дата и время урока', 
        type: String,
        example: '2024-09-01T08:30:00Z'
    })
    @IsDateString()
    date: string;

    @ApiProperty({
        description: 'ID учебного плана',
        example: 1
    })
    @IsNumber()
    @IsPositive()
    studyPlanId: number;

    @ApiPropertyOptional({ 
        description: 'Описание урока', 
        nullable: true,
        example: 'Решение квадратных уравнений различными методами'
    })
    @IsOptional()
    @IsString()
    description?: string | null;

    @ApiPropertyOptional({ 
        description: 'ID домашнего задания', 
        nullable: true,
        example: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    homeworkId?: number | null;

    @ApiPropertyOptional({ 
        description: 'ID материалов урока', 
        nullable: true,
        example: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    materialsId?: number | null;
}
