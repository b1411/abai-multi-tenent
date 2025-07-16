import { PaginateQueryDto } from 'src/common/dtos/paginate.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsPositive, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class LessonFilterDto extends PaginateQueryDto {
    @ApiPropertyOptional({ 
        description: 'Фильтр по учебному плану', 
        type: Number, 
        example: 1 
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    readonly studyPlanId?: number;

    @ApiPropertyOptional({ 
        description: 'Фильтр по дате начала', 
        type: String, 
        example: '2024-01-01' 
    })
    @IsOptional()
    @IsDateString()
    readonly dateFrom?: string;

    @ApiPropertyOptional({ 
        description: 'Фильтр по дате окончания', 
        type: String, 
        example: '2024-12-31' 
    })
    @IsOptional()
    @IsDateString()
    readonly dateTo?: string;
}
