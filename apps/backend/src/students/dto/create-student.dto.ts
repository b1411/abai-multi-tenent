import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ 
    description: 'ID пользователя (User), который станет студентом',
    example: 1
  })
  @IsInt()
  userId: number;

  @ApiProperty({ 
    description: 'ID группы, в которую зачисляется студент',
    example: 1
  })
  @IsInt()
  groupId: number;

  @ApiProperty({ 
    description: 'ID класса (если применимо)',
    example: 101,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  classId?: number;
}
