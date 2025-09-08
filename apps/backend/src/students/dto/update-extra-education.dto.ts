import { PartialType } from '@nestjs/swagger';
import { CreateExtraEducationDto } from './create-extra-education.dto';

export class UpdateExtraEducationDto extends PartialType(CreateExtraEducationDto) {}
