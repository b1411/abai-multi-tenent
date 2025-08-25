export interface ClassroomBooking {
  id: string;
  classroomId: number;
  classroom?: {
    id: number;
    name: string;
    building: string;
    floor: number;
    capacity: number;
  };
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  responsiblePerson: string;
  description?: string;
  contactInfo: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

export interface CreateClassroomBookingDto {
  classroomId: number;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  responsiblePerson: string;
  description?: string;
  contactInfo: string;
}

export interface BookingTimeSlot {
  startTime: string;
  endTime: string;
  date: string;
  classroomId: number;
}
