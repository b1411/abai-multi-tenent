import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryFilterDto, InventoryStatus } from './dto/inventory-filter.dto';
import { CreateMovementDto, UpdateStatusDto, CreateMaintenanceDto } from './dto/create-movement.dto';

@Injectable()
export class InventoryService {
    constructor(private readonly prisma: PrismaService) { }

  create(createInventoryItemDto: CreateInventoryItemDto) {
    const { warranty, maintenanceSchedule, ...data } = createInventoryItemDto;
    
    return this.prisma.inventoryItem.create({
      data: {
        ...data,
        status: data.status ? data.status as any : 'ACTIVE',
        purchaseDate: new Date(data.purchaseDate),
        lastInventory: new Date(data.lastInventory || new Date()),
        warranty: warranty ? warranty as any : null,
        maintenanceSchedule: maintenanceSchedule ? maintenanceSchedule as any : null,
      },
      include: {
        movements: true,
        maintenanceRecords: true,
      }
    });
  }

    async findAll(filters: InventoryFilterDto) {
        const where: any = {
            deletedAt: null
        };

        // Фильтрация по параметрам
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { serialNumber: { contains: filters.search, mode: 'insensitive' } },
                { manufacturer: { contains: filters.search, mode: 'insensitive' } },
                { model: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        if (filters.category) {
            where.category = { contains: filters.category, mode: 'insensitive' };
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.location) {
            where.location = { contains: filters.location, mode: 'insensitive' };
        }

        if (filters.responsible) {
            where.responsible = { contains: filters.responsible, mode: 'insensitive' };
        }

        const [items, total] = await Promise.all([
            this.prisma.inventoryItem.findMany({
                where,
                include: {
                    movements: {
                        orderBy: { date: 'desc' },
                        take: 5 // Последние 5 перемещений
                    },
                    maintenanceRecords: {
                        orderBy: { date: 'desc' },
                        take: 3 // Последние 3 записи ТО
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.inventoryItem.count({ where })
        ]);

        return {
            items,
            total
        };
    }

    async findOne(id: string) {
        const item = await this.prisma.inventoryItem.findUnique({
            where: {
                id: parseInt(id),
                deletedAt: null
            },
            include: {
                movements: {
                    orderBy: { date: 'desc' }
                },
                maintenanceRecords: {
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!item) {
            throw new NotFoundException('Элемент инвентаря не найден');
        }

        return item;
    }

    async findByCode(code: string) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: {
                OR: [
                    { qrCode: code },
                    { barcode: code },
                    { serialNumber: code }
                ],
                deletedAt: null
            },
            include: {
                movements: {
                    orderBy: { date: 'desc' },
                    take: 5
                },
                maintenanceRecords: {
                    orderBy: { date: 'desc' },
                    take: 3
                }
            }
        });

        if (!item) {
            throw new NotFoundException('Элемент с указанным кодом не найден');
        }

        return item;
    }

    async update(id: string, updateInventoryItemDto: UpdateInventoryItemDto) {
        const existingItem = await this.findOne(id);

        const updateData: any = { ...updateInventoryItemDto };

        // Преобразование дат если они есть
        if (updateInventoryItemDto.purchaseDate) {
            updateData.purchaseDate = new Date(updateInventoryItemDto.purchaseDate);
        }
        if (updateInventoryItemDto.lastInventory) {
            updateData.lastInventory = new Date(updateInventoryItemDto.lastInventory);
        }

        return this.prisma.inventoryItem.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                movements: true,
                maintenanceRecords: true
            }
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Проверяем существование

        // Мягкое удаление
        await this.prisma.inventoryItem.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() }
        });

        return { message: 'Элемент инвентаря удален', id };
    }

    async createMovement(id: string, createMovementDto: CreateMovementDto) {
        const existingItem = await this.findOne(id);

        // Создаем запись о перемещении
        const movement = await this.prisma.inventoryMovement.create({
            data: {
                inventoryId: parseInt(id),
                fromLocation: createMovementDto.fromLocation || existingItem.location,
                toLocation: createMovementDto.toLocation,
                responsible: createMovementDto.responsible,
                reason: createMovementDto.reason,
                date: createMovementDto.date ? new Date(createMovementDto.date) : new Date()
            }
        });

        // Обновляем местоположение элемента
        const updatedItem = await this.prisma.inventoryItem.update({
            where: { id: parseInt(id) },
            data: {
                location: createMovementDto.toLocation,
                responsible: createMovementDto.responsible
            },
            include: {
                movements: {
                    orderBy: { date: 'desc' }
                },
                maintenanceRecords: true
            }
        });

        return updatedItem;
    }

    async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
        await this.findOne(id); // Проверяем существование

        return this.prisma.inventoryItem.update({
            where: { id: parseInt(id) },
            data: {
                status: updateStatusDto.status as any
            },
            include: {
                movements: true,
                maintenanceRecords: true
            }
        });
    }

    async createMaintenance(id: string, createMaintenanceDto: CreateMaintenanceDto) {
        await this.findOne(id); // Проверяем существование

        // Создаем запись о техобслуживании
        const maintenance = await this.prisma.inventoryMaintenance.create({
            data: {
                inventoryId: parseInt(id),
                date: new Date(createMaintenanceDto.date),
                provider: createMaintenanceDto.provider,
                description: createMaintenanceDto.description || 'Плановое техническое обслуживание',
                nextMaintenanceDate: createMaintenanceDto.nextMaintenanceDate ?
                    new Date(createMaintenanceDto.nextMaintenanceDate) : null,
                cost: createMaintenanceDto.cost || null
            }
        });

        // Обновляем расписание ТО в элементе (JSON поле)
        const updatedItem = await this.prisma.inventoryItem.update({
            where: { id: parseInt(id) },
            data: {
                maintenanceSchedule: {
                    lastMaintenance: createMaintenanceDto.date,
                    nextMaintenance: createMaintenanceDto.nextMaintenanceDate,
                    provider: createMaintenanceDto.provider
                }
            },
            include: {
                movements: true,
                maintenanceRecords: {
                    orderBy: { date: 'desc' }
                }
            }
        });

        return updatedItem;
    }

    async export(filters: InventoryFilterDto, format: string) {
        const { items } = await this.findAll(filters);

        // В реальном проекте здесь будет генерация файла Excel/CSV
        return {
            message: `Экспорт в формате ${format} подготовлен`,
            itemsCount: items.length,
            format,
            data: items.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                location: item.location,
                status: item.status,
                responsible: item.responsible,
                cost: item.cost,
                currentValue: item.currentValue,
                purchaseDate: item.purchaseDate,
                lastInventory: item.lastInventory
            }))
        };
    }

    // Дополнительные методы для аналитики
    async getAnalytics() {
        const [
            totalItems,
            statusDistribution,
            categoryDistribution,
            locationDistribution,
            maintenanceAlerts
        ] = await Promise.all([
            // Общее количество
            this.prisma.inventoryItem.count({
                where: { deletedAt: null }
            }),

            // Распределение по статусам
            this.prisma.inventoryItem.groupBy({
                by: ['status'],
                where: { deletedAt: null },
                _count: { status: true }
            }),

            // Распределение по категориям
            this.prisma.inventoryItem.groupBy({
                by: ['category'],
                where: { deletedAt: null },
                _count: { category: true },
                _sum: { currentValue: true }
            }),

            // Распределение по локациям
            this.prisma.inventoryItem.groupBy({
                by: ['location'],
                where: { deletedAt: null },
                _count: { location: true }
            }),

            // Предметы, требующие ТО (следующее ТО в течение 30 дней)
            this.prisma.inventoryItem.findMany({
                where: {
                    deletedAt: null,
                    status: 'ACTIVE',
                    // JSON запрос для проверки даты следующего ТО
                },
                include: {
                    maintenanceRecords: {
                        orderBy: { date: 'desc' },
                        take: 1
                    }
                },
                take: 10
            })
        ]);

        const totalValue = await this.prisma.inventoryItem.aggregate({
            where: { deletedAt: null },
            _sum: { currentValue: true }
        });

        return {
            totalItems,
            totalValue: totalValue._sum.currentValue || 0,
            statusDistribution: statusDistribution.map(item => ({
                status: item.status,
                count: item._count.status,
                percentage: ((item._count.status / totalItems) * 100).toFixed(1)
            })),
            categoryDistribution: categoryDistribution.map(item => ({
                name: item.category,
                count: item._count.category,
                value: item._sum.currentValue || 0
            })),
            locationDistribution: locationDistribution.map(item => ({
                location: item.location,
                count: item._count.location
            })),
            maintenanceAlerts
        };
    }
}
