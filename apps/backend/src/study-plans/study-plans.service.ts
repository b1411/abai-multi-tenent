import { Injectable } from '@nestjs/common';
import { StudyPlan } from './entities/study-plan.entity';
import { PaginateResponseDto } from 'src/common/dtos/paginate.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudyPlanDto } from './dto/create-study-plan.dto';
import { UpdateStudyPlanDto } from './dto/update-study-plan-dto';
import { StudyPlanFilterDto } from './dto/study-plan-filter.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class StudyPlansService {
    constructor(private readonly prisma: PrismaService) { }

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

    async findAll(filter: StudyPlanFilterDto): Promise<PaginateResponseDto<StudyPlan>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'name',
            order = 'asc',
            search,
            teacherId,
            groupId
        } = filter;

        const where: Prisma.StudyPlanWhereInput = {
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
            ...(teacherId && { teacherId }),
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
        const { groups, ...studyPlanData } = createStudyPlanDto;

        const createdPlan = await this.prisma.studyPlan.create({
            data: {
                ...studyPlanData,
                group: {
                    connect: groups
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
    }

    async update(id: number, updateStudyPlanDto: UpdateStudyPlanDto): Promise<StudyPlan> {
        const existingStudyPlan = await this.prisma.studyPlan.findUnique({
            where: { id },
        });

        if (!existingStudyPlan) {
            throw new Error(`Study Plan with ID ${id} not found`);
        }

        const { groups, ...studyPlanData } = updateStudyPlanDto;

        const updatedPlan = await this.prisma.studyPlan.update({
            where: { id },
            data: {
                ...studyPlanData,
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
}
