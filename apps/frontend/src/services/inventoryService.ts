import apiClient from './apiClient';

export enum InventoryStatus {
  ACTIVE = 'ACTIVE',
  REPAIR = 'REPAIR',
  WRITTEN_OFF = 'WRITTEN_OFF',
  LOST = 'LOST'
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  location: string;
  status: InventoryStatus;
  purchaseDate: string;
  lastInventory: string;
  cost: number;
  currentValue: number;
  responsible: string;
  qrCode?: string;
  barcode?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  photos?: string[];
  warranty?: {
    start: string;
    end: string;
    provider: string;
  };
  maintenanceSchedule?: {
    lastMaintenance: string;
    nextMaintenance: string;
    provider: string;
  };
  movements?: InventoryMovement[];
  maintenanceRecords?: InventoryMaintenance[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: number;
  fromLocation: string;
  toLocation: string;
  responsible: string;
  reason: string;
  date: string;
}

export interface InventoryMaintenance {
  id: number;
  date: string;
  provider: string;
  description: string;
  nextMaintenanceDate?: string;
  cost?: number;
}

export interface InventoryFilters {
  search?: string;
  category?: string;
  status?: InventoryStatus;
  location?: string;
  responsible?: string;
}

export interface CreateInventoryItem {
  name: string;
  category: string;
  location: string;
  status?: InventoryStatus;
  purchaseDate: string;
  lastInventory?: string;
  cost: number;
  currentValue: number;
  responsible: string;
  qrCode?: string;
  barcode?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  photos?: string[];
  warranty?: {
    start: string;
    end: string;
    provider: string;
  };
  maintenanceSchedule?: {
    lastMaintenance: string;
    nextMaintenance: string;
    provider: string;
  };
}

export interface CreateMovement {
  fromLocation?: string;
  toLocation: string;
  responsible: string;
  reason: string;
  date?: string;
}

export interface UpdateStatus {
  status: InventoryStatus;
  reason?: string;
}

export interface CreateMaintenance {
  date: string;
  provider: string;
  description?: string;
  nextMaintenanceDate?: string;
  cost?: number;
}

export interface AnalyticsData {
  totalItems: number;
  totalValue: number;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: string;
  }>;
  categoryDistribution: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  locationDistribution: Array<{
    location: string;
    count: number;
  }>;
  maintenanceAlerts: InventoryItem[];
}

class InventoryService {
  async getItems(filters?: InventoryFilters): Promise<{ items: InventoryItem[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.responsible) params.append('responsible', filters.responsible);

    const response = await apiClient.get(`/inventory?${params.toString()}`);
    return response as { items: InventoryItem[]; total: number };
  }

  async getItem(id: string): Promise<InventoryItem> {
    const response = await apiClient.get(`/inventory/${id}`);
    return response as InventoryItem;
  }

  async createItem(data: CreateInventoryItem): Promise<InventoryItem> {
    const response = await apiClient.post('/inventory', data);
    return response as InventoryItem;
  }

  async updateItem(id: string, data: Partial<CreateInventoryItem>): Promise<InventoryItem> {
    const response = await apiClient.patch(`/inventory/${id}`, data);
    return response as InventoryItem;
  }

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/inventory/${id}`);
  }

  async findByCode(code: string): Promise<InventoryItem> {
    const response = await apiClient.get(`/inventory/scan/${code}`);
    return response as InventoryItem;
  }

  async createMovement(id: string, data: CreateMovement): Promise<InventoryItem> {
    const response = await apiClient.post(`/inventory/${id}/movement`, data);
    return response as InventoryItem;
  }

  async updateStatus(id: string, data: UpdateStatus): Promise<InventoryItem> {
    const response = await apiClient.patch(`/inventory/${id}/status`, data);
    return response as InventoryItem;
  }

  async createMaintenance(id: string, data: CreateMaintenance): Promise<InventoryItem> {
    const response = await apiClient.post(`/inventory/${id}/maintenance`, data);
    return response as InventoryItem;
  }

  async exportData(filters?: InventoryFilters, format: string = 'xlsx'): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.responsible) params.append('responsible', filters.responsible);
    params.append('format', format);

    const response = await apiClient.get(`/inventory/export?${params.toString()}`);
    return response as any;
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const response = await apiClient.get('/inventory/analytics');
    return response as AnalyticsData;
  }
}

export const inventoryService = new InventoryService();
