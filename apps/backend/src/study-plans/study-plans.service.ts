import { Injectable, BadRequestException } from '@nestjs/common';
import { StudyPlan } from './entities/study-plan.entity';
import { PaginateResponseDto } from 'src/common/dtos/paginate.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudyPlanDto } from './dto/create-study-plan.dto';
import { UpdateStudyPlanDto } from './dto/update-study-plan-dto';
import { StudyPlanFilterDto } from './dto/study-plan-filter.dto';
import { Prisma } from 'generated/prisma';
import { ImportStudyPlanFileDto } from './dto/import-study-plan-file.dto';
import { AiAssistantService, KtpImportedStructure } from 'src/ai-assistant/ai-assistant.service';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { ImportProgressService } from './import-progress.service';

import { TenantConfigService } from '../common/tenant-config.service';

@Injectable()
export class StudyPlansService {
    private readonly prisma: PrismaService;
    private readonly aiAssistant: AiAssistantService;
    private readonly tenantConfig: TenantConfigService;

    constructor(
        prisma: PrismaService,
        aiAssistant: AiAssistantService,
        tenantConfig: TenantConfigService
    ) {
        this.prisma = prisma;
        this.aiAssistant = aiAssistant;
        this.tenantConfig = tenantConfig;
    }

    // Общий include для всех методов
    private getStudyPlanInclude() {
        return {
            teacher: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            surname: true,
                            middlename: true,
                            email: true,
                            phone: true,
                        }
                    }
                }
            },
            group: {
                select: {
                    id: true,
                    name: true,
                    courseNumber: true,
                }
            },
            lessons: {
                select: {
                    id: true,
                    name: true,
                    date: true,
                },
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    date: 'asc' as Prisma.SortOrder
                }
            },
            _count: {
                select: {
                    lessons: {
                        where: {
                            deletedAt: null,
                        }
                    }
                }
            }
        };
    }

    async findAll(filter: StudyPlanFilterDto, user?: any): Promise<PaginateResponseDto<StudyPlan>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'name',
            order = 'asc',
            search,
            teacherId,
            groupId
        } = filter;

        let where: Prisma.StudyPlanWhereInput = {
            deletedAt: null,
            ...(search && search.trim() && {
                OR: [
                    {
                        name: {
                            contains: search.trim(),
                            mode: 'insensitive',
                        }
                    },
                    {
                        description: {
                            contains: search.trim(),
                            mode: 'insensitive',
                        }
                    }
                ]
            }),
            ...(groupId && {
                group: {
                    some: {
                        id: groupId,
                    }
                }
            }),
            ...(teacherId && {
                teacher: {
                    userId: teacherId
                }
            }),
        };

        // Ограничение для TEACHER: показывать только свои учебные планы
        if (user?.role === 'TEACHER' && user?.id) {
            where = {
                ...where,
                teacher: {
                    user: {
                        id: user.id
                    }
                }
            };
        }

        const [data, totalItems] = await Promise.all([
            this.prisma.studyPlan.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: order },
                where,
                include: this.getStudyPlanInclude(),
            }),
            this.prisma.studyPlan.count({
                where,
            }),
        ]);

        return {
            data,
            meta: {
                totalItems,
                itemCount: data.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
            },
        };
    }

    async findOne(id: number): Promise<StudyPlan> {
        const studyPlan = await this.prisma.studyPlan.findUnique({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                surname: true,
                                middlename: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        courseNumber: true,
                    }
                },
                lessons: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        date: true,
                        materials: {
                            select: {
                                id: true,
                                lecture: true,
                                videoUrl: true,
                                presentationUrl: true,
                                quiz: {
                                    select: {
                                        id: true,
                                        name: true,
                                        isActive: true,
                                    }
                                }
                            }
                        },
                        homework: {
                            select: {
                                id: true,
                                name: true,
                                deadline: true,
                            }
                        }
                    },
                    where: {
                        deletedAt: null,
                    },
                    orderBy: {
                        date: 'asc'
                    }
                },
                schedules: {
                    select: {
                        id: true,
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true,
                        classroom: {
                            select: {
                                id: true,
                                name: true,
                                building: true,
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        lessons: {
                            where: {
                                deletedAt: null,
                            }
                        }
                    }
                }
            },
        });

        if (!studyPlan) {
            throw new Error(`Study Plan with ID ${id} not found`);
        }

        return studyPlan;
    }

    async create(createStudyPlanDto: CreateStudyPlanDto): Promise<StudyPlan> {
        const { groups, teacherId, ...rest } = createStudyPlanDto;

        // 1. Проверяем teacherId. Возможна путаница: передают userId вместо Teacher.id
        let resolvedTeacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!resolvedTeacher) {
            // Пробуем как userId
            resolvedTeacher = await this.prisma.teacher.findUnique({ where: { userId: teacherId } });
            if (!resolvedTeacher) {
                throw new BadRequestException(`Teacher not found. Provided teacherId=${teacherId} (не найден ни как Teacher.id, ни как userId).`);
            }
        }

        // 2. Проверяем группы
        const groupIds = groups?.map(g => g.id) || [];
        if (!groupIds.length) {
            throw new BadRequestException('At least one group id is required');
        }
        const existingGroups = await this.prisma.group.findMany({ where: { id: { in: groupIds } }, select: { id: true } });
        if (existingGroups.length !== groupIds.length) {
            const existingSet = new Set(existingGroups.map(g => g.id));
            const missing = groupIds.filter(id => !existingSet.has(id));
            throw new BadRequestException(`Some group ids do not exist: [${missing.join(', ')}]`);
        }

        try {
            const createdPlan = await this.prisma.studyPlan.create({
                data: {
                    ...rest,
                    teacherId: resolvedTeacher.id, // гарантированно Teacher.id
                    group: {
                        connect: groupIds.map(id => ({ id }))
                    }
                },
                include: {
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    surname: true,
                                    middlename: true,
                                    email: true,
                                    phone: true,
                                }
                            }
                        }
                    },
                    group: {
                        select: {
                            id: true,
                            name: true,
                            courseNumber: true,
                        }
                    },
                    lessons: {
                        select: {
                            id: true,
                            name: true,
                            date: true,
                        },
                        where: {
                            deletedAt: null,
                        },
                        orderBy: {
                            date: 'asc'
                        }
                    },
                    _count: {
                        select: {
                            lessons: {
                                where: {
                                    deletedAt: null,
                                }
                            }
                        }
                    }
                },
            });
            return createdPlan;
        } catch (e: any) {
            if (e.code === 'P2003') {
                throw new BadRequestException('Foreign key constraint failed (teacherId или group id неверны)');
            }
            throw e;
        }
    }

    async update(id: number, updateStudyPlanDto: UpdateStudyPlanDto): Promise<StudyPlan> {
        const existingStudyPlan = await this.prisma.studyPlan.findUnique({
            where: { id },
        });

        if (!existingStudyPlan) {
            throw new Error(`Study Plan with ID ${id} not found`);
        }
        const { groups, teacherId, ...rest } = updateStudyPlanDto;

        let resolvedTeacherId: number | undefined = undefined;
        if (teacherId !== undefined) {
            let t = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
            if (!t) t = await this.prisma.teacher.findUnique({ where: { userId: teacherId } });
            if (!t) throw new BadRequestException(`Teacher not found for teacherId=${teacherId}`);
            resolvedTeacherId = t.id;
        }

        const updatedPlan = await this.prisma.studyPlan.update({
            where: { id },
            data: {
                ...rest,
                ...(resolvedTeacherId !== undefined && { teacherId: resolvedTeacherId }),
                ...(groups && {
                    group: {
                        set: groups
                    }
                })
            },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                surname: true,
                                middlename: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        courseNumber: true,
                    }
                },
                lessons: {
                    select: {
                        id: true,
                        name: true,
                        date: true,
                    },
                    where: {
                        deletedAt: null,
                    },
                    orderBy: {
                        date: 'asc'
                    }
                },
                _count: {
                    select: {
                        lessons: {
                            where: {
                                deletedAt: null,
                            }
                        }
                    }
                }
            },
        });

        return updatedPlan;
    }

    async softRemove(id: number): Promise<StudyPlan> {
        const existingStudyPlan = await this.prisma.studyPlan.findUnique({
            where: { id },
        });

        if (!existingStudyPlan) {
            throw new Error(`Study Plan with ID ${id} not found`);
        }

        const deletedPlan = await this.prisma.studyPlan.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                surname: true,
                                middlename: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        courseNumber: true,
                    }
                },
                lessons: {
                    select: {
                        id: true,
                        name: true,
                        date: true,
                    },
                    where: {
                        deletedAt: null,
                    },
                    orderBy: {
                        date: 'asc'
                    }
                },
                _count: {
                    select: {
                        lessons: {
                            where: {
                                deletedAt: null,
                            }
                        }
                    }
                }
            },
        });

        return deletedPlan;
    }

    async findStudentStudyPlans(filter: StudyPlanFilterDto, userId: number): Promise<PaginateResponseDto<StudyPlan>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'name',
            order = 'asc',
            search
        } = filter;

        // Сначала находим студента по userId
        const student = await this.prisma.student.findUnique({
            where: { userId },
            select: { groupId: true }
        });

        if (!student) {
            throw new Error('Student not found');
        }

        const where: Prisma.StudyPlanWhereInput = {
            deletedAt: null,
            group: {
                some: {
                    id: student.groupId
                }
            },
            ...(search && search.trim() && {
                OR: [
                    {
                        name: {
                            contains: search.trim(),
                            mode: 'insensitive',
                        }
                    },
                    {
                        description: {
                            contains: search.trim(),
                            mode: 'insensitive',
                        }
                    }
                ]
            }),
            ...(filter.teacherId ? { teacherId: filter.teacherId } : {}),
        };

        const [data, totalItems] = await Promise.all([
            this.prisma.studyPlan.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: order },
                where,
                include: this.getStudyPlanInclude(),
            }),
            this.prisma.studyPlan.count({
                where,
            }),
        ]);

        return {
            data,
            meta: {
                totalItems,
                itemCount: data.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
            },
        };
    }

    async findParentChildrenStudyPlans(filter: StudyPlanFilterDto, userId: number): Promise<PaginateResponseDto<StudyPlan>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'name',
            order = 'asc',
            search
        } = filter;

        // Сначала находим родителя и его детей
        const parent = await this.prisma.parent.findUnique({
            where: { userId },
            include: {
                students: {
                    select: {
                        groupId: true
                    }
                }
            }
        });

        if (!parent) {
            throw new Error('Parent not found');
        }

        // Получаем ID групп всех детей
        const childrenGroupIds = parent.students
            .map(student => student.groupId)
            .filter(Boolean);

        if (childrenGroupIds.length === 0) {
            return {
                data: [],
                meta: {
                    totalItems: 0,
                    itemCount: 0,
                    itemsPerPage: limit,
                    totalPages: 0,
                    currentPage: page,
                },
            };
        }

        const where: Prisma.StudyPlanWhereInput = {
            deletedAt: null,
            group: {
                some: {
                    id: {
                        in: childrenGroupIds
                    }
                }
            },
            ...(search && search.trim() && {
                OR: [
                    {
                        name: {
                            contains: search.trim(),
                            mode: 'insensitive',
                        }
                    },
                    {
                        description: {
                            contains: search.trim(),
                            mode: 'insensitive',
                        }
                    }
                ]
            }),
        };

        const [data, totalItems] = await Promise.all([
            this.prisma.studyPlan.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: order },
                where,
                include: this.getStudyPlanInclude(),
            }),
            this.prisma.studyPlan.count({
                where,
            }),
        ]);

        return {
            data,
            meta: {
                totalItems,
                itemCount: data.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
            },
        };
    }

    /**
     * Импорт учебного плана и КТП из загруженного файла (docx/pdf)
     * Шаги:
     * 1. Извлечь текст
     * 2. Отправить в AI для структурирования
     * 3. Создать StudyPlan
     * 4. Создать Lessons
     * 5. Создать CurriculumPlan
     */
    async importFromFile(file: Express.Multer.File, dto: ImportStudyPlanFileDto) {
        if (!file) {
            throw new BadRequestException('Файл обязателен');
        }
        const { teacherId, groupIds, name, description } = dto;

        // Resolve teacher (как в create)
        let resolvedTeacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!resolvedTeacher) {
            resolvedTeacher = await this.prisma.teacher.findUnique({ where: { userId: teacherId } });
            if (!resolvedTeacher) {
                throw new BadRequestException(`Teacher not found. Provided teacherId=${teacherId}`);
            }
        }

        if (!groupIds?.length) {
            throw new BadRequestException('groupIds required');
        }
        const existingGroups = await this.prisma.group.findMany({
            where: { id: { in: groupIds } },
            select: { id: true }
        });
        if (existingGroups.length !== groupIds.length) {
            const existingSet = new Set(existingGroups.map(g => g.id));
            const missing = groupIds.filter(id => !existingSet.has(id));
            throw new BadRequestException(`Some group ids do not exist: [${missing.join(', ')}]`);
        }

        // Extract raw text
        const rawText = await this.extractPlainText(file);
        if (!rawText || rawText.trim().length < 20) {
            throw new BadRequestException('Не удалось извлечь текст из файла или он слишком короткий');
        }

        // AI parse
        let structured: KtpImportedStructure;
        try {
            structured = await this.aiAssistant.parseKtpRawText(rawText);
        } catch (e: any) {
            throw new BadRequestException(`AI_PARSE_FAILED: ${e.message || e}`);
        }

        const planName = name || structured.courseName || 'Imported Plan';
        const planDescription = description || structured.description || null;

        // Create StudyPlan
        const studyPlan = await this.prisma.studyPlan.create({
            data: {
                name: planName,
                description: planDescription,
                teacherId: resolvedTeacher.id,
                group: {
                    connect: groupIds.map(id => ({ id }))
                }
            },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                surname: true,
                                middlename: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        courseNumber: true
                    }
                }
            }
        });

        // Create lessons
        let lessonCounter = 0;
        for (const section of structured.sections || []) {
            for (const l of section.lessons || []) {
                lessonCounter++;
                await this.prisma.lesson.create({
                    data: {
                        name: l.title || `Lesson ${lessonCounter}`,
                        description: l.description || null,
                        date: l.date ? new Date(l.date) : new Date(), // временно текущая дата если нет
                        studyPlanId: studyPlan.id,
                        type: 'REGULAR'
                    }
                });
            }
        }

        // Build plannedLessons structure for CurriculumPlan
        const plannedSections = (structured.sections || []).map((s, sIdx) => ({
            sectionId: sIdx + 1,
            sectionTitle: s.title || `Раздел ${sIdx + 1}`,
            sectionDescription: s.description || '',
            totalHours: (s.lessons || []).reduce((acc, l) => acc + (l.duration || 2), 0),
            lessons: (s.lessons || []).map((l, idx) => ({
                id: idx + 1,
                title: l.title || `Урок ${idx + 1}`,
                description: l.description || '',
                duration: l.duration || 2,
                week: l.week || Math.floor(idx / 2) + 1,
                date: l.date || null,
                status: 'planned',
                materials: l.materials || [],
                objectives: l.objectives || [],
                methods: l.methods || [],
                assessment: null,
                homework: l.homework || null
            }))
        }));

        const totalLessons = plannedSections.reduce((sum, sec) => sum + sec.lessons.length, 0);

        const curriculumPlan = await this.prisma.curriculumPlan.create({
            data: {
                studyPlanId: studyPlan.id,
                totalLessons,
                plannedLessons: plannedSections as any,
                actualLessons: [],
                completionRate: 0
            }
        });

        return {
            studyPlanId: studyPlan.id,
            curriculumPlanId: curriculumPlan.id,
            totalLessons
        };
    }

    private async extractPlainText(file: Express.Multer.File): Promise<string | null> {
        const mime = file.mimetype.toLowerCase();
        const buf = file.buffer;
        try {
            if (mime.includes('pdf')) {
                const pdf = await pdfParse(buf);
                return pdf.text;
            }
            if (mime.includes('openxmlformats-officedocument.wordprocessingml') ||
                mime.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                const docx = await mammoth.extractRawText({ buffer: buf });
                return docx.value;
            }
            if (mime.startsWith('text/')) {
                return buf.toString('utf-8');
            }
        } catch {
            return null;
        }
        return null;
    }

    /**
     * Асинхронная версия импорта с обновлением прогресса
     */
    async importFromFileWithProgress(
        jobId: string,
        progress: ImportProgressService,
        file: Express.Multer.File,
        dto: ImportStudyPlanFileDto
    ) {
        try {
            // upload уже active. Отмечаем завершён
            progress.setStepStatus(jobId, 'upload', 'done');
            progress.setStepStatus(jobId, 'extract', 'active');

            if (!file) {
                throw new BadRequestException('Файл обязателен');
            }
            const { teacherId, groupIds, name, description } = dto;

            // Resolve teacher
            let resolvedTeacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
            if (!resolvedTeacher) {
                resolvedTeacher = await this.prisma.teacher.findUnique({ where: { userId: teacherId } });
                if (!resolvedTeacher) {
                    throw new BadRequestException(`Teacher not found. Provided teacherId=${teacherId}`);
                }
            }

            if (!groupIds?.length) {
                throw new BadRequestException('groupIds required');
            }
            const existingGroups = await this.prisma.group.findMany({
                where: { id: { in: groupIds } },
                select: { id: true }
            });
            if (existingGroups.length !== groupIds.length) {
                const existingSet = new Set(existingGroups.map(g => g.id));
                const missing = groupIds.filter(id => !existingSet.has(id));
                throw new BadRequestException(`Some group ids do not exist: [${missing.join(', ')}]`);
            }

            // Extract
            const rawText = await this.extractPlainText(file);
            if (!rawText || rawText.trim().length < 20) {
                throw new BadRequestException('Не удалось извлечь текст из файла или он слишком короткий');
            }
            progress.setStepStatus(jobId, 'extract', 'done');
            progress.setStepStatus(jobId, 'ai', 'active');

            // AI parse
            let structured: KtpImportedStructure;
            try {
                structured = await this.aiAssistant.parseKtpRawText(rawText);
            } catch (e: any) {
                throw new BadRequestException(`AI_PARSE_FAILED: ${e.message || e}`);
            }
            progress.setStepStatus(jobId, 'ai', 'done');
            progress.setStepStatus(jobId, 'plan', 'active');

            const planName = name || structured.courseName || 'Imported Plan';
            const planDescription = description || structured.description || null;

            // Create StudyPlan
            const studyPlan = await this.prisma.studyPlan.create({
                data: {
                    name: planName,
                    description: planDescription,
                    teacherId: resolvedTeacher.id,
                    group: {
                        connect: groupIds.map(id => ({ id }))
                    }
                }
            });

            progress.setStepStatus(jobId, 'plan', 'done');
            progress.setStepStatus(jobId, 'lessons', 'active');

            // Create lessons
            let lessonCounter = 0;
            for (const section of structured.sections || []) {
                for (const l of section.lessons || []) {
                    lessonCounter++;
                    await this.prisma.lesson.create({
                        data: {
                            name: l.title || `Lesson ${lessonCounter}`,
                            description: l.description || null,
                            date: l.date ? new Date(l.date) : new Date(),
                            studyPlanId: studyPlan.id,
                            type: 'REGULAR'
                        }
                    });
                }
            }

            progress.setStepStatus(jobId, 'lessons', 'done');
            progress.setStepStatus(jobId, 'curriculum', 'active');

            // Build plannedLessons structure for CurriculumPlan
            const plannedSections = (structured.sections || []).map((s, sIdx) => ({
                sectionId: sIdx + 1,
                sectionTitle: s.title || `Раздел ${sIdx + 1}`,
                sectionDescription: s.description || '',
                totalHours: (s.lessons || []).reduce((acc, l) => acc + (l.duration || 2), 0),
                lessons: (s.lessons || []).map((l, idx) => ({
                    id: idx + 1,
                    title: l.title || `Урок ${idx + 1}`,
                    description: l.description || '',
                    duration: l.duration || 2,
                    week: l.week || Math.floor(idx / 2) + 1,
                    date: l.date || null,
                    status: 'planned',
                    materials: l.materials || [],
                    objectives: l.objectives || [],
                    methods: l.methods || [],
                    assessment: null,
                    homework: l.homework || null
                }))
            }));

            const totalLessons = plannedSections.reduce((sum, sec) => sum + sec.lessons.length, 0);

            const curriculumPlan = await this.prisma.curriculumPlan.create({
                data: {
                    studyPlanId: studyPlan.id,
                    totalLessons,
                    plannedLessons: plannedSections as any,
                    actualLessons: [],
                    completionRate: 0
                }
            });

            progress.setStepStatus(jobId, 'curriculum', 'done');
            progress.setStepStatus(jobId, 'finish', 'active');

            progress.complete(jobId, {
                studyPlanId: studyPlan.id,
                curriculumPlanId: curriculumPlan.id,
                totalLessons
            });
        } catch (e: any) {
            progress.fail(jobId, e.message || 'IMPORT_FAILED');
        }
    }
}
