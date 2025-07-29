import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { DocumentType } from './dto/create-document.dto';

@Injectable()
export class TemplatesService {
    constructor(private prisma: PrismaService) { }

    create(createTemplateDto: CreateTemplateDto, userId: number) {
        return this.prisma.documentTemplate.create({
            data: {
                ...createTemplateDto,
                createdById: userId,
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, surname: true }
                }
            }
        });
    }

    findAll(type?: DocumentType) {
        const where: any = { isActive: true };

        if (type) {
            where.type = type;
        }

        return this.prisma.documentTemplate.findMany({
            where,
            include: {
                createdBy: {
                    select: { id: true, name: true, surname: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        const template = await this.prisma.documentTemplate.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: { id: true, name: true, surname: true }
                }
            }
        });

        if (!template) {
            throw new NotFoundException('Шаблон не найден');
        }

        return template;
    }

    async update(id: string, updateTemplateDto: Partial<CreateTemplateDto>) {
        await this.findOne(id);

        return this.prisma.documentTemplate.update({
            where: { id },
            data: updateTemplateDto,
            include: {
                createdBy: {
                    select: { id: true, name: true, surname: true }
                }
            }
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.documentTemplate.delete({
            where: { id }
        });
    }

    // Метод для рендеринга шаблона с данными
    async renderTemplate(templateId: string, data: any): Promise<string> {
        const template = await this.findOne(templateId);

        let content = template.content;

        // Простая замена переменных вида {{variable.path}}
        const variableRegex = /\{\{([^}]+)\}\}/g;

        content = content.replace(variableRegex, (match, variablePath) => {
            const value = this.getNestedValue(data, variablePath.trim());
            return value !== undefined ? String(value) : match;
        });

        return content;
    }

    // Создание базовых шаблонов
    async createDefaultTemplates(userId: number) {
        const templates = [
            {
                name: 'Справка об обучении',
                type: DocumentType.STUDENT_CERTIFICATE,
                content: `
          <div class="document">
            <div class="header">
              <h2>СПРАВКА ОБ ОБУЧЕНИИ</h2>
            </div>
            <div class="content">
              <p>Выдана {{student.name}} {{student.surname}}</p>
              <p>о том, что он(а) обучается в {{group.name}}</p>
              <p>с {{enrollment.date}} по настоящее время</p>
              <br>
              <p>Справка выдана для предоставления {{purpose}}</p>
              <br>
              <p>Дата выдачи: {{current.date}}</p>
            </div>
            <div class="footer">
              <p>Директор ________________</p>
            </div>
          </div>
        `,
                variables: {
                    'student.name': 'Имя студента',
                    'student.surname': 'Фамилия студента',
                    'group.name': 'Название группы',
                    'enrollment.date': 'Дата зачисления',
                    'purpose': 'Цель предоставления',
                    'current.date': 'Текущая дата'
                }
            },
            {
                name: 'Приказ о зачислении',
                type: DocumentType.ENROLLMENT_ORDER,
                content: `
          <div class="document">
            <div class="header">
              <h2>ПРИКАЗ № {{document.number}}</h2>
              <h3>О зачислении студента</h3>
            </div>
            <div class="content">
              <p>На основании заявления и документов об образовании</p>
              <p><strong>ПРИКАЗЫВАЮ:</strong></p>
              <p>1. Зачислить {{student.name}} {{student.surname}}</p>
              <p>в группу {{group.name}}</p>
              <p>с {{enrollment.date}}</p>
              <br>
              <p>2. Контроль за исполнением приказа возложить на {{responsible}}</p>
            </div>
            <div class="footer">
              <p>Директор ________________</p>
              <p>Дата: {{current.date}}</p>
            </div>
          </div>
        `,
                variables: {
                    'document.number': 'Номер приказа',
                    'student.name': 'Имя студента',
                    'student.surname': 'Фамилия студента',
                    'group.name': 'Название группы',
                    'enrollment.date': 'Дата зачисления',
                    'responsible': 'Ответственный',
                    'current.date': 'Текущая дата'
                }
            },
            {
                name: 'Административный приказ',
                type: DocumentType.ADMINISTRATIVE_ORDER,
                content: `
          <div class="document">
            <div class="header">
              <h2>ПРИКАЗ № {{document.number}}</h2>
              <h3>{{document.title}}</h3>
            </div>
            <div class="content">
              <p>{{document.content}}</p>
            </div>
            <div class="footer">
              <p>Директор ________________</p>
              <p>Дата: {{current.date}}</p>
            </div>
          </div>
        `,
                variables: {
                    'document.number': 'Номер приказа',
                    'document.title': 'Заголовок приказа',
                    'document.content': 'Содержание приказа',
                    'current.date': 'Текущая дата'
                }
            }
        ];

        const results = [];
        for (const template of templates) {
            try {
                const existing = await this.prisma.documentTemplate.findFirst({
                    where: { name: template.name, type: template.type }
                });

                if (!existing) {
                    const created = await this.create(template as CreateTemplateDto, userId);
                    results.push(created);
                }
            } catch (error) {
                console.error(`Ошибка создания шаблона ${template.name}:`, error);
            }
        }

        return results;
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
}
