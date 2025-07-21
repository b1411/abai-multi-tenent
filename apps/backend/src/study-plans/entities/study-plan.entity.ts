import { StudyPlan as StudyPlanPrisma } from "generated/prisma";
import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";

@ApiSchema({
    name: 'StudyPlan',
    description: 'Represents a study plan in the system, including its details such as name, description, and associated teacher.'
})
export class StudyPlan implements StudyPlanPrisma {
    @ApiProperty()
    name: string;

    @ApiProperty()
    id: number;

    @ApiPropertyOptional()
    description: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiPropertyOptional()
    deletedAt: Date | null;

    @ApiProperty()
    teacherId: number;

    @ApiPropertyOptional()
    normativeWorkload: number | null;
}