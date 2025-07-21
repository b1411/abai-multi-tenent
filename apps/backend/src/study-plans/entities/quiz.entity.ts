import { Quiz as QuizPrisma, Question as QuestionPrisma, $Enums, Answer as AnswerPrisma } from "generated/prisma";
import { ApiProperty } from '@nestjs/swagger';

export class Quiz implements QuizPrisma {
    @ApiProperty()
    name: string;

    @ApiProperty()
    id: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ nullable: true })
    deletedAt: Date | null;

    @ApiProperty({ nullable: true })
    duration: number | null;

    @ApiProperty({ nullable: true })
    maxScore: number | null;

    @ApiProperty({ nullable: true })
    startDate: Date | null;

    @ApiProperty({ nullable: true })
    endDate: Date | null;

    @ApiProperty({ nullable: true })
    isActive: boolean | null;
}

export class Question implements QuestionPrisma {
    @ApiProperty()
    name: string;

    @ApiProperty()
    id: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ nullable: true })
    deletedAt: Date | null;

    @ApiProperty()
    quizId: number;

    @ApiProperty({ enum: $Enums.AnswerType })
    type: $Enums.AnswerType;
}

export class Answer implements AnswerPrisma {
    @ApiProperty()
    name: string;

    @ApiProperty()
    id: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ nullable: true })
    deletedAt: Date | null;

    @ApiProperty()
    questionId: number;

    @ApiProperty()
    isCorrect: boolean;
}