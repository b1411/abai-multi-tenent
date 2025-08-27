import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateGroupPaymentDto, PaymentRecurrence } from './dto/create-group-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { GenerateInvoiceDto, GenerateSummaryInvoiceDto } from './dto/invoice-generation.dto';
import { InvoiceGeneratorService } from './invoice-generator.service';
import { Payment as PaymentDto } from './dto/payment.dto';
import { getCurrentAcademicQuarterRange, getAcademicYearStartYear, getNextAcademicQuarterStart } from '../common/academic-period.util';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private invoiceGeneratorService: InvoiceGeneratorService
  ) { }

  async create(createPaymentDto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
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
    await this.ensureBudgetItem(payment);
    return payment;
  }

  async createGroupPayment(createGroupPaymentDto: CreateGroupPaymentDto) {
    // Получаем всех студентов группы
    const group = await this.prisma.group.findUnique({
      where: { id: createGroupPaymentDto.groupId },
      include: {
        students: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group) {
      throw new Error(`Group with ID ${createGroupPaymentDto.groupId} not found`);
    }

    const excludedIds = createGroupPaymentDto.excludedStudentIds || [];
    const overrides = createGroupPaymentDto.studentOverrides || [];
    
    // Создаем мапу для быстрого поиска переопределений
    const overrideMap = new Map();
    overrides.forEach(override => {
      overrideMap.set(override.studentId, override);
    });

    // Фильтруем студентов для создания платежей
    const studentsToProcess = group.students.filter(student => {
      const override = overrideMap.get(student.id);
      
      // Исключаем студентов из списка исключений
      if (excludedIds.includes(student.id)) {
        return false;
      }
      
      // Исключаем студентов с флагом excluded в переопределениях
      if (override?.excluded) {
        return false;
      }
      
      return true;
    });

    const createdPayments = [];
    const errors = [];
    const allParentUserIds = new Set<number>();

    // Определяем даты для периодических платежей
    const paymentDates = this.calculatePaymentDates(createGroupPaymentDto);

    // Создаем платежи для каждого студента
    for (const student of studentsToProcess) {
      try {
        const override = overrideMap.get(student.id);
        const amount = override?.amount || createGroupPaymentDto.amount;
        const serviceName = createGroupPaymentDto.serviceName || this.getServiceName(createGroupPaymentDto.type);

        // Создаем платежи для всех дат (включая периодические)
        for (let i = 0; i < paymentDates.length; i++) {
          const paymentDate = paymentDates[i];
          const isRecurring = i > 0;
          const finalServiceName = isRecurring ? `${serviceName} (${i + 1}/${paymentDates.length})` : serviceName;

          const payment = await this.prisma.payment.create({
            data: {
              studentId: student.id,
              serviceType: createGroupPaymentDto.type,
              serviceName: finalServiceName,
              amount,
              currency: 'KZT',
              dueDate: paymentDate,
              status: 'unpaid',
            },
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

          await this.ensureBudgetItem(payment);
          createdPayments.push(payment);

          // Собираем ID родителей для уведомлений
          if (createGroupPaymentDto.sendNotifications !== false) {
            payment.student.Parents.forEach(parent => {
              allParentUserIds.add(parent.user.id);
            });
          }
        }
      } catch (error) {
        errors.push({
          studentId: student.id,
          studentName: `${student.user.name} ${student.user.surname}`,
          error: error.message,
        });
      }
    }

    // Отправляем уведомления родителям, если включено
    if (createGroupPaymentDto.sendNotifications !== false && allParentUserIds.size > 0) {
      try {
        const serviceName = createGroupPaymentDto.serviceName || this.getServiceName(createGroupPaymentDto.type);
        const isRecurring = paymentDates.length > 1;
        
        let message = `Новый платеж для группы ${group.name}: ${serviceName}`;
        message += `\nСумма: ${createGroupPaymentDto.amount} тенге`;
        message += `\nСрок первой оплаты: ${new Date(createGroupPaymentDto.dueDate).toLocaleDateString()}`;
        
        if (isRecurring) {
          message += `\nПериодичность: ${this.getRecurrenceLabel(createGroupPaymentDto.recurrence)}`;
          message += `\nВсего платежей: ${paymentDates.length}`;
        }

        await this.notificationsService.addNotification({
          userIds: Array.from(allParentUserIds),
          type: 'PAYMENT_DUE',
          message,
          url: '/payments',
        });
      } catch (notificationError) {
        console.error('Ошибка отправки уведомлений:', notificationError);
      }
    }

    return {
      groupId: createGroupPaymentDto.groupId,
      groupName: group.name,
      totalStudents: group.students.length,
      processedStudents: studentsToProcess.length,
      createdPayments: createdPayments.length,
      errors,
      payments: createdPayments.map(payment => ({
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
        createdAt: payment.createdAt.toISOString(),
      })),
    };
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

    // Для родителей вычисляем summary только по их детям
    const summary = user && user.role === 'PARENT' 
      ? await this.getParentSummary(user.id)
      : await this.getSummary();

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

  async getStudentHistory(studentId: number, user?: any): Promise<PaymentDto[]> {
    // Родитель может видеть только своих детей
    if (user && user.role === 'PARENT') {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: user.id },
        include: {
          students: { select: { id: true } }
        }
      });
      const studentIds = parent?.students.map(s => s.id) || [];
      if (!studentIds.includes(studentId)) {
        return [];
      }
    }

    const payments = await this.prisma.payment.findMany({
      where: { studentId },
      include: {
        student: {
          include: {
            user: true,
            group: true,
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    return payments.map((payment) => ({
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
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    // Подготовка данных (приведение типов)
    const data: any = { ...updatePaymentDto };

    if (data.paymentDate) {
      // Преобразуем YYYY-MM-DD в Date
      data.paymentDate = new Date(data.paymentDate);
    }

    if (data.paidAmount !== undefined) {
      data.paidAmount = Number(data.paidAmount);
    }

    // Если статус paid и не передана paidAmount, берем сумму платежа
    if (data.status === 'paid' && (data.paidAmount === undefined || data.paidAmount === null)) {
      const original = await this.prisma.payment.findUnique({ where: { id } });
      if (original) {
        data.paidAmount = original.amount;
        if (!data.paymentDate) data.paymentDate = new Date();
      }
    }

    // Обновляем платеж
    const updated = await this.prisma.payment.update({
      where: { id },
      data,
    });

    await this.ensureBudgetItem(updated);
    return updated;
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

  async getParentSummary(userId: number) {
    // Находим родителя и его детей
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          select: { id: true }
        }
      }
    });

    if (!parent || parent.students.length === 0) {
      return {
        totalDue: 0,
        totalPaid: 0,
        overdueCount: 0,
        paidCount: 0,
        collectionRate: 0,
      };
    }

    const studentIds = parent.students.map(student => student.id);

    const totalDue = await this.prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        studentId: { in: studentIds },
      },
    });

    // Исправим логику для totalPaid - считаем по paidAmount > 0, а не по статусу
    const totalPaid = await this.prisma.payment.aggregate({
      _sum: {
        paidAmount: true,
      },
      where: {
        studentId: { in: studentIds },
        paidAmount: {
          gt: 0
        }
      },
    });

    // Исправим подсчет для overdue - проверяем dueDate и статус
    const overdueCount = await this.prisma.payment.count({
      where: {
        studentId: { in: studentIds },
        OR: [
          { status: 'OVERDUE' },
          {
            AND: [
              { status: { in: ['PENDING', 'UNPAID'] } },
              { dueDate: { lt: new Date() } }
            ]
          }
        ]
      },
    });

    // Получаем все платежи детей для подсчета полностью оплаченных
    const allPayments = await this.prisma.payment.findMany({
      where: {
        studentId: { in: studentIds },
      },
      select: {
        amount: true,
        paidAmount: true,
        status: true,
      },
    });

    // Подсчитываем полностью оплаченные платежи
    const paidCount = allPayments.filter(payment => 
      payment.status === 'PAID' || 
      (payment.paidAmount && payment.paidAmount >= payment.amount)
    ).length;

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

  private calculatePaymentDates(dto: CreateGroupPaymentDto): Date[] {
    const dates: Date[] = [];
    const startDate = new Date(dto.dueDate);
    
    // Добавляем первую дату
    dates.push(new Date(startDate));

    // Если нет периодичности или она ONCE, возвращаем только одну дату
    if (!dto.recurrence || dto.recurrence === PaymentRecurrence.ONCE) {
      return dates;
    }

    // Определяем количество повторений
    let count = dto.recurrenceCount || 1;
    const endDate = dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null;

    // Ограничиваем максимальное количество повторений для безопасности
    count = Math.min(count, 12);

    for (let i = 1; i < count; i++) {
      const nextDate = new Date(startDate);
      
      switch (dto.recurrence) {
        case PaymentRecurrence.WEEKLY:
          nextDate.setDate(startDate.getDate() + (i * 7));
          break;
        case PaymentRecurrence.MONTHLY:
          nextDate.setMonth(startDate.getMonth() + i);
          break;
        case PaymentRecurrence.QUARTERLY: {
          // Академические четверти
          let iterDate = new Date(startDate);
          for (let step = 0; step < i; step++) {
            iterDate = getNextAcademicQuarterStart(iterDate);
          }
          nextDate.setTime(iterDate.getTime());
          break;
        }
        case PaymentRecurrence.YEARLY:
          nextDate.setFullYear(startDate.getFullYear() + i);
          break;
        default:
          break;
      }

      // Проверяем не превышает ли дата конечную дату
      if (endDate && nextDate > endDate) {
        break;
      }

      dates.push(nextDate);
    }

    return dates;
  }

  private getRecurrenceLabel(recurrence?: PaymentRecurrence): string {
    const labels = {
      [PaymentRecurrence.ONCE]: 'Однократно',
      [PaymentRecurrence.WEEKLY]: 'Еженедельно',
      [PaymentRecurrence.MONTHLY]: 'Ежемесячно',
      [PaymentRecurrence.QUARTERLY]: 'Ежеквартально',
      [PaymentRecurrence.YEARLY]: 'Ежегодно',
    };
    
    return labels[recurrence] || 'Однократно';
  }

  // Формируем период бюджета теперь по академическим четвертям (год = год начала учебного года)
  private getBudgetPeriod(date: Date): string {
    const d = new Date(date);
    const aq = getCurrentAcademicQuarterRange(d);
    const ay = getAcademicYearStartYear(d);
    // Формат оставляем "YYYY QN", где YYYY = год сентября учебного года
    return `${ay} Q${aq.index}`;
  }

  // Создание/обновление бюджетной статьи для планового и фактического дохода
  private async ensureBudgetItem(payment: any) {
    try {
      const status = (payment.status || '').toLowerCase();
      const periodDate = payment.paymentDate || payment.dueDate || new Date();
      const period = this.getBudgetPeriod(periodDate);
      const name = `Поступление платежа #${payment.id}`;

      const existing = await this.prisma.budgetItem.findFirst({
        where: {
          name,
          deletedAt: null,
        },
      });

      let actualAmount = 0;
      if (status === 'paid') {
        actualAmount = payment.paidAmount || payment.amount;
      } else if (status === 'partial') {
        actualAmount = payment.paidAmount || 0;
      }

      if (!existing) {
        await this.prisma.budgetItem.create({
          data: {
            name,
            type: 'INCOME',
            category: 'tuition',
            plannedAmount: payment.amount,
            actualAmount,
            currency: payment.currency || 'KZT',
            period,
            responsible: 'FINANCE',
            status: 'ACTIVE',
            description: `Платеж за ${payment.serviceName}, студент ID ${payment.studentId}`,
          },
        });
      } else {
        await this.prisma.budgetItem.update({
          where: { id: existing.id },
          data: {
            plannedAmount: payment.amount,
            actualAmount,
            description: `Обновлено: платеж за ${payment.serviceName}, студент ID ${payment.studentId}`,
          },
        });
      }
    } catch (e) {
      console.error('ensureBudgetItem error', payment?.id, e);
    }
  }
}
