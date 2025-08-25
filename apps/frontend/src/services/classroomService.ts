import apiClient from './apiClient';
import {
  Classroom,
  CreateClassroomDto,
  UpdateClassroomDto,
  ClassroomFilter,
  ClassroomStatistics
} from '../types/classroom';
import { ClassroomBooking, CreateClassroomBookingDto } from '../types/classroomBooking';

export class ClassroomService {
  private static readonly baseUrl = '/classrooms';

  // ---------- Classrooms CRUD & Queries ----------

  static async getAllClassrooms(): Promise<Classroom[]> {
    return await apiClient.get<Classroom[]>(this.baseUrl);
  }

  static async getClassroomById(id: number): Promise<Classroom> {
    return await apiClient.get<Classroom>(`${this.baseUrl}/${id}`);
  }

  static async createClassroom(data: CreateClassroomDto): Promise<Classroom> {
    return await apiClient.post<Classroom>(this.baseUrl, data);
  }

  static async updateClassroom(id: number, data: UpdateClassroomDto): Promise<Classroom> {
    return await apiClient.patch<Classroom>(`${this.baseUrl}/${id}`, data);
  }

  static async deleteClassroom(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  static async getClassroomsByBuilding(building: string): Promise<Classroom[]> {
    return await apiClient.get<Classroom[]>(`${this.baseUrl}/building/${building}`);
  }

  static async getClassroomsByType(type: string): Promise<Classroom[]> {
    return await apiClient.get<Classroom[]>(`${this.baseUrl}/type/${type}`);
  }

  static async getClassroomsByCapacity(minCapacity: number, maxCapacity?: number): Promise<Classroom[]> {
    const params = new URLSearchParams();
    if (maxCapacity) params.append('maxCapacity', maxCapacity.toString());
    return await apiClient.get<Classroom[]>(`${this.baseUrl}/capacity/${minCapacity}?${params.toString()}`);
  }

  static async getAvailableClassrooms(dayOfWeek: number, startTime: string, endTime: string): Promise<Classroom[]> {
    return await apiClient.get<Classroom[]>(`${this.baseUrl}/available/${dayOfWeek}/${startTime}/${endTime}`);
  }

  static async getClassroomsByEquipment(equipment: string[]): Promise<Classroom[]> {
    return await apiClient.post<Classroom[]>(`${this.baseUrl}/by-equipment`, { equipment });
  }

  static async getClassroomStatistics(): Promise<ClassroomStatistics> {
    return await apiClient.get<ClassroomStatistics>(`${this.baseUrl}/statistics`);
  }

  static async getBuildings(): Promise<string[]> {
    const classrooms = await this.getAllClassrooms();
    const buildings = [...new Set(classrooms.map(c => c.building))];
    return buildings.sort();
  }

  static async getEquipmentTypes(): Promise<string[]> {
    const classrooms = await this.getAllClassrooms();
    const equipmentSet = new Set<string>();
    classrooms.forEach(c => c.equipment.forEach(eq => equipmentSet.add(eq)));
    return Array.from(equipmentSet).sort();
  }

  static filterClassrooms(classrooms: Classroom[], filter: ClassroomFilter): Classroom[] {
    return classrooms.filter(classroom => {
      if (filter.building && classroom.building !== filter.building) return false;
      if (filter.type && classroom.type !== filter.type) return false;
      if (filter.minCapacity && classroom.capacity < filter.minCapacity) return false;
      if (filter.maxCapacity && classroom.capacity > filter.maxCapacity) return false;
      if (filter.equipment && filter.equipment.length > 0) {
        if (!filter.equipment.every(eq => classroom.equipment.includes(eq))) return false;
      }
      return true;
    });
  }

  // ---------- Bookings API ----------

  static async createBooking(
    classroomId: number,
    data: Omit<CreateClassroomBookingDto, 'classroomId'>
  ): Promise<ClassroomBooking> {
    return await apiClient.post<ClassroomBooking>(`${this.baseUrl}/${classroomId}/bookings`, {
      classroomId,
      ...data
    });
  }

  static async listBookings(classroomId: number, date?: string): Promise<ClassroomBooking[]> {
    const query = date ? `?date=${date}` : '';
    return await apiClient.get<ClassroomBooking[]>(`${this.baseUrl}/${classroomId}/bookings${query}`);
  }

  static async updateBookingStatus(
    bookingId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  ): Promise<ClassroomBooking> {
    return await apiClient.patch<ClassroomBooking>(`${this.baseUrl}/bookings/${bookingId}/status`, { status });
  }

  // ---------- Documents API ----------

  static async attachDocument(classroomId: number, fileId: number): Promise<{ id: number; fileIds: number[] }> {
    return await apiClient.post<{ id: number; fileIds: number[] }>(
      `${this.baseUrl}/${classroomId}/documents`,
      { fileId }
    );
  }

  static async detachDocument(classroomId: number, fileId: number): Promise<{ id: number; fileIds: number[] }> {
    return await apiClient.delete<{ id: number; fileIds: number[] }>(
      `${this.baseUrl}/${classroomId}/documents/${fileId}`
    );
  }
}

export default ClassroomService;
