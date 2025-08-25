import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class ModifyClassroomDocumentDto {
  @ApiProperty({ description: 'ID файла', example: 123 })
  @IsInt()
  fileId: number;
}
