import apiClient from './apiClient';
import { AttendanceSession, CreateAttendanceSessionDto, AttendanceCheckInRequest, AttendanceCheckInResponse } from '../types/attendance';

class AttendanceSessionService {
  private readonly baseUrl = '/attendance-sessions';

  async createSession(payload: CreateAttendanceSessionDto): Promise<AttendanceSession> {
    return apiClient.post<AttendanceSession>(this.baseUrl, payload);
  }
  async checkIn(payload: AttendanceCheckInRequest): Promise<AttendanceCheckInResponse> {
    return apiClient.post<AttendanceCheckInResponse>(`${this.baseUrl}/check-in`, payload);
  }

}

export default new AttendanceSessionService();
