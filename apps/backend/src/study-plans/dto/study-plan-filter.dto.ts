import { PaginateQueryDto } from 'src/common/dtos/paginate.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class StudyPlanFilterDto extends PaginateQueryDto {
    @ApiPropertyOptional({ 
        description: 'Фильтр по группе', 
        type: Number, 
        example: 1 
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    readonly groupId?: number;

    @ApiPropertyOptional({ 
        description: 'Фильтр по преподавателю', 
        type: Number, 
        example: 1 
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    readonly teacherId?: number;
}
