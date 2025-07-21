import apiClient from './apiClient';
import { 
  Classroom, 
  CreateClassroomDto, 
  UpdateClassroomDto, 
  ClassroomFilter,
  ClassroomStatistics 
} from '../types/classroom';

export class ClassroomService {
  private static readonly baseUrl = '/classrooms';

  // Получить все аудитории
  static async getAllClassrooms(): Promise<Classroom[]> {
    return await apiClient.get<Classroom[]>(this.baseUrl);
  }

  // Получить аудиторию по ID
  static async getClassroomById(id: number): Promise<Classroom> {
    return await apiClient.get<Classroom>(`${this.baseUrl}/${id}`);
  }

  // Создать новую аудиторию
  static async createClassroom(data: CreateClassroomDto): Promise<Classroom> {
    return await apiClient.post<Classroom>(this.baseUrl, data);
  }

  // Обновить аудиторию
  static async updateClassroom(id: number, data: UpdateClassroomDto): Promise<Classroom> {
    return await apiClient.patch<Classroom>(`${this.baseUrl}/${id}`, data);
  }

  // Удалить аудиторию
  static async deleteClassroom(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // Получить аудитории по зданию
  static async getClassroomsByBuilding(building: string): Promise<Classroom[]> {
    return await apiClient.get<Classroom[]>(`${this.baseUrl}/building/${building}`);
  }

  // Получить аудитории по типу
  static async getClassroomsByType(type: string): Promise<Classroom[]> {
    return await apiClient.get<Classroom[]>(`${this.baseUrl}/type/${type}`);
  }

  // Найти аудитории по вместимости
  static async getClassroomsByCapacity(minCapacity: number, maxCapacity?: number): Promise<Classroom[]> {
    const params = new URLSearchParams();
    if (maxCapacity) {
      params.append('maxCapacity', maxCapacity.toString());
    }
    
    return await apiClient.get<Classroom[]>(
      `${this.baseUrl}/capacity/${minCapacity}?${params.toString()}`
    );
  }

  // Найти свободные аудитории
  static async getAvailableClassrooms(
    dayOfWeek: number, 
    startTime: string, 
    endTime: string
  ): Promise<Classroom[]> {
    return await apiClient.get<Classroom[]>(
      `${this.baseUrl}/available/${dayOfWeek}/${startTime}/${endTime}`
    );
  }

  // Найти аудитории по оборудованию
  static async getClassroomsByEquipment(equipment: string[]): Promise<Classroom[]> {
    return await apiClient.post<Classroom[]>(`${this.baseUrl}/by-equipment`, {
      equipment
    });
  }

  // Получить статистику по аудиториям
  static async getClassroomStatistics(): Promise<ClassroomStatistics> {
    return await apiClient.get<ClassroomStatistics>(`${this.baseUrl}/statistics`);
  }

  // Получить все здания
  static async getBuildings(): Promise<string[]> {
    const classrooms = await this.getAllClassrooms();
    const buildings = [...new Set(classrooms.map(c => c.building))];
    return buildings.sort();
  }

  // Получить все типы оборудования
  static async getEquipmentTypes(): Promise<string[]> {
    const classrooms = await this.getAllClassrooms();
    const equipmentSet = new Set<string>();
    classrooms.forEach(classroom => {
      classroom.equipment.forEach(eq => equipmentSet.add(eq));
    });
    return Array.from(equipmentSet).sort();
  }

  // Фильтрация аудиторий
  static filterClassrooms(classrooms: Classroom[], filter: ClassroomFilter): Classroom[] {
    return classrooms.filter(classroom => {
      // Фильтр по зданию
      if (filter.building && classroom.building !== filter.building) {
        return false;
      }

      // Фильтр по типу
      if (filter.type && classroom.type !== filter.type) {
        return false;
      }

      // Фильтр по минимальной вместимости
      if (filter.minCapacity && classroom.capacity < filter.minCapacity) {
        return false;
      }

      // Фильтр по максимальной вместимости
      if (filter.maxCapacity && classroom.capacity > filter.maxCapacity) {
        return false;
      }

      // Фильтр по оборудованию
      if (filter.equipment && filter.equipment.length > 0) {
        const hasAllEquipment = filter.equipment.every(eq => 
          classroom.equipment.includes(eq)
        );
        if (!hasAllEquipment) {
          return false;
        }
      }

      return true;
    });
  }
}

export default ClassroomService;
