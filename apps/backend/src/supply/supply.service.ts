import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseRequestDto, CreateSupplierDto, CreateSupplierQuoteDto } from './dto/create-purchase-request.dto';

@Injectable()
export class SupplyService {
  constructor(private readonly prisma: PrismaService) { }

  // Purchase Requests
  async createPurchaseRequest(data: CreatePurchaseRequestDto) {
    const requestNumber = `PR-${Date.now()}`;

    return await this.prisma.purchaseRequest.create({
      data: {
        requestNumber,
        title: data.title,
        description: data.description,
        requesterId: data.requesterId,
        departmentId: data.departmentId,
        totalAmount: data.totalAmount,
        currency: data.currency || 'KZT',
        urgency: data.urgency || 'NORMAL',
        requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
        status: 'DRAFT',
        items: {
          create: data.items
        }
      },
      include: {
        items: true,
        quotes: {
          include: {
            supplier: true,
            items: true
          }
        },
        orders: {
          include: {
            supplier: true,
            items: true
          }
        }
      }
    });
  }

  async findAllPurchaseRequests(filters?: any) {
    const where: any = { deletedAt: null };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.urgency) {
      where.urgency = filters.urgency;
    }
    if (filters?.requesterId) {
      where.requesterId = parseInt(filters.requesterId);
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { requestNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [requests, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where,
        include: {
          items: true,
          quotes: {
            include: {
              supplier: true,
              items: true
            }
          },
          orders: {
            include: {
              supplier: true,
              items: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.purchaseRequest.count({ where })
    ]);

    return { requests, total };
  }

  async findOnePurchaseRequest(id: number) {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: true,
        quotes: {
          include: {
            supplier: true,
            items: true
          }
        },
        orders: {
          include: {
            supplier: true,
            items: true
          }
        }
      }
    });

    if (!request) {
      throw new NotFoundException('Заявка на закупку не найдена');
    }

    return request;
  }

  async updatePurchaseRequestStatus(id: number, status: string, approvedBy?: number, rejectionReason?: string) {
    const updateData: any = { status: status as any };

    if (status === 'APPROVED' && approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    if (status === 'REJECTED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    return await this.prisma.purchaseRequest.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        quotes: {
          include: {
            supplier: true,
            items: true
          }
        },
        orders: {
          include: {
            supplier: true,
            items: true
          }
        }
      }
    });
  }

  // Suppliers
  async createSupplier(data: CreateSupplierDto) {
    return await this.prisma.supplier.create({
      data: { ...data, status: 'ACTIVE' }
    });
  }

  async findAllSuppliers(filters?: any) {
    const where: any = { deletedAt: null };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { contactPerson: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        include: {
          quotes: true,
          orders: true,
          deliveries: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.supplier.count({ where })
    ]);

    return { suppliers, total };
  }

  async findOneSupplier(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id, deletedAt: null },
      include: {
        quotes: {
          include: {
            request: true,
            items: true
          }
        },
        orders: {
          include: {
            request: true,
            items: true
          }
        },
        deliveries: {
          include: {
            order: true,
            items: true
          }
        }
      }
    });

    if (!supplier) {
      throw new NotFoundException('Поставщик не найден');
    }

    return supplier;
  }

  async updateSupplier(id: number, data: Partial<CreateSupplierDto>) {
    return await this.prisma.supplier.update({
      where: { id },
      data,
      include: {
        quotes: true,
        orders: true,
        deliveries: true
      }
    });
  }

  async updateSupplierRating(id: number, rating: number) {
    return await this.prisma.supplier.update({
      where: { id },
      data: { rating },
      include: {
        quotes: true,
        orders: true,
        deliveries: true
      }
    });
  }

  // Supplier Quotes
  async createSupplierQuote(data: CreateSupplierQuoteDto) {
    return await this.prisma.supplierQuote.create({
      data: {
        ...data,
        isSelected: false,
        items: {
          create: data.items || []
        }
      },
      include: {
        supplier: true,
        request: true,
        items: true
      }
    });
  }

  async selectSupplierQuote(quoteId: number) {
    // Сначала сбрасываем все выборы для данной заявки
    const quote = await this.prisma.supplierQuote.findUnique({
      where: { id: quoteId }
    });

    if (!quote) {
      throw new NotFoundException('Предложение не найдено');
    }

    await this.prisma.supplierQuote.updateMany({
      where: { requestId: quote.requestId },
      data: { isSelected: false }
    });

    // Выбираем нужное предложение
    return await this.prisma.supplierQuote.update({
      where: { id: quoteId },
      data: { isSelected: true },
      include: {
        supplier: true,
        request: true,
        items: true
      }
    });
  }

  // Analytics
  async getSupplyAnalytics() {
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      totalSuppliers,
      activeSuppliers,
      totalSpending,
      monthlySpending,
      topSuppliers
    ] = await Promise.all([
      this.prisma.purchaseRequest.count({ where: { deletedAt: null } }),
      this.prisma.purchaseRequest.count({ where: { status: 'PENDING', deletedAt: null } }),
      this.prisma.purchaseRequest.count({ where: { status: 'APPROVED', deletedAt: null } }),
      this.prisma.supplier.count({ where: { deletedAt: null } }),
      this.prisma.supplier.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.purchaseOrder.aggregate({
        where: { deletedAt: null },
        _sum: { totalAmount: true }
      }),
      this.prisma.purchaseOrder.groupBy({
        by: ['createdAt'],
        where: { deletedAt: null },
        _sum: { totalAmount: true },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),
      this.prisma.supplier.findMany({
        where: { deletedAt: null },
        include: {
          orders: {
            where: { deletedAt: null }
          }
        },
        orderBy: { rating: 'desc' },
        take: 5
      })
    ]);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      totalSuppliers,
      activeSuppliers,
      totalSpending: totalSpending._sum.totalAmount || 0,
      monthlySpending: monthlySpending.map(item => ({
        month: item.createdAt.toISOString().substring(0, 7),
        amount: item._sum.totalAmount || 0
      })),
      topSuppliers: topSuppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        ordersCount: supplier.orders.length,
        rating: supplier.rating
      }))
    };
  }

  // Purchase Orders
  async createPurchaseOrder(data: any) {
    const orderNumber = `PO-${Date.now()}`;

    return await this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        ...data,
        status: 'CONFIRMED',
        items: {
          create: data.items || []
        }
      },
      include: {
        supplier: true,
        request: true,
        items: true,
        deliveries: true
      }
    });
  }

  async findAllPurchaseOrders(filters?: any) {
    const where: any = { deletedAt: null };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.supplierId) {
      where.supplierId = parseInt(filters.supplierId);
    }
    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { supplier: { name: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    return await this.prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        request: true,
        items: true,
        deliveries: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
