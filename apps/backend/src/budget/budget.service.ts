import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';

@Injectable()
export class BudgetService {
    constructor(private prisma: PrismaService) { }

    create(createBudgetItemDto: CreateBudgetItemDto) {
        return this.prisma.budgetItem.create({
            data: {
                ...createBudgetItemDto,
                currency: createBudgetItemDto.currency || 'KZT',
            },
        });
    }

    async findAll(filters?: {
        period?: string;
        type?: string;
        category?: string;
        status?: string;
        responsible?: string;
    }) {
        const where: any = {
            deletedAt: null,
        };

        if (filters?.period) {
            where.period = filters.period;
        }
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.category) {
            where.category = filters.category;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.responsible) {
            where.responsible = filters.responsible;
        }

        const items = await this.prisma.budgetItem.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        // Вычисляем статистику
        const summary = this.calculateSummary(items);

        return {
            items,
            summary,
        };
    }

    async findOne(id: number) {
        const item = await this.prisma.budgetItem.findFirst({
            where: { id, deletedAt: null },
        });

        if (!item) {
            throw new NotFoundException(`Budget item with ID ${id} not found`);
        }

        return item;
    }

    async update(id: number, updateBudgetItemDto: UpdateBudgetItemDto) {
        await this.findOne(id); // Проверяем существование

        return this.prisma.budgetItem.update({
            where: { id },
            data: updateBudgetItemDto,
        });
    }

    async remove(id: number) {
        await this.findOne(id); // Проверяем существование

        return this.prisma.budgetItem.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async getAnalytics(period: string) {
        const items = await this.prisma.budgetItem.findMany({
            where: {
                period,
                deletedAt: null,
            },
        });

        const income = items.filter(item => item.type === 'INCOME');
        const expense = items.filter(item => item.type === 'EXPENSE');

        // Группируем по категориям
        const incomeByCategory = this.groupByCategory(income);
        const expenseByCategory = this.groupByCategory(expense);

        return {
            currentPeriod: {
                income: {
                    planned: income.reduce((sum, item) => sum + item.plannedAmount, 0),
                    actual: income.reduce((sum, item) => sum + item.actualAmount, 0),
                    variance: income.reduce((sum, item) => sum + (item.actualAmount - item.plannedAmount), 0),
                    byCategory: incomeByCategory,
                },
                expense: {
                    planned: expense.reduce((sum, item) => sum + item.plannedAmount, 0),
                    actual: expense.reduce((sum, item) => sum + item.actualAmount, 0),
                    variance: expense.reduce((sum, item) => sum + (item.actualAmount - item.plannedAmount), 0),
                    byCategory: expenseByCategory,
                },
                balance: {
                    planned: income.reduce((sum, item) => sum + item.plannedAmount, 0) -
                        expense.reduce((sum, item) => sum + item.plannedAmount, 0),
                    actual: income.reduce((sum, item) => sum + item.actualAmount, 0) -
                        expense.reduce((sum, item) => sum + item.actualAmount, 0),
                    variance: income.reduce((sum, item) => sum + (item.actualAmount - item.plannedAmount), 0) -
                        expense.reduce((sum, item) => sum + (item.actualAmount - item.plannedAmount), 0),
                },
            },
        };
    }

    closePeriod(period: string, notes?: string) {
        return this.prisma.budgetItem.updateMany({
            where: {
                period,
                status: { in: ['PENDING', 'ACTIVE'] },
                deletedAt: null,
            },
            data: {
                status: 'CLOSED',
            },
        });
    }

    private calculateSummary(items: any[]) {
        const income = items.filter(item => item.type === 'INCOME');
        const expense = items.filter(item => item.type === 'EXPENSE');

        const totalPlannedIncome = income.reduce((sum, item) => sum + item.plannedAmount, 0);
        const totalActualIncome = income.reduce((sum, item) => sum + item.actualAmount, 0);
        const totalPlannedExpense = expense.reduce((sum, item) => sum + item.plannedAmount, 0);
        const totalActualExpense = expense.reduce((sum, item) => sum + item.actualAmount, 0);

        return {
            totalPlannedIncome,
            totalActualIncome,
            totalPlannedExpense,
            totalActualExpense,
            plannedBalance: totalPlannedIncome - totalPlannedExpense,
            actualBalance: totalActualIncome - totalActualExpense,
            incomeVariance: totalActualIncome - totalPlannedIncome,
            expenseVariance: totalActualExpense - totalPlannedExpense,
        };
    }

    private groupByCategory(items: any[]) {
        const result: Record<string, any> = {};

        items.forEach(item => {
            if (!result[item.category]) {
                result[item.category] = {
                    planned: 0,
                    actual: 0,
                    variance: 0,
                };
            }

            result[item.category].planned += item.plannedAmount;
            result[item.category].actual += item.actualAmount;
            result[item.category].variance += (item.actualAmount - item.plannedAmount);
        });

        return result;
    }
}
