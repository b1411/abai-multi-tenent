import { PartialType } from "@nestjs/swagger";
import { CreateStudyPlanDto } from "./create-study-plan.dto";

export class UpdateStudyPlanDto extends PartialType(CreateStudyPlanDto) {
}