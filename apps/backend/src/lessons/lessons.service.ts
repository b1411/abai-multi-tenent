import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonFilterDto } from './dto/lesson-filter.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginateResponseDto } from 'src/common/dtos/paginate.dto';
import { Lesson, Prisma } from 'generated/prisma';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createLessonDto: CreateLessonDto): Promise<Lesson> {
    return this.prisma.lesson.create({
      data: {
        ...createLessonDto,
        date: new Date(createLessonDto.date),
      },
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                  }
                }
              }
            }
          }
        },
        materials: {
          include: {
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
    });
  }

  async findAll(filters: LessonFilterDto): Promise<PaginateResponseDto<Lesson>> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'date', 
      order = 'asc', 
      search, 
      studyPlanId, 
      dateFrom, 
      dateTo 
    } = filters;

    const where: Prisma.LessonWhereInput = {
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
      ...(studyPlanId && { studyPlanId }),
      ...(dateFrom && {
        date: {
          gte: new Date(dateFrom),
        }
      }),
      ...(dateTo && {
        date: {
          lte: new Date(dateTo),
        }
      }),
      // Если указаны обе даты
      ...(dateFrom && dateTo && {
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        }
      }),
    };

    const [data, count] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          studyPlan: {
            select: {
              id: true,
              name: true,
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      surname: true,
                      email: true,
                    }
                  }
                }
              }
            }
          },
          materials: {
            include: {
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
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return {
      data,
      meta: {
        totalItems: count,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    };
  }

  async findByStudyPlan(studyPlanId: number): Promise<Lesson[]> {
    return this.prisma.lesson.findMany({
      where: {
        studyPlanId,
        deletedAt: null,
      },
      orderBy: {
        date: 'asc',
      },
      include: {
        materials: {
          include: {
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
    });
  }

  async findOne(id: number): Promise<Lesson> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { 
        id,
        deletedAt: null,
      },
      include: {
        studyPlan: {
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
            }
          }
        },
        materials: {
          include: {
            quiz: {
              select: {
                id: true,
                name: true,
                isActive: true,
                maxScore: true,
                duration: true,
              }
            },
            additionalFiles: {
              select: {
                id: true,
                name: true,
                url: true,
                type: true,
                size: true,
              }
            }
          }
        },
        homework: {
          include: {
            additionalFiles: {
              select: {
                id: true,
                name: true,
                url: true,
                type: true,
                size: true,
              }
            }
          }
        }
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Урок с ID ${id} не найден`);
    }

    return lesson;
  }

  async update(id: number, updateLessonDto: UpdateLessonDto): Promise<Lesson> {
    const existingLesson = await this.prisma.lesson.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingLesson) {
      throw new NotFoundException(`Урок с ID ${id} не найден`);
    }

    const updateData = {
      ...updateLessonDto,
      ...(updateLessonDto.date && { date: new Date(updateLessonDto.date) }),
    };

    return this.prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                  }
                }
              }
            }
          }
        },
        materials: {
          include: {
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
    });
  }

  async softRemove(id: number): Promise<Lesson> {
    const existingLesson = await this.prisma.lesson.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingLesson) {
      throw new NotFoundException(`Урок с ID ${id} не найден`);
    }

    return this.prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
