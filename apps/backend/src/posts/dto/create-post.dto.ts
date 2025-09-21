import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'Текст поста' })
  content: string;

  @ApiProperty({ example: 'ALL', enum: ['ALL', 'ADMIN', 'PARENT'], required: false })
  visibility?: 'ALL' | 'ADMIN' | 'PARENT';

  @ApiProperty({ type: [Number], required: false, description: 'ID файлов поста' })
  fileIds?: number[];

  @ApiProperty({ type: [String], required: false, description: 'URLs изображений поста' })
  images?: string[];

  // images загружаются через Multer, не в DTO
}
