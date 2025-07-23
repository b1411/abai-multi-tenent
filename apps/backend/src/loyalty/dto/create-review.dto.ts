import { IsInt, IsString, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  teacherId: number;

  @IsInt()
  groupId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
