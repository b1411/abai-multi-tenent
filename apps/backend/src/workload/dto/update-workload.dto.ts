import { PartialType } from '@nestjs/swagger';
import { CreateWorkloadDto } from './create-workload.dto';

export class UpdateWorkloadDto extends PartialType(CreateWorkloadDto) {}
