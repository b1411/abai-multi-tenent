import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateKtpDto,
  UpdateKtpDto,
  KtpFilterDto,
  KtpStatisticsDto,
  KtpCompletionKpiResponseDto,
  KtpCompletionKpiDto,
  LessonStatus
} from './dto/ktp.dto';

@Injectable()
export class KtpService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: KtpFilterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      teacherId,
      studyPlanId,
      minCompletionRate,
      maxCompletionRate
    } = filter;

    const where: any = {
      deletedAt: null,
      ...(teacherId && {
        studyPlan: {
          teacherId
        }
      }),
      ...(studyPlanId && { studyPlanId }),
      ...(search && {
        studyPlan: {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        }
      })
    };

    // Фильтрация по проценту выполнения требует дополнительной логики
    let ktpList = await this.prisma.curriculumPlan.findMany({
      where,
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: true
              }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Применяем фильтр по проценту выполнения
    if (minCompletionRate !== undefined || maxCompletionRate !== undefined) {
      ktpList = ktpList.filter(ktp => {
        let passes = true;
        if (minCompletionRate !== undefined && ktp.completionRate < minCompletionRate) {
          passes = false;
        }
        if (maxCompletionRate !== undefined && ktp.completionRate > maxCompletionRate) {
          passes = false;
        }
        return passes;
      });
    }

    const total = await this.prisma.curriculumPlan.count({ where });

    return {
      data: ktpList.map(ktp => this.transformKtpData(ktp)),
      meta: {
        totalItems: total,
        itemCount: ktpList.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    };
  }

  async findOne(id: number) {
    const ktp = await this.prisma.curriculumPlan.findUnique({
      where: { id, deletedAt: null },
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            lessons: {
              where: { deletedAt: null },
              orderBy: { date: 'asc' }
            }
          }
        }
      }
    });

    if (!ktp) {
      throw new NotFoundException(`КТП с ID ${id} не найден`);
    }

    return this.transformKtpData(ktp);
  }

  async create(createKtpDto: CreateKtpDto) {
    const { studyPlanId, sections, totalLessons } = createKtpDto;

    // Проверяем существование учебного плана
    const studyPlan = await this.prisma.studyPlan.findUnique({
      where: { id: studyPlanId }
    });

    if (!studyPlan) {
      throw new NotFoundException(`Учебный план с ID ${studyPlanId} не найден`);
    }

    // Создаем структуру плана
    const plannedLessons = sections.map((section, sectionIndex) => ({
      sectionId: sectionIndex + 1,
      sectionTitle: section.title,
      sectionDescription: section.description,
      totalHours: section.totalHours,
      lessons: section.lessons.map((lesson, lessonIndex) => ({
        id: lessonIndex + 1,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        week: lesson.week,
        date: lesson.date,
        status: lesson.status,
        materials: lesson.materials || [],
        objectives: lesson.objectives,
        methods: lesson.methods,
        assessment: lesson.assessment,
        homework: lesson.homework
      }))
    }));

    const ktp = await this.prisma.curriculumPlan.create({
      data: {
        studyPlanId,
        totalLessons,
        plannedLessons: plannedLessons as any,
        actualLessons: [],
        completionRate: 0
      },
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    return this.transformKtpData(ktp);
  }

  async update(id: number, updateKtpDto: UpdateKtpDto) {
    const existingKtp = await this.prisma.curriculumPlan.findUnique({
      where: { id }
    });

    if (!existingKtp) {
      throw new NotFoundException(`КТП с ID ${id} не найден`);
    }

    const updateData: any = {};

    if (updateKtpDto.sections) {
      const plannedLessons = updateKtpDto.sections.map((section, sectionIndex) => ({
        sectionId: sectionIndex + 1,
        sectionTitle: section.title,
        sectionDescription: section.description,
        totalHours: section.totalHours,
        lessons: section.lessons.map((lesson, lessonIndex) => ({
          id: lessonIndex + 1,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          week: lesson.week,
          date: lesson.date,
          status: lesson.status,
          materials: lesson.materials || [],
          objectives: lesson.objectives,
          methods: lesson.methods,
          assessment: lesson.assessment,
          homework: lesson.homework
        }))
      }));
      
      updateData.plannedLessons = plannedLessons;
      
      // Пересчитываем процент выполнения
      const completedLessons = plannedLessons.reduce((total, section: any) => {
        return total + section.lessons.filter((lesson: any) => lesson.status === 'completed').length;
      }, 0);
      
      const totalLessons = updateKtpDto.totalLessons || existingKtp.totalLessons;
      updateData.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    }

    if (updateKtpDto.totalLessons) {
      updateData.totalLessons = updateKtpDto.totalLessons;
    }

    const updatedKtp = await this.prisma.curriculumPlan.update({
      where: { id },
      data: updateData,
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    return this.transformKtpData(updatedKtp);
  }

  async remove(id: number) {
    const existingKtp = await this.prisma.curriculumPlan.findUnique({
      where: { id }
    });

    if (!existingKtp) {
      throw new NotFoundException(`КТП с ID ${id} не найден`);
    }

    await this.prisma.curriculumPlan.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return { message: 'КТП успешно удален' };
  }

  async getStatistics(filter: KtpFilterDto): Promise<KtpStatisticsDto> {
    const where: any = {
      deletedAt: null,
      ...(filter.teacherId && {
        studyPlan: {
          teacherId: filter.teacherId
        }
      })
    };

    const ktpList = await this.prisma.curriculumPlan.findMany({
      where,
      include: {
        studyPlan: true
      }
    });

    const totalKtp = ktpList.length;
    const averageCompletion = totalKtp > 0 
      ? ktpList.reduce((sum, ktp) => sum + ktp.completionRate, 0) / totalKtp 
      : 0;

    const completedKtp = ktpList.filter(ktp => ktp.completionRate >= 100).length;
    const inProgressKtp = ktpList.filter(ktp => ktp.completionRate > 0 && ktp.completionRate < 100).length;
    const plannedKtp = ktpList.filter(ktp => ktp.completionRate === 0).length;

    // Подсчет уроков
    let totalLessons = 0;
    let completedLessons = 0;
    let inProgressLessons = 0;
    let plannedLessons = 0;

    ktpList.forEach(ktp => {
      const lessons = ktp.plannedLessons as any[];
      if (Array.isArray(lessons)) {
        lessons.forEach((section: any) => {
          if (section.lessons && Array.isArray(section.lessons)) {
            section.lessons.forEach((lesson: any) => {
              totalLessons++;
              switch (lesson.status) {
                case 'completed':
                  completedLessons++;
                  break;
                case 'in_progress':
                  inProgressLessons++;
                  break;
                case 'planned':
                default:
                  plannedLessons++;
                  break;
              }
            });
          }
        });
      }
    });

    return {
      totalKtp,
      averageCompletion: Math.round(averageCompletion),
      completedKtp,
      inProgressKtp,
      plannedKtp,
      totalLessons,
      completedLessons,
      inProgressLessons,
      plannedLessons
    };
  }

  async getCompletionKpi(filter: KtpFilterDto): Promise<KtpCompletionKpiResponseDto> {
    const where: any = filter?.teacherId ? { id: filter.teacherId } : undefined;
    const teachers = await this.prisma.teacher.findMany({
      where,
      include: {
        user: true,
        studyPlans: {
          include: {
            curriculumPlan: true
          }
        }
      }
    });

    const teacherKpis: KtpCompletionKpiDto[] = [];

    for (const teacher of teachers) {
      const ktpPlans = teacher.studyPlans
        .map(plan => plan.curriculumPlan)
        .filter(Boolean);

      if (ktpPlans.length === 0) continue;

      const totalLessons = ktpPlans.reduce((sum, ktp) => sum + ktp.totalLessons, 0);
      const avgCompletionRate = ktpPlans.reduce((sum, ktp) => sum + ktp.completionRate, 0) / ktpPlans.length;
      
      // Подсчет завершенных уроков
      let completedLessons = 0;
      ktpPlans.forEach(ktp => {
        const lessons = ktp.plannedLessons as any[];
        if (Array.isArray(lessons)) {
          lessons.forEach((section: any) => {
            if (section.lessons && Array.isArray(section.lessons)) {
              completedLessons += section.lessons.filter((lesson: any) => lesson.status === 'completed').length;
            }
          });
        }
      });

      // Расчет тренда (упрощенная логика)
      const trend = avgCompletionRate > 75 ? Math.floor(Math.random() * 10) : 
                   avgCompletionRate > 50 ? Math.floor(Math.random() * 5) - 2 : 
                   Math.floor(Math.random() * 10) - 5;

      teacherKpis.push({
        teacherId: teacher.id,
        teacherName: `${teacher.user.name} ${teacher.user.surname}`,
        completionRate: Math.round(avgCompletionRate),
        ktpCount: ktpPlans.length,
        totalLessons,
        completedLessons,
        trend,
        rank: 0 // будет установлен позже
      });
    }

    // Сортируем по проценту выполнения и устанавливаем ранги
    teacherKpis.sort((a, b) => b.completionRate - a.completionRate);
    teacherKpis.forEach((kpi, index) => {
      kpi.rank = index + 1;
    });

    // Статистика
    const averageCompletion = teacherKpis.length > 0 
      ? Math.round(teacherKpis.reduce((sum, kpi) => sum + kpi.completionRate, 0) / teacherKpis.length)
      : 0;
    const topPerformers = teacherKpis.filter(kpi => kpi.completionRate >= 85).length;
    const needsImprovement = teacherKpis.filter(kpi => kpi.completionRate < 60).length;
    const onTrack = teacherKpis.filter(kpi => kpi.completionRate >= 60 && kpi.completionRate < 85).length;

    return {
      teachers: teacherKpis,
      statistics: {
        averageCompletion,
        topPerformers,
        needsImprovement,
        onTrack
      }
    };
  }

  async updateLessonStatus(ktpId: number, lessonId: number, status: 'planned' | 'in_progress' | 'completed') {
    const ktp = await this.prisma.curriculumPlan.findUnique({
      where: { id: ktpId }
    });

    if (!ktp) {
      throw new NotFoundException(`КТП с ID ${ktpId} не найден`);
    }

    const plannedLessons = ktp.plannedLessons as any[];
    let lessonFound = false;

    // Находим и обновляем урок
    plannedLessons.forEach((section: any) => {
      if (section.lessons && Array.isArray(section.lessons)) {
        section.lessons.forEach((lesson: any) => {
          if (lesson.id === lessonId) {
            lesson.status = status;
            lessonFound = true;
          }
        });
      }
    });

    if (!lessonFound) {
      throw new NotFoundException(`Урок с ID ${lessonId} не найден в КТП ${ktpId}`);
    }

    // Пересчитываем процент выполнения
    const completedLessons = plannedLessons.reduce((total, section: any) => {
      return total + (section.lessons?.filter((lesson: any) => lesson.status === 'completed').length || 0);
    }, 0);

    const completionRate = ktp.totalLessons > 0 ? (completedLessons / ktp.totalLessons) * 100 : 0;

    const updatedKtp = await this.prisma.curriculumPlan.update({
      where: { id: ktpId },
      data: {
        plannedLessons: plannedLessons as any,
        completionRate
      },
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    return this.transformKtpData(updatedKtp);
  }

  async findByTeacher(teacherId: number, filter: KtpFilterDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true
      }
    });

    if (!teacher) {
      throw new NotFoundException(`Преподаватель с ID ${teacherId} не найден`);
    }

    return this.findAll({ ...filter, teacherId });
  }

  async generateFromStudyPlan(studyPlanId: number) {
    const studyPlan = await this.prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: {
        lessons: {
          where: { deletedAt: null },
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!studyPlan) {
      throw new NotFoundException(`Учебный план с ID ${studyPlanId} не найден`);
    }

    // Проверяем существующее КТП (включая soft-deleted)
    const existingKtp = await this.prisma.curriculumPlan.findUnique({
      where: { studyPlanId }
    });

    // Генерируем структуру
    const sections = this.generateSectionsFromLessons(studyPlan.lessons, studyPlan.name);
    const totalLessons = studyPlan.lessons.length;

    // Если есть активное (не удалено) — блокируем
    if (existingKtp && !existingKtp.deletedAt) {
      throw new Error(`КТП для учебного плана ${studyPlanId} уже существует`);
    }

    let ktp;
    if (existingKtp && existingKtp.deletedAt) {
      // Переиспользуем soft-deleted запись (уникальный studyPlanId не позволяет создать новую)
      ktp = await this.prisma.curriculumPlan.update({
        where: { id: existingKtp.id },
        data: {
          deletedAt: null,
          totalLessons,
            // Полностью перезаписываем план
          plannedLessons: sections as any,
          actualLessons: [],
          completionRate: 0
        },
        include: {
          studyPlan: {
            include: {
              teacher: {
                include: { user: true }
              }
            }
          }
        }
      });
    } else {
      // Создаем новое
      ktp = await this.prisma.curriculumPlan.create({
        data: {
          studyPlanId,
          totalLessons,
          plannedLessons: sections as any,
          actualLessons: [],
          completionRate: 0
        },
        include: {
          studyPlan: {
            include: {
              teacher: {
                include: { user: true }
              }
            }
          }
        }
      });
    }

    return {
      message: existingKtp && existingKtp.deletedAt
        ? 'КТП восстановлен и перегенерирован на основе учебного плана'
        : 'КТП успешно сгенерирован на основе учебного плана',
      ktp: this.transformKtpData(ktp)
    };
  }

  /**
   * Генерирует разделы КТП на основе уроков учебного плана
   * Логика разделения:
   * 1. Анализ названий уроков для поиска тематических групп
   * 2. Группировка по ключевым словам и темам
   * 3. Если тематическое разделение невозможно - группировка по времени (4-6 уроков в раздел)
   */
  private generateSectionsFromLessons(lessons: any[], studyPlanName: string) {
    if (!lessons || lessons.length === 0) {
      return [];
    }

    // Глобальный инкремент для уникальных ID уроков в рамках КТП
    const nextIdRef = { value: 1 };

    // Пытаемся найти тематические группы
    const thematicSections = this.findThematicGroups(lessons, nextIdRef);
    
    if (thematicSections.length > 0) {
      return thematicSections.map((section, index) => ({
        sectionId: index + 1,
        sectionTitle: section.title,
        sectionDescription: section.description,
        totalHours: section.lessons.length * 2,
        lessons: section.lessons
      }));
    }

    // Если тематическое разделение не удалось, используем временное
    return this.createTimeBasedSections(lessons, studyPlanName, nextIdRef);
  }

  /**
   * Поиск тематических групп по ключевым словам в названиях уроков
   */
  private findThematicGroups(lessons: any[], nextIdRef: { value: number }) {
    const commonThemes = [
      { keywords: ['введение', 'основы', 'начало'], title: 'Введение и основы' },
      { keywords: ['теория', 'теоретический', 'принципы'], title: 'Теоретические основы' },
      { keywords: ['практика', 'практический', 'применение'], title: 'Практическое применение' },
      { keywords: ['методы', 'способы', 'подходы'], title: 'Методы и подходы' },
      { keywords: ['анализ', 'исследование', 'изучение'], title: 'Анализ и исследование' },
      { keywords: ['проект', 'разработка', 'создание'], title: 'Проектирование и разработка' },
      { keywords: ['контроль', 'проверка', 'тестирование'], title: 'Контроль и оценка' },
      { keywords: ['заключение', 'итог', 'обобщение'], title: 'Заключение и обобщение' }
    ];

    const sections: any[] = [];
    const usedLessons = new Set<number>();

    // Группируем уроки по темам
    commonThemes.forEach(theme => {
      const matchingLessons: any[] = [];
      
      lessons.forEach((lesson, index) => {
        if (usedLessons.has(index)) return;
        
        const lessonName = lesson.name.toLowerCase();
        const hasKeyword = theme.keywords.some(keyword => 
          lessonName.includes(keyword.toLowerCase())
        );
        
        if (hasKeyword) {
          matchingLessons.push(this.createLessonFromStudyPlan(lesson, nextIdRef.value++));
          usedLessons.add(index);
        }
      });

      if (matchingLessons.length > 0) {
        sections.push({
          title: theme.title,
          description: `Раздел посвящен изучению ${theme.title.toLowerCase()}`,
          lessons: matchingLessons
        });
      }
    });

    // Добавляем оставшиеся уроки в общий раздел
    const unusedLessons = lessons
      .filter((_, index) => !usedLessons.has(index))
      .map((lesson) => this.createLessonFromStudyPlan(lesson, nextIdRef.value++));

    if (unusedLessons.length > 0) {
      sections.push({
        title: 'Дополнительные темы',
        description: 'Дополнительные уроки курса',
        lessons: unusedLessons
      });
    }

    return sections.length > 1 ? sections : [];
  }

  /**
   * Создание разделов на основе времени (4-6 уроков в раздел)
   */
  private createTimeBasedSections(lessons: any[], studyPlanName: string, nextIdRef: { value: number }) {
    const sections = [];
    const lessonsPerSection = Math.ceil(lessons.length / Math.ceil(lessons.length / 5)); // Оптимальное количество уроков в разделе
    let sectionNumber = 1;

    for (let i = 0; i < lessons.length; i += lessonsPerSection) {
      const sectionLessons = lessons
        .slice(i, i + lessonsPerSection)
        .map((lesson) => this.createLessonFromStudyPlan(lesson, nextIdRef.value++));

      sections.push({
        sectionId: sectionNumber,
        sectionTitle: `Раздел ${sectionNumber}`,
        sectionDescription: `Раздел ${sectionNumber} учебного плана "${studyPlanName}"`,
        totalHours: sectionLessons.length * 2,
        lessons: sectionLessons
      });

      sectionNumber++;
    }

    return sections;
  }

  /**
   * Создание урока КТП на основе урока учебного плана
   */
  private createLessonFromStudyPlan(lesson: any, index: number) {
    return {
      id: index,
      title: lesson.name,
      description: lesson.description || `Урок по теме: ${lesson.name}`,
      duration: 2, // по умолчанию 2 часа
      week: Math.ceil(index / 2), // 2 урока в неделю
      date: lesson.date?.toISOString(),
      status: 'planned' as LessonStatus,
      materials: [],
      objectives: [`Изучить тему: ${lesson.name}`],
      methods: ['Лекция', 'Практическая работа'],
      assessment: 'Устный опрос, практические задания',
      homework: `Изучить материалы по теме: ${lesson.name}`
    };
  }

  private transformKtpData(ktp: any) {
    const plannedLessons = (ktp.plannedLessons as any[]) || [];
    // Фильтруем пустые разделы (без уроков) из ответа API
    const filteredSections = plannedLessons.filter((section: any) =>
      Array.isArray(section?.lessons) && section.lessons.length > 0
    );

    return {
      id: ktp.id,
      studyPlanId: ktp.studyPlanId,
      totalHours: filteredSections.reduce((sum, section) => sum + (section.totalHours || 0), 0),
      totalLessons: ktp.totalLessons,
      completionRate: ktp.completionRate,
      sections: filteredSections.map((section: any) => ({
        id: section.sectionId,
        title: section.sectionTitle,
        description: section.sectionDescription,
        totalHours: section.totalHours,
        expanded: false,
        lessons: section.lessons?.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          week: lesson.week,
          date: lesson.date,
          status: lesson.status,
          materials: lesson.materials || [],
          objectives: lesson.objectives || [],
          methods: lesson.methods || [],
          assessment: lesson.assessment,
          homework: lesson.homework
        })) || []
      })),
      studyPlan: ktp.studyPlan ? {
        id: ktp.studyPlan.id,
        name: ktp.studyPlan.name,
        teacher: ktp.studyPlan.teacher ? {
          id: ktp.studyPlan.teacher.id,
          name: `${ktp.studyPlan.teacher.user.name} ${ktp.studyPlan.teacher.user.surname}`
        } : null
      } : null,
      createdAt: ktp.createdAt,
      updatedAt: ktp.updatedAt
    };
  }
}
