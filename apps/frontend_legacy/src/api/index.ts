// Экспорт основных модулей API
export { default as apiClient } from './client';
export { default as authService } from './authService';
export { default as studyPlansService } from './studyPlansService';
export { default as lessonsService } from './lessonsService';
export { filesService } from './filesService';
export { materialsService } from './materialsService';
export { quizService } from './quizService';

// Экспорт типов
export type { User, LoginResponse } from './authService';
export type { LoginDto } from './Api';
export type { 
  StudyPlan, 
  StudyPlanFilter, 
  CreateStudyPlanDto, 
  UpdateStudyPlanDto, 
  PaginatedResponse 
} from './studyPlansService';
export type {
  Lesson,
  LessonFilter,
  CreateLessonDto,
  UpdateLessonDto
} from './lessonsService';
export type { FileUploadResponse } from './filesService';
export type { 
  Materials,
  CreateLessonMaterialsDto,
  CreateQuizDto,
  CreateHomeworkDto,
  Quiz,
  Homework,
  Question,
  Answer
} from './materialsService';
export { AnswerType } from './quizService';
export type {
  CreateAnswerDto,
  CreateQuestionDto,
  QuestionResponse,
  AnswerResponse,
  QuizResponse,
  CreateQuizSubmissionDto,
  QuizSubmissionResponse,
  QuizStatistics
} from './quizService';
