export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
  middlename?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'HR' | 'FINANCIST';
  phone?: string;
  avatar?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

export interface PaginateResponseDto<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
