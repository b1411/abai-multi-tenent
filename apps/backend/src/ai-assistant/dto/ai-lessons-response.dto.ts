export class GeneratedLessonDto {
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  studyPlanId: number;
  studyPlanName: string;
  groupId: number;
  groupName: string;
  teacherId: number;
  teacherName: string;
  classroomId?: number;
  classroomName?: string;
  description?: string;
  
  // Дополнительные поля для материалов и домашних заданий
  materials?: {
    lecture?: string;
    videoUrl?: string;
    presentationUrl?: string;
    additionalNotes?: string;
  };
  
  homework?: {
    name: string;
    description: string;
    deadline: string; // YYYY-MM-DD
    estimatedHours?: number;
  };
  
  // Метаданные
  lessonNumber?: number; // номер урока в последовательности
  topicNumber?: number; // номер темы в курсе
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export class AILessonsResponseDto {
  generatedLessons: GeneratedLessonDto[];
  summary: {
    totalLessons: number;
    lessonsPerSubject: { [subjectName: string]: number };
    lessonsPerGroup: { [groupName: string]: number };
    startDate: string;
    endDate: string;
    academicYear: string;
    semester: number;
  };
  
  // Анализ и рекомендации
  analysis: {
    overallScore: number; // 0-100
    efficiency: number; // 0-100
    teacherSatisfaction: number; // 0-100
    studentSatisfaction: number; // 0-100
    resourceUtilization: number; // 0-100
  };
  
  recommendations: string[];
  conflicts: string[];
  warnings: string[];
  
  // Метаданные генерации
  generatedAt: string;
  aiModel: string;
  algorithmVersion: string;
}
