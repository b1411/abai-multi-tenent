import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  async create(createParentDto: CreateParentDto) {
    // Проверяем существование пользователя
    const user = await this.prisma.user.findFirst({
      where: { 
        id: createParentDto.userId, 
        role: 'PARENT',
        deletedAt: null 
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createParentDto.userId} not found or is not a parent`);
    }

    // Проверяем, не является ли пользователь уже родителем
    const existingParent = await this.prisma.parent.findFirst({
      where: { 
        userId: createParentDto.userId,
        deletedAt: null 
      },
    });

    if (existingParent) {
      throw new ConflictException('User is already a parent');
    }

    return this.prisma.parent.create({
      data: createParentDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.parent.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: [
        { user: { surname: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }

  async findOne(id: number) {
    const parent = await this.prisma.parent.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    return parent;
  }

  async update(id: number, updateParentDto: UpdateParentDto) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.parent.update({
      where: { id },
      data: updateParentDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.parent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Специальные методы для родителей

  async findByUser(userId: number) {
    return this.prisma.parent.findFirst({
      where: { 
        userId,
        deletedAt: null 
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async getParentStatistics() {
    const totalParents = await this.prisma.parent.count({
      where: { deletedAt: null },
    });

    const recentParents = await this.prisma.parent.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalParents,
      recentParents,
    };
  }

  async searchParents(query: string) {
    return this.prisma.parent.findMany({
      where: {
        deletedAt: null,
        OR: [
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { surname: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
      take: 20,
      orderBy: [
        { user: { surname: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }
}
