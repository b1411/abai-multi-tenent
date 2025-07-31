import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherSalaryRateDto } from './create-teacher-salary-rate.dto';

export class UpdateTeacherSalaryRateDto extends PartialType(CreateTeacherSalaryRateDto) {}
