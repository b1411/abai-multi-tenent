import { IsArray, IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WeeklyHoursDto {
    [studyPlanId: number]: number;
}

export class WorkingHoursDto {
    @IsString()
    start: string; // "08:00"

    @IsString()
    end: string; // "18:00"
}

export class ConstraintsDto {
    @ValidateNested()
    @Type(() => WorkingHoursDto)
    workingHours: WorkingHoursDto;

    @IsNumber()
    @IsOptional()
    maxConsecutiveHours?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    preferredBreaks?: string[];
}

export class GenerateLessonsDto {
    @IsArray()
    @IsNumber({}, { each: true })
    groupIds: number[];

    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    teacherIds?: number[];

    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    subjectIds?: number[];

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsString()
    @IsNotEmpty()
    academicYear: string; // "2024-2025"

    @IsNumber()
    semester: number; // 1 или 2

    @IsNumber()
    @IsOptional()
    lessonDuration?: number; // в минутах, по умолчанию 45

    @ValidateNested()
    @Type(() => WeeklyHoursDto)
    @IsOptional()
    weeklyHoursPerSubject?: { [studyPlanId: number]: number };

    @IsArray()
    @IsDateString({}, { each: true })
    @IsOptional()
    excludeDates?: string[]; // каникулы, праздники

    @IsString()
    @IsOptional()
    additionalInstructions?: string;

    // Ограничения для времени занятий
    @ValidateNested()
    @Type(() => ConstraintsDto)
    @IsOptional()
    constraints?: ConstraintsDto;
}
