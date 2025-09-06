import apiClient from './apiClient';

export type AbsentReason = 'SICK' | 'FAMILY' | 'OTHER';

export interface CreateLessonResultDto {
  studentId: number;
  lessonId: number;
  attendance?: boolean;
  absentReason?: AbsentReason;
  absentComment?: string;
  lessonScore?: number | null;
  homeworkScore?: number | null;
}

export interface UpdateLessonResultDto {
  attendance?: boolean;
  absentReason?: AbsentReason;
  absentComment?: string;
  lessonScore?: number | null;
  homeworkScore?: number | null;
}

class LessonResultService {
  async createLessonResult(data: CreateLessonResultDto) {
    return await apiClient.post('/lesson-results', data);
  }

  async updateLessonResult(id: number, data: UpdateLessonResultDto) {
    return await apiClient.patch(`/lesson-results/${id}`, data);
  }

  async bulkSetAttendance(
    lessonId: number,
    attendanceData: Array<{ studentId: number; attendance: boolean; absentReason?: AbsentReason; absentComment?: string }>
  ) {
    return await apiClient.post(`/lesson-results/lesson/${lessonId}/bulk-attendance`, { attendanceData });
  }
}

export const lessonResultService = new LessonResultService();
export default lessonResultService;
