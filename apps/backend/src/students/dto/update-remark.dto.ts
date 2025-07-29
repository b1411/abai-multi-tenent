import { PartialType } from '@nestjs/swagger';
import { CreateRemarkDto } from './create-remark.dto';

export class UpdateRemarkDto extends PartialType(CreateRemarkDto) {}
