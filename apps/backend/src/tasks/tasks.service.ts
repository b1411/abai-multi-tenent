import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { Task, TaskStatus, Prisma } from "../../generated/prisma";

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) { }

  async create(createTaskDto: CreateTaskDto, userId: number): Promise<Task> {
    const data: Prisma.TaskCreateInput = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      priority: createTaskDto.priority,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      tags: createTaskDto.tags || [],
      attachments: createTaskDto.attachments || [],
      createdBy: {
        connect: { id: userId }
      },
    };

    if (createTaskDto.assigneeId) {
      data.assignee = {
        connect: { id: createTaskDto.assigneeId }
      };
    }

    if (createTaskDto.categoryId) {
      data.category = {
        connect: { id: createTaskDto.categoryId }
      };
    }

    return this.prisma.task.create({
      data,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            avatar: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            avatar: true,
          }
        },
        category: true,
      },
    });
  }

  async findAll(filterDto: TaskFilterDto, userId: number) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      assigneeId,
      createdById,
      categoryId,
      dueDateFrom,
      dueDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      tags,
    } = filterDto;

    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      OR: [
        { createdById: userId },
        { assigneeId: userId },
      ],
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (createdById) {
      where.createdById = createdById;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = {
        hasSome: tagArray,
      };
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
              avatar: true,
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
              avatar: true,
            }
          },
          category: true,
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: number): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { createdById: userId },
          { assigneeId: userId },
        ],
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            avatar: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            avatar: true,
          }
        },
        category: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number): Promise<Task> {
    const task = await this.findOne(id, userId);

    // Только создатель может редактировать задачу
    if (task.createdById !== userId) {
      throw new ForbiddenException('Нет прав для редактирования этой задачи');
    }

    const updateData: Prisma.TaskUpdateInput = {
      title: updateTaskDto.title,
      description: updateTaskDto.description,
      priority: updateTaskDto.priority,
      status: updateTaskDto.status,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
      tags: updateTaskDto.tags,
      attachments: updateTaskDto.attachments,
    };

    if (updateTaskDto.status === TaskStatus.COMPLETED && !task.completedAt) {
      updateData.completedAt = new Date();
    } else if (updateTaskDto.status !== TaskStatus.COMPLETED && task.completedAt) {
      updateData.completedAt = null;
    }

    if (updateTaskDto.assigneeId !== undefined) {
      if (updateTaskDto.assigneeId) {
        updateData.assignee = {
          connect: { id: updateTaskDto.assigneeId }
        };
      } else {
        updateData.assignee = {
          disconnect: true
        };
      }
    }

    if (updateTaskDto.categoryId !== undefined) {
      if (updateTaskDto.categoryId) {
        updateData.category = {
          connect: { id: updateTaskDto.categoryId }
        };
      } else {
        updateData.category = {
          disconnect: true
        };
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            avatar: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            avatar: true,
          }
        },
        category: true,
      },
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const task = await this.findOne(id, userId);

    // Только создатель может удалить задачу
    if (task.createdById !== userId) {
      throw new ForbiddenException('Нет прав для удаления этой задачи');
    }

    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTaskStats(userId: number) {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      OR: [
        { createdById: userId },
        { assigneeId: userId },
      ],
    };

    const [
      total,
      pending,
      inProgress,
      completed,
      overdue,
    ] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({
        where: { ...where, status: TaskStatus.PENDING }
      }),
      this.prisma.task.count({
        where: { ...where, status: TaskStatus.IN_PROGRESS }
      }),
      this.prisma.task.count({
        where: { ...where, status: TaskStatus.COMPLETED }
      }),
      this.prisma.task.count({
        where: {
          ...where,
          status: { not: TaskStatus.COMPLETED },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
    };
  }

  async getCategories() {
    return this.prisma.taskCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(name: string, color?: string, description?: string) {
    return this.prisma.taskCategory.create({
      data: {
        name,
        color: color || '#3B82F6',
        description,
      },
    });
  }
}
