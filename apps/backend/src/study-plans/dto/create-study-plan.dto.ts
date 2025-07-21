import { StudyPlan } from "generated/prisma";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, MaxLength, IsArray, ArrayMinSize } from 'class-validator';

export class CreateStudyPlanDto implements Partial<StudyPlan> {
    @ApiProperty({ 
        description: 'Название учебного плана',
        example: 'Алгебра - 10 класс',
        maxLength: 255
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ 
        type: String, 
        nullable: true,
        description: 'Описание учебного плана',
        example: 'Углубленное изучение алгебры для 10 класса'
    })
    @IsOptional()
    @IsString()
    description: string | null;

    @ApiProperty({
        description: 'ID преподавателя',
        example: 1
    })
    @IsNumber()
    @IsPositive()
    teacherId: number;

    @ApiPropertyOptional({ 
        type: Number, 
        nullable: true,
        description: 'Нормативная нагрузка в часах',
        example: 102
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    normativeWorkload: number | null;

    @ApiProperty({
        description: 'Массив групп для связи с учебным планом',
        example: [{ id: 1 }, { id: 2 }],
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: {
                    type: 'number',
                    description: 'ID группы'
                }
            }
        }
    })
    @IsArray()
    @ArrayMinSize(1)
    groups: { id: number }[];
}
