export type AttendanceSessionParticipant = 'teacher' | 'student';

export interface CreateAttendanceSessionDto {
  scheduleItemId: string;
  occursAt: string;
  participantType?: AttendanceSessionParticipant;
}

export interface AttendanceSession {
  id: string;
  token: string;
  checkInUrl: string;
  expiresAt: string;
  createdAt: string;
  scheduleItemId?: string;
  qrValue?: string;
}

export interface AttendanceCheckInRequest {
  token: string;
  participantType?: AttendanceSessionParticipant;
}

export interface AttendanceCheckInLesson {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  groupName?: string;
  classroomName?: string;
  teacherName: string;
}

export interface AttendanceCheckInSessionInfo {
  id: string;
  occursAt: string;
  expiresAt: string;
  consumedAt: string | null;
}

export interface AttendanceCheckInResponse {
  lesson: AttendanceCheckInLesson;
  session: AttendanceCheckInSessionInfo;
}
