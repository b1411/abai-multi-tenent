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
  async findByLessonId(lessonId: number) {
    return this.prisma.materials.findFirst({
      where: { 
        lesson: { id: lessonId },
        deletedAt: null 
      },
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
        homework: true,
        additionalFiles: true,
      },
    });
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
        const quiz = await prisma.quiz.create({
          data: {
            ...createLessonMaterialsDto.quiz,
            startDate: createLessonMaterialsDto.quiz.startDate 
              ? new Date(createLessonMaterialsDto.quiz.startDate) 
              : null,
            endDate: createLessonMaterialsDto.quiz.endDate 
              ? new Date(createLessonMaterialsDto.quiz.endDate) 
              : null,
          },
        });
        quizId = quiz.id;
      }

      // Создаем домашнее задание, если данные переданы
      if (createLessonMaterialsDto.homework) {
        const homework = await prisma.homework.create({
          data: {
            ...createLessonMaterialsDto.homework,
            deadline: new Date(createLessonMaterialsDto.homework.deadline),
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

      // Привязываем материал к уроку
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { materialsId: material.id },
      });

      return material;
    });
  }
}
