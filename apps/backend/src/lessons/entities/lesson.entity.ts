import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({
    name: 'Lesson',
    description: 'Represents a lesson in the system, including its details such as name, date, and associated study plan.'
})
export class Lesson {
    @ApiProperty()
    name: string;

    @ApiProperty()
    id: number;

    @ApiProperty({ nullable: true, type: Date })
    createdAt: Date;

    @ApiProperty({ nullable: true, type: Date })
    updatedAt: Date;

    @ApiProperty({ nullable: true, type: Date })
    deletedAt: Date | null;

    @ApiProperty()
    date: Date;

    @ApiProperty()
    studyPlanId: number;

    @ApiProperty({ nullable: true })
    description: string | null;

    @ApiProperty({ nullable: true })
    homeworkId: number | null;

    @ApiProperty({ nullable: true })
    materialsId: number | null;
}
