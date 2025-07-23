import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) { }

  async create(createPaymentDto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        studentId: createPaymentDto.studentId,
        serviceType: createPaymentDto.type,
        serviceName: this.getServiceName(createPaymentDto.type),
        amount: createPaymentDto.amount,
        currency: 'KZT',
        dueDate: new Date(createPaymentDto.dueDate),
        status: 'unpaid',
      },
      include: {
        student: {
          include: {
            user: true,
            group: true,
          },
        },
      },
    });
  }

  async findAll(filters: PaymentFilterDto = {}) {
    const where: any = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.serviceType) {
      where.serviceType = filters.serviceType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.dueDate = {};
      if (filters.dateFrom) {
        where.dueDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.dueDate.lte = new Date(filters.dateTo);
      }
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            group: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.page ? (filters.page - 1) * (filters.limit || 50) : 0,
    });

    const total = await this.prisma.payment.count({ where });

    // Преобразуем данные в формат, ожидаемый фронтендом
    const transformedPayments = payments.map((payment) => ({
      id: payment.id.toString(),
      studentId: payment.studentId.toString(),
      studentName: `${payment.student.user.name} ${payment.student.user.surname}`,
      grade: payment.student.group.name,
      serviceType: payment.serviceType.toLowerCase(),
      serviceName: payment.serviceName,
      amount: payment.amount,
      currency: 'KZT',
      dueDate: payment.dueDate.toISOString(),
      status: this.mapStatus(payment.status),
      paymentDate: payment.paymentDate?.toISOString(),
      paidAmount: payment.paidAmount || 0,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    }));

    const summary = await this.getSummary();

    return {
      payments: transformedPayments,
      total,
      summary,
    };
  }

  async findOne(id: number) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
            group: true,
          },
        },
      },
    });
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
    });
  }

  async remove(id: number) {
    return this.prisma.payment.delete({
      where: { id },
    });
  }

  async getSummary() {
    const totalDue = await this.prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
    });

    const totalPaid = await this.prisma.payment.aggregate({
      _sum: {
        paidAmount: true,
      },
      where: {
        status: {
          in: ['PAID', 'PARTIAL'],
        },
      },
    });

    const overdueCount = await this.prisma.payment.count({
      where: {
        status: 'OVERDUE',
      },
    });

    const paidCount = await this.prisma.payment.count({
      where: {
        status: 'PAID',
      },
    });

    const totalDueAmount = totalDue._sum.amount || 0;
    const totalPaidAmount = totalPaid._sum.paidAmount || 0;
    const collectionRate = totalDueAmount > 0 ? Math.round((totalPaidAmount / totalDueAmount) * 100) : 0;

    return {
      totalDue: totalDueAmount,
      totalPaid: totalPaidAmount,
      overdueCount,
      paidCount,
      collectionRate,
    };
  }

  async sendReminder(id: number, reminderData: any) {
    // Получаем информацию о платеже с родителями студента
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
            group: true,
            Parents: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new Error(`Payment with ID ${id} not found`);
    }

    // Получаем ID всех родителей студента
    const parentUserIds = payment.student.Parents.map(parent => parent.user.id);

    if (parentUserIds.length === 0) {
      throw new Error(`No parents found for student ${payment.student.user.name} ${payment.student.user.surname}`);
    }

    // Отправляем уведомления всем родителям через NotificationsService
    await this.notificationsService.addNotification({
      userIds: parentUserIds,
      type: 'PAYMENT_DUE',
      message: `Требуется оплата для ${payment.student.user.name} ${payment.student.user.surname}: ${payment.serviceName} - ${payment.amount} тенге. Срок: ${payment.dueDate.toLocaleDateString()}`,
      url: '/payments',
    });

    // Создаем запись напоминания в базе данных
    await this.prisma.paymentReminder.create({
      data: {
        paymentId: id,
        method: reminderData.method || 'email',
        message: reminderData.message || `Напоминание об оплате: ${payment.serviceName}`,
        status: 'sent',
      },
    });

    return { 
      message: 'Reminder sent successfully',
      paymentId: id,
      studentName: `${payment.student.user.name} ${payment.student.user.surname}`,
      parentCount: parentUserIds.length,
      sentTo: payment.student.Parents.map(parent => `${parent.user.name} ${parent.user.surname}`)
    };
  }

  generateInvoice(id: number) {
    // Здесь будет логика генерации квитанции
    return { message: 'Invoice generated successfully' };
  }

  private getServiceName(type: string): string {
    const typeLabels = {
      TUITION: 'Обучение',
      BOOKS: 'Книги и учебники',
      DORMITORY: 'Общежитие',
      MEAL: 'Питание',
      TRANSPORT: 'Транспорт',
      EXAM: 'Экзамены',
      CERTIFICATE: 'Сертификаты',
      OTHER: 'Прочее',
    };
    return typeLabels[type] || type;
  }

  private mapStatus(status: string): string {
    const statusMap = {
      PENDING: 'unpaid',
      PAID: 'paid',
      PARTIAL: 'partial',
      OVERDUE: 'overdue',
    };
    return statusMap[status] || 'unpaid';
  }
}
