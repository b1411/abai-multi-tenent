import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { GenerateInvoiceDto, GenerateSummaryInvoiceDto } from './dto/invoice-generation.dto';
import { InvoiceGeneratorService } from './invoice-generator.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private invoiceGeneratorService: InvoiceGeneratorService
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

  async findAll(filters: PaymentFilterDto = {}, user?: any) {
    const where: any = {};

    // Если пользователь родитель, показываем только платежи его детей
    if (user && user.role === 'PARENT') {
      // Сначала находим всех детей этого родителя
      const parent = await this.prisma.parent.findUnique({
        where: { userId: user.id },
        include: {
          students: {
            select: { id: true }
          }
        }
      });

      if (parent && parent.students.length > 0) {
        const studentIds = parent.students.map(student => student.id);
        where.studentId = { in: studentIds };
      } else {
        // Если у родителя нет детей, возвращаем пустой результат
        where.studentId = -1; // Несуществующий ID
      }
    }

    if (filters.studentId) {
      const studentIdNum = parseInt(filters.studentId);
      // Если указан конкретный studentId, проверяем права доступа
      if (user && user.role === 'PARENT') {
        const parent = await this.prisma.parent.findUnique({
          where: { userId: user.id },
          include: {
            students: {
              select: { id: true }
            }
          }
        });
        
        const studentIds = parent?.students.map(student => student.id) || [];
        if (!studentIds.includes(studentIdNum)) {
          // Родитель пытается получить доступ к данным не своего ребенка
          where.studentId = -1; // Несуществующий ID
        } else {
          where.studentId = studentIdNum;
        }
      } else {
        where.studentId = studentIdNum;
      }
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

  async findOne(id: number, user?: any) {
    // Если пользователь родитель, проверяем что платеж относится к его ребенку
    if (user && user.role === 'PARENT') {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: user.id },
        include: {
          students: {
            select: { id: true }
          }
        }
      });

      const payment = await this.prisma.payment.findUnique({
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

      if (!payment) {
        return null;
      }

      const studentIds = parent?.students.map(student => student.id) || [];
      if (!studentIds.includes(payment.studentId)) {
        // Родитель пытается получить доступ к платежу не своего ребенка
        return null;
      }

      return payment;
    }

    // Для ADMIN и FINANCIST возвращаем платеж без ограничений
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

  async generateInvoice(id: number, generateDto: GenerateInvoiceDto, user?: any) {
    return this.invoiceGeneratorService.generateInvoice(id, generateDto, user);
  }

  async generateSummaryInvoice(studentId: number, generateDto: GenerateSummaryInvoiceDto, user?: any) {
    return this.invoiceGeneratorService.generateSummaryInvoice(studentId, generateDto, user);
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
