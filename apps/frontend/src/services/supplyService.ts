import apiClient from './apiClient';

export enum PurchaseRequestStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLACKLISTED = 'BLACKLISTED'
}

export interface PurchaseRequestItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  specifications?: string;
  brand?: string;
  model?: string;
}

export interface QuoteItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  brand?: string;
  model?: string;
}

export interface SupplierQuote {
  id: number;
  requestId: number;
  supplierId: number;
  supplier?: Supplier;
  request?: PurchaseRequest;
  quoteNumber?: string;
  totalAmount: number;
  currency: string;
  deliveryDays?: number;
  validUntil?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  isSelected: boolean;
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  requestId?: number;
  request?: PurchaseRequest;
  supplierId: number;
  supplier: Supplier;
  totalAmount: number;
  currency: string;
  orderDate: string;
  expectedDate?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  status: string;
  notes?: string;
  items: any[];
  deliveries: any[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequest {
  id: number;
  requestNumber: string;
  title: string;
  description?: string;
  requesterId: number;
  departmentId?: number;
  totalAmount: number;
  currency: string;
  urgency: string;
  requiredDate?: string;
  status: PurchaseRequestStatus;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  items: PurchaseRequestItem[];
  quotes: SupplierQuote[];
  orders: PurchaseOrder[];
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  bankDetails?: string;
  website?: string;
  rating?: number;
  status: SupplierStatus;
  notes?: string;
  quotes: SupplierQuote[];
  orders: PurchaseOrder[];
  deliveries: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequestItem {
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  specifications?: string;
  brand?: string;
  model?: string;
}

export interface CreatePurchaseRequest {
  title: string;
  description?: string;
  requesterId: number;
  departmentId?: number;
  totalAmount: number;
  currency?: string;
  urgency?: string;
  requiredDate?: string;
  items: CreatePurchaseRequestItem[];
}

export interface CreateSupplier {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  bankDetails?: string;
  website?: string;
  notes?: string;
}

export interface CreateSupplierQuote {
  requestId: number;
  supplierId: number;
  quoteNumber?: string;
  totalAmount: number;
  currency?: string;
  deliveryDays?: number;
  validUntil?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  items: CreateQuoteItem[];
}

export interface CreateQuoteItem {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  brand?: string;
  model?: string;
}

export interface SupplyAnalytics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  totalSuppliers: number;
  activeSuppliers: number;
  totalSpending: number;
  monthlySpending: Array<{
    month: string;
    amount: number;
  }>;
  topSuppliers: Array<{
    id: number;
    name: string;
    ordersCount: number;
    rating?: number;
  }>;
}

export interface SupplyFilters {
  search?: string;
  status?: string;
  urgency?: string;
  requesterId?: number;
  supplierId?: number;
}

class SupplyService {
  // Purchase Requests
  async createPurchaseRequest(data: CreatePurchaseRequest): Promise<PurchaseRequest> {
    return await apiClient.post('/supply/requests', data);
  }

  async getPurchaseRequests(filters?: SupplyFilters): Promise<{ requests: PurchaseRequest[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return await apiClient.get(`/supply/requests?${params.toString()}`);
  }

  async getPurchaseRequest(id: number): Promise<PurchaseRequest> {
    return await apiClient.get(`/supply/requests/${id}`);
  }

  async updatePurchaseRequestStatus(
    id: number,
    status: string,
    approvedBy?: number,
    rejectionReason?: string
  ): Promise<PurchaseRequest> {
    return await apiClient.patch(`/supply/requests/${id}/status`, {
      status,
      approvedBy,
      rejectionReason
    });
  }

  // Suppliers
  async createSupplier(data: CreateSupplier): Promise<Supplier> {
    return await apiClient.post('/supply/suppliers', data);
  }

  async getSuppliers(filters?: SupplyFilters): Promise<{ suppliers: Supplier[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return await apiClient.get(`/supply/suppliers?${params.toString()}`);
  }

  async getSupplier(id: number): Promise<Supplier> {
    return await apiClient.get(`/supply/suppliers/${id}`);
  }

  async updateSupplier(id: number, data: Partial<CreateSupplier>): Promise<Supplier> {
    return await apiClient.patch(`/supply/suppliers/${id}`, data);
  }

  // Quotes
  async createSupplierQuote(data: CreateSupplierQuote): Promise<SupplierQuote> {
    return await apiClient.post('/supply/quotes', data);
  }

  async selectSupplierQuote(id: number): Promise<SupplierQuote> {
    return await apiClient.patch(`/supply/quotes/${id}/select`);
  }

  // Orders
  async createPurchaseOrder(data: any): Promise<PurchaseOrder> {
    return await apiClient.post('/supply/orders', data);
  }

  async getPurchaseOrders(filters?: SupplyFilters): Promise<PurchaseOrder[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return await apiClient.get(`/supply/orders?${params.toString()}`);
  }

  // Analytics
  async getAnalytics(): Promise<SupplyAnalytics> {
    return await apiClient.get('/supply/analytics');
  }

  // Export
  async exportData(filters?: SupplyFilters): Promise<void> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    try {
      const response = await fetch(`/api/supply/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка экспорта');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `supply-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      throw error;
    }
  }
}

export const supplyService = new SupplyService();
export default supplyService;
