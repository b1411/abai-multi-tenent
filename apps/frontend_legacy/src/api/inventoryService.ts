import apiClient from './client';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'active' | 'repair' | 'written-off' | 'lost';
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
  movements?: Array<{
    date: string;
    fromLocation: string;
    toLocation: string;
    responsible: string;
    reason: string;
  }>;
}

export interface InventoryFilters {
  search?: string;
  category?: string;
  status?: 'active' | 'repair' | 'written-off' | 'lost';
  location?: string;
  responsible?: string;
}

export interface CreateInventoryItem {
  name: string;
  category: string;
  location: string;
  status: 'active' | 'repair' | 'written-off' | 'lost';
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
}

export interface MovementData {
  fromLocation: string;
  toLocation: string;
  responsible: string;
  reason: string;
}

export interface StatusUpdate {
  status: 'active' | 'repair' | 'written-off' | 'lost';
  reason?: string;
}

export interface MaintenanceData {
  date: string;
  provider: string;
  description: string;
  nextMaintenanceDate: string;
}

class InventoryService {
  private baseUrl = '/inventory';

  async getItems(filters?: InventoryFilters): Promise<{ items: InventoryItem[]; total: number }> {
    const query: Record<string, any> = {};
    if (filters?.search) query.search = filters.search;
    if (filters?.category) query.category = filters.category;
    if (filters?.status) query.status = filters.status;
    if (filters?.location) query.location = filters.location;
    if (filters?.responsible) query.responsible = filters.responsible;

    const response = await apiClient.request({
      path: this.baseUrl,
      method: 'GET',
      query,
      format: 'json'
    });
    return response.data;
  }

  async getItem(id: string): Promise<InventoryItem> {
    const response = await apiClient.request({
      path: `${this.baseUrl}/${id}`,
      method: 'GET',
      format: 'json'
    });
    return response.data;
  }

  async getItemByCode(code: string): Promise<InventoryItem> {
    const response = await apiClient.request({
      path: `${this.baseUrl}/scan/${code}`,
      method: 'GET',
      format: 'json'
    });
    return response.data;
  }

  async createItem(data: CreateInventoryItem): Promise<InventoryItem> {
    const response = await apiClient.request({
      path: this.baseUrl,
      method: 'POST',
      body: data,
      format: 'json'
    });
    return response.data;
  }

  async updateItem(id: string, data: Partial<CreateInventoryItem>): Promise<InventoryItem> {
    const response = await apiClient.request({
      path: `${this.baseUrl}/${id}`,
      method: 'PATCH',
      body: data,
      format: 'json'
    });
    return response.data;
  }

  async deleteItem(id: string): Promise<{ message: string; id: string }> {
    const response = await apiClient.request({
      path: `${this.baseUrl}/${id}`,
      method: 'DELETE',
      format: 'json'
    });
    return response.data;
  }

  async createMovement(id: string, data: MovementData): Promise<InventoryItem> {
    const response = await apiClient.request({
      path: `${this.baseUrl}/${id}/movement`,
      method: 'POST',
      body: data,
      format: 'json'
    });
    return response.data;
  }

  async updateStatus(id: string, data: StatusUpdate): Promise<InventoryItem> {
    const response = await apiClient.request({
      path: `${this.baseUrl}/${id}/status`,
      method: 'PATCH',
      body: data,
      format: 'json'
    });
    return response.data;
  }

  async createMaintenance(id: string, data: MaintenanceData): Promise<InventoryItem> {
    const response = await apiClient.request({
      path: `${this.baseUrl}/${id}/maintenance`,
      method: 'POST',
      body: data,
      format: 'json'
    });
    return response.data;
  }

  async exportData(filters?: InventoryFilters, format: string = 'xlsx'): Promise<any> {
    const query: Record<string, any> = { format };
    if (filters?.search) query.search = filters.search;
    if (filters?.category) query.category = filters.category;
    if (filters?.status) query.status = filters.status;
    if (filters?.location) query.location = filters.location;
    if (filters?.responsible) query.responsible = filters.responsible;

    const response = await apiClient.request({
      path: `${this.baseUrl}/export`,
      method: 'GET',
      query,
      format: 'json'
    });
    return response.data;
  }
}

export const inventoryService = new InventoryService();
