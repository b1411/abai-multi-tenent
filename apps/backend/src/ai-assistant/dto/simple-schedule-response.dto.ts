export interface SimpleScheduleLessonDto {
  day: number; // 1..5
  slot: number; // 1..8
  studyPlanId: number;
  groupId: number;
  teacherId: number;
  classroomId?: number | null;
  recurrence: 'weekly';
}

export interface SimpleScheduleResponseDto {
  lessons: SimpleScheduleLessonDto[];
}
