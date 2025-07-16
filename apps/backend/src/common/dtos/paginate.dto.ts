import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginateQueryDto {
    @ApiProperty({ example: 1, description: 'Page number', type: Number })
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    readonly page: number = 1;

    @ApiProperty({ example: 10, description: 'Number of items per page', type: Number })
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    @Min(1)
    readonly limit: number = 10;

    @ApiPropertyOptional({ example: 'id', description: 'Field to sort by', default: 'id' })
    @IsString()
    @IsOptional()
    readonly sortBy: string = 'id';

    @ApiProperty({ example: 'asc', enum: ['asc', 'desc'], description: 'Sort order' })
    @IsString()
    @IsOptional()
    readonly order: 'asc' | 'desc' = 'asc';

    @ApiPropertyOptional({ example: 'search term', description: 'Search query' })
    @IsString()
    @IsOptional()
    readonly search?: string;
}

export class PaginateMetaDto {
    @ApiProperty({ example: 100, description: 'Total number of items' })
    readonly totalItems: number;

    @ApiProperty({ example: 10, description: 'Number of items on current page' })
    readonly itemCount: number;

    @ApiProperty({ example: 10, description: 'Number of items per page' })
    readonly itemsPerPage: number;

    @ApiProperty({ example: 10, description: 'Total number of pages' })
    readonly totalPages: number;

    @ApiProperty({ example: 1, description: 'Current page number' })
    readonly currentPage: number;
}

export class PaginateResponseDto<T> {
    @ApiProperty({ isArray: true })
    readonly data: T[];

    @ApiProperty({ type: PaginateMetaDto })
    readonly meta: PaginateMetaDto;
}
