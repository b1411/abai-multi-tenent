import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { CreateLessonMaterialsDto } from './dto/create-lesson-materials.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(createMaterialDto: CreateMaterialDto) {
    return this.prisma.materials.create({
      data: createMaterialDto,
      include: {
        quiz: true,
        homework: true,
        additionalFiles: true,
        lesson: true,
      },
    });
  }

  async findAll() {
    return this.prisma.materials.findMany({
      where: { deletedAt: null },
      include: {
        quiz: true,
        homework: true,
        additionalFiles: true,
        lesson: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const material = await this.prisma.materials.findFirst({
      where: { id, deletedAt: null },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
        homework: {
          include: {
            additionalFiles: true,
          },
        },
        additionalFiles: true,
        lesson: true,
      },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }

  async update(id: number, updateMaterialDto: UpdateMaterialDto) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.materials.update({
      where: { id },
      data: updateMaterialDto,
      include: {
        quiz: true,
        homework: true,
        additionalFiles: true,
        lesson: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.materials.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Специальные методы для работы с материалами урока
  async findByLessonId(lessonId: number, userRole: string) {
    const quizInclude =
      userRole === 'STUDENT'
        ? true
        : {
            include: {
              questions: {
                include: {
                  answers: true,
                },
                orderBy: { createdAt: 'asc' as const },
              },
            },
          };

    // Сначала находим урок с его материалами
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        deletedAt: null,
      },
      include: {
        materials: {
          include: {
            quiz: quizInclude,
            homework: {
              include: {
                additionalFiles: true,
              },
            },
            additionalFiles: true,
          },
        },
      },
    });

    console.log(
      'Lesson found:',
      lessonId,
      'with materials:',
      JSON.stringify(lesson?.materials, null, 2),
    );
    return lesson?.materials || null;
  }

  async attachToLesson(materialId: number, lessonId: number) {
    // Проверяем, что урок существует
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { materialsId: materialId },
      include: {
        materials: {
          include: {
            quiz: true,
            homework: true,
            additionalFiles: true,
          },
        },
      },
    });
  }

  async createLessonMaterials(lessonId: number, createLessonMaterialsDto: CreateLessonMaterialsDto) {
    // Проверяем, что урок существует
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return this.prisma.$transaction(async (prisma) => {
      let quizId: number | undefined;
      let homeworkId: number | undefined;

      // Создаем квиз, если данные переданы
      if (createLessonMaterialsDto.quiz) {
        const quizData = {
          name: createLessonMaterialsDto.quiz.name,
          duration: createLessonMaterialsDto.quiz.duration,
          maxScore: createLessonMaterialsDto.quiz.maxScore,
          isActive: createLessonMaterialsDto.quiz.isActive,
          startDate: createLessonMaterialsDto.quiz.startDate 
            ? new Date(createLessonMaterialsDto.quiz.startDate) 
            : null,
          endDate: createLessonMaterialsDto.quiz.endDate 
            ? new Date(createLessonMaterialsDto.quiz.endDate) 
            : null,
        };

        const quiz = await prisma.quiz.create({
          data: quizData,
        });
        quizId = quiz.id;

        // Создаем вопросы для квиза, если они переданы
        if (createLessonMaterialsDto.quiz.questions && createLessonMaterialsDto.quiz.questions.length > 0) {
          for (const questionData of createLessonMaterialsDto.quiz.questions) {
            const question = await prisma.question.create({
              data: {
                quizId: quiz.id,
                name: questionData.question,
                type: questionData.multipleAnswers ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
              },
            });

            // Создаем варианты ответов
            if (questionData.options && questionData.options.length > 0) {
              for (let i = 0; i < questionData.options.length; i++) {
                const option = questionData.options[i];
                if (option && option.trim()) {
                  const isCorrect = questionData.multipleAnswers
                    ? Array.isArray(questionData.correctAnswer) && questionData.correctAnswer.includes(i)
                    : questionData.correctAnswer === i;

                  await prisma.answer.create({
                    data: {
                      questionId: question.id,
                      name: option.trim(),
                      isCorrect,
                    },
                  });
                }
              }
            }
          }
        }
      }

      // Создаем домашнее задание, если данные переданы
      if (createLessonMaterialsDto.homework && createLessonMaterialsDto.homework.name?.trim()) {
        const homework = await prisma.homework.create({
          data: {
            name: createLessonMaterialsDto.homework.name.trim(),
            deadline: createLessonMaterialsDto.homework.deadline 
              ? new Date(createLessonMaterialsDto.homework.deadline) 
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // По умолчанию через неделю
          },
        });
        homeworkId = homework.id;
      }

      // Создаем материал
      const material = await prisma.materials.create({
        data: {
          lecture: createLessonMaterialsDto.lecture,
          videoUrl: createLessonMaterialsDto.videoUrl,
          presentationUrl: createLessonMaterialsDto.presentationUrl,
          quizId,
          homeworkId,
        },
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  answers: true,
                },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
          homework: {
            include: {
              additionalFiles: true,
            },
          },
          additionalFiles: true,
        },
      });

      // Привязываем материал к уроку и связываем домашнее задание
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { 
          materialsId: material.id,
          ...(homeworkId && { homeworkId })
        },
      });

      return material;
    });
  }
}
