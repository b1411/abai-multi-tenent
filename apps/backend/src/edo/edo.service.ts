import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto, DocumentType } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ApproveDocumentDto, ApprovalStatus } from './dto/approve-document.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { DocumentFilterDto, DocumentStatus } from './dto/document-filter.dto';

@Injectable()
export class EdoService {
  constructor(private prisma: PrismaService) {}

  async create(createDocumentDto: CreateDocumentDto, userId: number) {
    const { approverIds, fileIds, ...documentData } = createDocumentDto;

    // Создаем документ
    const document = await this.prisma.document.create({
      data: {
        ...documentData,
        createdById: userId,
        deadline: documentData.deadline ? new Date(documentData.deadline) : null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, surname: true, email: true }
        },
        responsible: {
          select: { id: true, name: true, surname: true, email: true }
        },
        student: {
          select: { id: true, user: { select: { name: true, surname: true } } }
        }
      }
    });

    // Создаем связи с файлами если указаны
    if (fileIds && fileIds.length > 0) {
      const documentFiles = fileIds.map(fileId => ({
        documentId: document.id,
        fileId,
      }));

      await this.prisma.documentFile.createMany({
        data: documentFiles,
      });
    }

    // Создаем согласования если указаны согласующие
    if (approverIds && approverIds.length > 0) {
      const approvals = approverIds.map((approverId, index) => ({
        documentId: document.id,
        approverId,
        order: index + 1,
      }));

      await this.prisma.documentApproval.createMany({
        data: approvals,
      });

      // Обновляем статус документа на "На согласовании"
      await this.prisma.document.update({
        where: { id: document.id },
        data: { status: DocumentStatus.IN_PROGRESS },
      });
    }

    return document;
  }

  async findAll(filterDto: DocumentFilterDto, userId: number) {
    const { page = 1, limit = 20, search, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {
      ...filters,
    };

    // Поиск по названию
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { number: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, surname: true }
          },
          responsible: {
            select: { id: true, name: true, surname: true }
          },
          student: {
            select: { 
              id: true, 
              user: { select: { name: true, surname: true } },
              group: { select: { name: true } }
            }
          },
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, surname: true }
              }
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { comments: true, files: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: number) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, surname: true, email: true }
        },
        responsible: {
          select: { id: true, name: true, surname: true, email: true }
        },
        student: {
          select: { 
            id: true, 
            user: { select: { name: true, surname: true, email: true } },
            group: { select: { name: true } }
          }
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true, surname: true, email: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, surname: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        files: {
          include: {
            file: true
          }
        }
      },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto, userId: number) {
    const document = await this.findOne(id, userId);

    // Проверяем права на редактирование
    if (document.createdById !== userId && document.responsibleId !== userId) {
      throw new ForbiddenException('Нет прав на редактирование документа');
    }

    const { deadline, approverIds, ...updateData } = updateDocumentDto as any;

    // Обновляем документ
    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        ...updateData,
        deadline: deadline ? new Date(deadline) : undefined,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, surname: true }
        },
        responsible: {
          select: { id: true, name: true, surname: true }
        },
        student: {
          select: { id: true, user: { select: { name: true, surname: true } } }
        }
      }
    });

    // Если переданы согласующие, создаем согласования и меняем статус
    if (approverIds && approverIds.length > 0) {
      // Удаляем старые согласования
      await this.prisma.documentApproval.deleteMany({
        where: { documentId: id },
      });

      // Создаем новые согласования
      const approvals = approverIds.map((approverId: number, index: number) => ({
        documentId: id,
        approverId,
        order: index + 1,
      }));

      await this.prisma.documentApproval.createMany({
        data: approvals,
      });

      // Обновляем статус документа на "На согласовании"
      await this.prisma.document.update({
        where: { id },
        data: { status: DocumentStatus.IN_PROGRESS },
      });
    }

    return updatedDocument;
  }

  async remove(id: string, userId: number) {
    const document = await this.findOne(id, userId);

    // Проверяем права на удаление
    if (document.createdById !== userId) {
      throw new ForbiddenException('Нет прав на удаление документа');
    }

    return this.prisma.document.delete({
      where: { id },
    });
  }

  async approve(id: string, approveDto: ApproveDocumentDto, userId: number) {
    const document = await this.findOne(id, userId);

    // Находим согласование для текущего пользователя
    const approval = await this.prisma.documentApproval.findFirst({
      where: {
        documentId: id,
        approverId: userId,
        status: ApprovalStatus.PENDING,
      },
    });

    if (!approval) {
      throw new ForbiddenException('Нет прав на согласование этого документа');
    }

    // Обновляем согласование
    const updatedApproval = await this.prisma.documentApproval.update({
      where: { id: approval.id },
      data: {
        status: approveDto.status,
        comment: approveDto.comment,
        completedAt: new Date(),
      },
    });

    // Проверяем, все ли согласования завершены
    const allApprovals = await this.prisma.documentApproval.findMany({
      where: { documentId: id },
      orderBy: { order: 'asc' }
    });

    let newDocumentStatus = document.status;

    if (approveDto.status === ApprovalStatus.REJECTED) {
      newDocumentStatus = DocumentStatus.REJECTED;
    } else if (approveDto.status === ApprovalStatus.APPROVED) {
      const allApproved = allApprovals.every(a => a.status === ApprovalStatus.APPROVED);
      if (allApproved) {
        newDocumentStatus = DocumentStatus.APPROVED;
      }
    }

    // Обновляем статус документа если нужно
    if (newDocumentStatus !== document.status) {
      await this.prisma.document.update({
        where: { id },
        data: { 
          status: newDocumentStatus,
          completedAt: newDocumentStatus === DocumentStatus.APPROVED ? new Date() : null,
        },
      });
    }

    return updatedApproval;
  }

  async addComment(id: string, commentDto: AddCommentDto, userId: number) {
    // Проверяем, что документ существует
    await this.findOne(id, userId);

    return this.prisma.documentComment.create({
      data: {
        documentId: id,
        authorId: userId,
        content: commentDto.content,
      },
      include: {
        author: {
          select: { id: true, name: true, surname: true }
        }
      }
    });
  }

  async getComments(id: string, userId: number) {
    // Проверяем, что документ существует
    await this.findOne(id, userId);

    return this.prisma.documentComment.findMany({
      where: { documentId: id },
      include: {
        author: {
          select: { id: true, name: true, surname: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getApprovals(id: string, userId: number) {
    // Проверяем, что документ существует
    await this.findOne(id, userId);

    return this.prisma.documentApproval.findMany({
      where: { documentId: id },
      include: {
        approver: {
          select: { id: true, name: true, surname: true, email: true }
        }
      },
      orderBy: { order: 'asc' }
    });
  }

  // Служебные методы для генерации номеров документов
  async generateDocumentNumber(type: DocumentType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = this.getDocumentPrefix(type);
    
    const count = await this.prisma.document.count({
      where: {
        type,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    return `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }

  private getDocumentPrefix(type: DocumentType): string {
    switch (type) {
      case DocumentType.STUDENT_CERTIFICATE:
        return 'СПР';
      case DocumentType.ADMINISTRATIVE_ORDER:
        return 'ПРК';
      case DocumentType.FINANCIAL_CONTRACT:
        return 'ДГВ';
      case DocumentType.ENROLLMENT_ORDER:
        return 'ЗЧЛ';
      case DocumentType.ACADEMIC_TRANSCRIPT:
        return 'АКД';
      default:
        return 'ДОК';
    }
  }
}
