import apiClient from './apiClient';

export interface Material {
  id: number;
  name: string;
  type: string;
  content?: string | null;
  fileUrl?: string | null;
  lectureContent?: string | null;
  videoUrl?: string | null;
  presentationUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  quiz?: Quiz | null;
  additionalFiles?: MaterialFile[];
}

export interface Quiz {
  id: number;
  name: string;
  isActive: boolean;
  maxScore?: number;
  duration?: number;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  score: number;
}

export interface MaterialFile {
  id: number;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface CreateMaterialRequest {
  name: string;
  type: string;
  content?: string;
  fileUrl?: string;
  lectureContent?: string;
  videoUrl?: string;
  presentationUrl?: string;
}

export interface UpdateMaterialRequest {
  name?: string;
  type?: string;
  content?: string;
  fileUrl?: string;
  lectureContent?: string;
  videoUrl?: string;
  presentationUrl?: string;
}

export interface CreateLessonMaterialsRequest {
  lecture?: string;
  videoUrl?: string;
  presentationUrl?: string;
  quiz?: {
    name: string;
    duration?: number;
    maxScore?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  };
  homework?: {
    name: string;
    description?: string;
    deadline?: string;
  };
}

export class MaterialService {
  async getMaterials(): Promise<Material[]> {
    return await apiClient.get<Material[]>('/materials');
  }

  async getMaterial(id: number): Promise<Material> {
    return await apiClient.get<Material>(`/materials/${id}`);
  }

  async getMaterialsByLesson(lessonId: number): Promise<Material[]> {
    return await apiClient.get<Material[]>(`/materials/lesson/${lessonId}`);
  }

  async createMaterial(data: CreateMaterialRequest): Promise<Material> {
    return await apiClient.post<Material>('/materials', data);
  }

  async updateMaterial(id: number, data: UpdateMaterialRequest): Promise<Material> {
    return await apiClient.patch<Material>(`/materials/${id}`, data);
  }

  async deleteMaterial(id: number): Promise<void> {
    await apiClient.delete(`/materials/${id}`);
  }

  async createLessonMaterials(lessonId: number, data: CreateLessonMaterialsRequest): Promise<Material> {
    return await apiClient.post<Material>(`/materials/lesson/${lessonId}/create-full-materials`, data);
  }

  async attachToLesson(materialId: number, lessonId: number): Promise<void> {
    await apiClient.post(`/materials/${materialId}/attach-to-lesson/${lessonId}`);
  }
}

export const materialService = new MaterialService();
