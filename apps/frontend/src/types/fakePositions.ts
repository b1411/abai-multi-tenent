export interface AttendanceRecord {
  id: number;
  teacherId: number;
  teacherName: string;
  date: string;
  lesson: number;
  time: string;
  subject: string;
  room: string;
  qrScanned: boolean;
  faceIdConfirmed: boolean;
  status: 'confirmed' | 'mismatch' | 'absent';
  comment?: string;
  canDispute: boolean;
  disputeSubmitted?: boolean;
  disputeReason?: string;
}

export interface FakePositionsFilters {
  dateFrom?: string;
  dateTo?: string;
  teacherId?: number;
  teacherName?: string;
  subject?: string;
  status?: 'all' | 'confirmed' | 'mismatch' | 'absent';
}

export interface AnalyticsData {
  totalRecords: number;
  confirmed: number;
  mismatch: number;
  absent: number;
  confirmedPercentage: number;
  mismatchPercentage: number;
  absentPercentage: number;
  topViolators: {
    teacherName: string;
    violations: number;
  }[];
  subjectStats: {
    subject: string;
    total: number;
    violations: number;
  }[];
}

export interface DisputeFormData {
  recordId: number;
  reason: 'technical_error' | 'illness' | 'substitution' | 'other';
  description: string;
  attachments?: File[];
}
