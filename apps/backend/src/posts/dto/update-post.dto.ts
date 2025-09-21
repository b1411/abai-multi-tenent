import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
    @ApiProperty({ example: 'Обновленный текст поста' })
    content: string;

    @ApiProperty({ example: 'ALL', enum: ['ALL', 'ADMIN', 'PARENT'] })
    visibility: 'ALL' | 'ADMIN' | 'PARENT';

    @ApiProperty({ type: [String], required: false, description: 'URLs изображений поста' })
    images?: string[];
}
