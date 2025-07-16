import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePaymentDto, PaymentStatus } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    // Проверяем существование студента
    const student = await this.prisma.student.findFirst({
      where: {
        id: createPaymentDto.studentId,
        deletedAt: null
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${createPaymentDto.studentId} not found`);
    }

    // Создаем платеж с базовыми полями из схемы
    const paymentData: any = {
      studentId: createPaymentDto.studentId,
      amount: createPaymentDto.amount,
      serviceType: createPaymentDto.type, // соответствует полю serviceType в схеме
      serviceName: createPaymentDto.description || `Payment for ${createPaymentDto.type}`,
      currency: 'KZT', // валюта по умолчанию
      status: PaymentStatus.PENDING,
      paymentDate: createPaymentDto.paymentDate ? new Date(createPaymentDto.paymentDate) : new Date(),
    };

    if (createPaymentDto.dueDate) {
      paymentData.dueDate = new Date(createPaymentDto.dueDate);
    }

    return this.prisma.payment.create({
      data: paymentData,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                phone: true,
              },
            },
            group: {
              select: {
                name: true,
                courseNumber: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      where: { deletedAt: null },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
            group: {
              select: {
                name: true,
                courseNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                middlename: true,
                email: true,
                phone: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
                courseNumber: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    await this.findOne(id); // Проверяем существование

    const updateData: any = {};

    if (updatePaymentDto.amount) updateData.amount = updatePaymentDto.amount;
    if (updatePaymentDto.type) updateData.serviceType = updatePaymentDto.type;
    if (updatePaymentDto.description) updateData.serviceName = updatePaymentDto.description;
    if (updatePaymentDto.paymentDate) updateData.paymentDate = new Date(updatePaymentDto.paymentDate);
    if (updatePaymentDto.dueDate) updateData.dueDate = new Date(updatePaymentDto.dueDate);

    return this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
            group: {
              select: {
                name: true,
                courseNumber: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.payment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Специальные методы для платежей

  async findByStudent(studentId: number) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return this.prisma.payment.findMany({
      where: {
        studentId,
        deletedAt: null
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findByStatus(status: string) {
    return this.prisma.payment.findMany({
      where: {
        status,
        deletedAt: null
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
            group: {
              select: {
                name: true,
                courseNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processPayment(paymentId: number) {
    const payment = await this.findOne(paymentId);

    if (payment.status !== 'PENDING') {
      throw new BadRequestException(`Payment ${paymentId} is not in PENDING status`);
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PROCESSING',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async completePayment(paymentId: number) {
    const payment = await this.findOne(paymentId);

    if (!['PENDING', 'PROCESSING'].includes(payment.status)) {
      throw new BadRequestException(`Cannot complete payment ${paymentId} with status ${payment.status}`);
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async failPayment(paymentId: number) {
    const payment = await this.findOne(paymentId);

    if (!['PENDING', 'PROCESSING'].includes(payment.status)) {
      throw new BadRequestException(`Cannot fail payment ${paymentId} with status ${payment.status}`);
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getPaymentStatistics() {
    const totalPayments = await this.prisma.payment.count({
      where: { deletedAt: null },
    });

    const recentPayments = await this.prisma.payment.findMany({
      where: { deletedAt: null },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Просроченные платежи
    const overduePayments = await this.prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Общая сумма
    const totalAmount = await this.prisma.payment.aggregate({
      where: {
        deletedAt: null,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    return {
      totalPayments,
      totalAmount: totalAmount._sum.amount || 0,
      recentPayments,
      overduePayments,
      overdueCount: overduePayments.length,
    };
  }

  async getStudentPaymentSummary(studentId: number) {
    await this.prisma.student.findFirstOrThrow({
      where: { id: studentId, deletedAt: null },
    });

    const payments = await this.prisma.payment.findMany({
      where: {
        studentId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalPayments: payments.length,
      totalPaid: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
      totalPending: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
      totalOverdue: payments.filter(p => p.status === 'PENDING' && p.dueDate && p.dueDate < new Date()).reduce((sum, p) => sum + p.amount, 0),
      lastPaymentDate: payments.find(p => p.status === 'COMPLETED')?.paymentDate || null,
      recentPayments: payments.slice(0, 5),
    };

    return summary;
  }

  async searchPayments(query: string) {
    return this.prisma.payment.findMany({
      where: {
        deletedAt: null,
        OR: [
          { serviceName: { contains: query, mode: 'insensitive' } },
          { student: { user: { name: { contains: query, mode: 'insensitive' } } } },
          { student: { user: { surname: { contains: query, mode: 'insensitive' } } } },
          { student: { user: { email: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
            group: {
              select: {
                name: true,
                courseNumber: true,
              },
            },
          },
        },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Методы для работы с родителями и платежами

  async assignPaymentToParent(paymentId: number, parentId: number) {
    // Проверяем существование платежа
    const payment = await this.findOne(paymentId);

    // Проверяем существование родителя
    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, deletedAt: null },
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${parentId} not found`);
    }

    // Проверяем, связан ли родитель с этим студентом (через таблицу Parents студента)
    const student = await this.prisma.student.findFirst({
      where: {
        id: payment.studentId,
        Parents: {
          some: {
            id: parentId,
          },
        },
      },
    });

    if (!student) {
      throw new BadRequestException(`Parent ${parentId} is not linked to student ${payment.studentId}`);
    }

    // Обновляем платеж, добавляя информацию о родителе (в поле serviceName пока)
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        serviceName: `${payment.serviceName} | Assigned to parent ID: ${parentId}`,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
            group: true,
            Parents: {
              where: { id: parentId },
              include: {
                user: {
                  select: {
                    name: true,
                    surname: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getParentPayments(parentId: number) {
    // Проверяем существование родителя
    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, deletedAt: null },
      include: {
        user: {
          select: {
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${parentId} not found`);
    }

    // Получаем всех детей этого родителя
    const children = await this.prisma.student.findMany({
      where: {
        deletedAt: null,
        Parents: {
          some: {
            id: parentId,
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            surname: true,
          },
        },
        group: {
          select: {
            name: true,
            courseNumber: true,
          },
        },
      },
    });

    // Получаем все платежи детей этого родителя
    const childrenIds = children.map(child => child.id);

    const payments = await this.prisma.payment.findMany({
      where: {
        studentId: { in: childrenIds },
        deletedAt: null,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
              },
            },
            group: {
              select: {
                name: true,
                courseNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      parent: {
        id: parent.id,
        name: `${parent.user.surname} ${parent.user.name}`,
        email: parent.user.email,
      },
      children,
      payments,
      summary: {
        totalChildren: children.length,
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        totalPaid: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
        totalPending: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
        overduePayments: payments.filter(p => p.status === 'PENDING' && p.dueDate && p.dueDate < new Date()).length,
      },
    };
  }

  async createPaymentForParent(parentId: number, studentId: number, createPaymentDto: Omit<CreatePaymentDto, 'studentId'>) {
    // Проверяем существование родителя
    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, deletedAt: null },
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${parentId} not found`);
    }

    // Проверяем, что студент связан с этим родителем
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        deletedAt: null,
        Parents: {
          some: {
            id: parentId,
          },
        },
      },
    });

    if (!student) {
      throw new BadRequestException(`Student ${studentId} is not linked to parent ${parentId}`);
    }

    // Создаем платеж с указанием родителя
    const paymentData: any = {
      studentId,
      amount: createPaymentDto.amount,
      serviceType: createPaymentDto.type,
      serviceName: createPaymentDto.description || `Payment for ${createPaymentDto.type} | Created by parent ID: ${parentId}`,
      currency: 'KZT',
      status: PaymentStatus.PENDING,
      paymentDate: createPaymentDto.paymentDate ? new Date(createPaymentDto.paymentDate) : new Date(),
    };

    if (createPaymentDto.dueDate) {
      paymentData.dueDate = new Date(createPaymentDto.dueDate);
    }

    return this.prisma.payment.create({
      data: paymentData,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
            group: {
              select: {
                name: true,
                courseNumber: true,
              },
            },
            Parents: {
              where: { id: parentId },
              include: {
                user: {
                  select: {
                    name: true,
                    surname: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async payByParent(paymentId: number, parentId: number, paymentMethod: string = 'CARD') {
    // Проверяем платеж и права родителя
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        deletedAt: null,
        student: {
          Parents: {
            some: {
              id: parentId,
            },
          },
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
              },
            },
            Parents: {
              where: { id: parentId },
              include: {
                user: {
                  select: {
                    name: true,
                    surname: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found or parent ${parentId} has no access to it`);
    }

    if (payment.status !== 'PENDING') {
      throw new BadRequestException(`Payment ${paymentId} is not in PENDING status`);
    }

    // Обновляем платеж как оплаченный родителем
    const parentInfo = payment.student.Parents[0];
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
        serviceName: `${payment.serviceName} | Paid by: ${parentInfo.user.surname} ${parentInfo.user.name} via ${paymentMethod}`,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
              },
            },
            group: true,
            Parents: {
              where: { id: parentId },
              include: {
                user: {
                  select: {
                    name: true,
                    surname: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
