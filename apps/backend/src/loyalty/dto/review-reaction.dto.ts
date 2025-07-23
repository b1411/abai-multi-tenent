import { IsEnum } from 'class-validator';

export enum ReactionType {
  LIKE = 'like',
  HELPFUL = 'helpful',
}

export class ReviewReactionDto {
  @IsEnum(ReactionType)
  type: ReactionType;
}
