import apiClient from './apiClient';

export interface Document {
  id: string;
  title: string;
  number?: string;
  type: string;
  status: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  createdById: number;
  responsibleId?: number;
  studentId?: number;
  templateId?: string;
  createdBy: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
  responsible?: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
  student?: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
      email: string;
    };
    group: {
      id: number;
      name: string;
    };
  };
  approvals: DocumentApproval[];
  comments: DocumentComment[];
  files: DocumentFile[];
  _count: {
    comments: number;
    files: number;
    approvals: number;
  };
}

export interface DocumentApproval {
  id: number;
  documentId: string;
  approverId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  createdAt: string;
  updatedAt: string;
  approver: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
}

export interface DocumentComment {
  id: number;
  documentId: string;
  authorId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    surname: string;
    email?: string;
  };
}

export interface DocumentFile {
  id: number;
  documentId: string;
  fileId: number;
  file: {
    id: number;
    name: string;
    originalName: string;
    url: string;
    type: string;
    size: number;
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  variables?: any;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentDto {
  title: string;
  type: string;
  content: string;
  responsibleId?: number;
  studentId?: number;
  deadline?: string;
  approverIds?: number[];
  fileIds?: number[];
}

export interface UpdateDocumentDto {
  title?: string;
  content?: string;
  responsibleId?: string;
  studentId?: string;
  deadline?: string;
}

export interface ApproveDocumentDto {
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
}

export interface AddCommentDto {
  content: string;
}

export interface DocumentFilterDto {
  search?: string;
  status?: string;
  type?: string;
  createdById?: number;
  responsibleId?: number;
  studentId?: number;
  page?: number;
  limit?: number;
}

export interface CreateTemplateDto {
  name: string;
  type: string;
  content: string;
  variables?: any;
}

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  middlename?: string;
  phone?: string;
  avatar?: string;
}

export interface Student {
  id: number;
  user: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
  group: {
    id: number;
    name: string;
  };
}

class EdoService {
  // Документы
  async getDocuments(filters?: DocumentFilterDto): Promise<{
    data: Document[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    return await apiClient.get(`/edo?${params.toString()}`);
  }

  async getDocument(id: string): Promise<Document> {
    return await apiClient.get(`/edo/${id}`);
  }

  async createDocument(data: CreateDocumentDto): Promise<Document> {
    return await apiClient.post('/edo', data);
  }

  async updateDocument(id: string, data: UpdateDocumentDto): Promise<Document> {
    return await apiClient.patch(`/edo/${id}`, data);
  }

  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/edo/${id}`);
  }

  async sendForApproval(id: string, approverIds: number[]): Promise<Document> {
    return await apiClient.patch(`/edo/${id}`, {
      approverIds
    });
  }

  // Согласование
  async approveDocument(id: string, data: ApproveDocumentDto): Promise<DocumentApproval> {
    return await apiClient.post(`/edo/${id}/approve`, data);
  }

  async rejectDocument(id: string, comment?: string): Promise<DocumentApproval> {
    return await apiClient.post(`/edo/${id}/reject`, { comment });
  }

  async getApprovals(id: string): Promise<DocumentApproval[]> {
    return await apiClient.get(`/edo/${id}/approvals`);
  }

  // Комментарии
  async addComment(id: string, data: AddCommentDto): Promise<DocumentComment> {
    return await apiClient.post(`/edo/${id}/comments`, data);
  }

  async getComments(id: string): Promise<DocumentComment[]> {
    return await apiClient.get(`/edo/${id}/comments`);
  }

  // Шаблоны
  async getTemplates(): Promise<DocumentTemplate[]> {
    return await apiClient.get('/edo/templates');
  }

  async getTemplate(id: string): Promise<DocumentTemplate> {
    return await apiClient.get(`/edo/templates/${id}`);
  }

  async createTemplate(data: CreateTemplateDto): Promise<DocumentTemplate> {
    return await apiClient.post('/edo/templates', data);
  }

  async updateTemplate(id: string, data: Partial<CreateTemplateDto>): Promise<DocumentTemplate> {
    return await apiClient.patch(`/edo/templates/${id}`, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/edo/templates/${id}`);
  }

  async initDefaultTemplates(): Promise<DocumentTemplate[]> {
    return await apiClient.post('/edo/templates/init-defaults');
  }

  // Пользователи для согласования
  async getApprovers(): Promise<User[]> {
    return await apiClient.get('/edo/users/approvers');
  }

  // Студенты
  async getStudents(): Promise<Student[]> {
    return await apiClient.get('/students');
  }

  // Утилитные методы
  getStatusText(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Черновик';
      case 'IN_PROGRESS':
        return 'На согласовании';
      case 'APPROVED':
        return 'Согласован';
      case 'REJECTED':
        return 'Отклонен';
      case 'COMPLETED':
        return 'Завершен';
      default:
        return status;
    }
  }

  getTypeText(type: string): string {
    switch (type) {
      case 'STUDENT_CERTIFICATE':
        return 'Справка об обучении';
      case 'ADMINISTRATIVE_ORDER':
        return 'Административный приказ';
      case 'FINANCIAL_CONTRACT':
        return 'Финансовый договор';
      case 'ENROLLMENT_ORDER':
        return 'Приказ о зачислении';
      case 'ACADEMIC_TRANSCRIPT':
        return 'Академическая справка';
      default:
        return type;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ru-RU');
  }
}

export const edoService = new EdoService();
