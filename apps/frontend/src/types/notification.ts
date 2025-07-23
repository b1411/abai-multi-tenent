export interface Notification {
  id: number;
  type: string;
  message: string;
  url?: string;
  read: boolean;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    surname: string;
    role: string;
  };
}

export interface PaginatedNotifications {
  data: Notification[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
