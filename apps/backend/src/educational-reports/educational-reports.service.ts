import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { getAcademicQuarterRanges, getCurrentAcademicQuarterRange } from '../common/academic-period.util';
import { PrismaService } from '../prisma/prisma.service';
import { 
  EducationalReportFiltersDto, 
  StudentReportFiltersDto,
  ReportPeriod 
} from './dto/educational-report-filters.dto';
import { 
  SubjectGradesDto,
  GradeDetailDto,
  AttendanceRecordDto
} from './dto/period-grades.dto';

@Injectable()
export class EducationalReportsService {
  constructor(private prisma: PrismaService) {}

  // ============ БАЗОВЫЕ МЕТОДЫ ПОЛУЧЕНИЯ ДАННЫХ ============

  async getStudentsByRole(userId: number, userRole: string, filters: EducationalReportFiltersDto) {
    switch (userRole) {
      case 'STUDENT':
        return this.getStudentOwnData(userId, filters);
      case 'TEACHER':
        return this.getTeacherStudents(userId, filters);
      case 'ADMIN':
        return this.getAllStudents(filters);
      default:
        throw new ForbiddenException('Недостаточно прав для просмотра отчетов');
    }
  }

  private async getStudentOwnData(userId: number, filters: EducationalReportFiltersDto) {
    const whereConditions: any = { userId };
    
    if (filters.search) {
      whereConditions.user = {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { surname: { contains: filters.search, mode: 'insensitive' } },
          { middlename: { contains: filters.search, mode: 'insensitive' } }
        ]
      };
    }

    const student = await this.prisma.student.findFirst({
      where: whereConditions,
      include: {
        user: true,
        group: true
      }
    });

    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    return [student];
  }

  private async getTeacherStudents(teacherId: number, filters: EducationalReportFiltersDto) {
    // Получаем студентов через связь учитель -> учебные планы -> группы -> студенты
    const teacherStudyPlans = await this.prisma.studyPlan.findMany({
      where: { teacherId },
      include: {
        group: {
          include: {
            students: {
              include: {
                user: true,
                group: true
              },
              where: filters.search ? {
                user: {
                  OR: [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { surname: { contains: filters.search, mode: 'insensitive' } },
                    { middlename: { contains: filters.search, mode: 'insensitive' } }
                  ]
                }
              } : undefined
            }
          }
        }
      }
    });

    // Собираем уникальных студентов
    const studentsMap = new Map();
    teacherStudyPlans.forEach(plan => {
      plan.group.forEach(group => {
        group.students.forEach(student => {
          if (!studentsMap.has(student.id)) {
            studentsMap.set(student.id, student);
          }
        });
      });
    });

    return Array.from(studentsMap.values());
  }

  private async getAllStudents(filters: EducationalReportFiltersDto) {
    const whereConditions: any = {};

    if (filters.classId) {
      whereConditions.groupId = filters.classId;
    }

    if (filters.className) {
      whereConditions.group = {
        name: { contains: filters.className, mode: 'insensitive' }
      };
    }

    if (filters.search) {
      whereConditions.user = {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { surname: { contains: filters.search, mode: 'insensitive' } },
          { middlename: { contains: filters.search, mode: 'insensitive' } }
        ]
      };
    }

    return this.prisma.student.findMany({
      where: whereConditions,
      include: {
        user: true,
        group: true
      },
      orderBy: [
        { group: { name: 'asc' } },
        { user: { surname: 'asc' } }
      ]
    });
  }

  // ============ МЕТОДЫ ПОЛУЧЕНИЯ ОЦЕНОК ============

  async getStudentGrades(studentId: number, filters: StudentReportFiltersDto) {
    const { startDate, endDate } = this.getPeriodDates(filters.period, filters.startDate, filters.endDate);
    
    const whereConditions: any = {
      studentId,
      Lesson: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    };

    if (filters.subjectId) {
      whereConditions.Lesson = {
        ...whereConditions.Lesson,
        studyPlan: {
          id: filters.subjectId
        }
      };
    }

    const lessonResults = await this.prisma.lessonResult.findMany({
      where: whereConditions,
      include: {
        Lesson: {
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
        }
      },
      orderBy: [
        { Lesson: { date: 'desc' } }
      ]
    });

    return this.groupGradesBySubject(lessonResults);
  }

  private groupGradesBySubject(lessonResults: any[]): SubjectGradesDto[] {
    const subjectsMap = new Map<number, any>();

    lessonResults.forEach(result => {
      if (!result.lessonScore) return; // Пропускаем записи без оценок

      const studyPlan = result.Lesson.studyPlan;
      const subjectId = studyPlan.id;
      const subjectName = studyPlan.name; // StudyPlan.name - это название предмета

      if (!subjectsMap.has(subjectId)) {
        subjectsMap.set(subjectId, {
          subjectId,
          subjectName,
          grades: [],
          teacherName: `${studyPlan.teacher.user.surname} ${studyPlan.teacher.user.name[0]}.${studyPlan.teacher.user.middlename?.[0] || ''}.`
        });
      }

      const gradeDetail: GradeDetailDto = {
        id: result.id,
        grade: result.lessonScore,
        date: result.Lesson.date,
        topic: result.Lesson.name || 'Урок',
        gradeType: 'Текущая оценка',
        teacherName: subjectsMap.get(subjectId).teacherName,
        comment: result.lessonScorecomment
      };

      subjectsMap.get(subjectId).grades.push(gradeDetail);
    });

    // Вычисляем статистику для каждого предмета
    return Array.from(subjectsMap.values()).map(subject => {
      const grades = subject.grades.map(g => g.grade);
      const averageGrade = this.calculateAverageGrade(grades);
      const qualityPercentage = this.calculateQualityPercentage(grades);

      return {
        ...subject,
        averageGrade,
        qualityPercentage,
        gradesCount: grades.length
      };
    });
  }

  // ============ МЕТОДЫ ПОЛУЧЕНИЯ ПОСЕЩАЕМОСТИ ============

  async getStudentAttendance(studentId: number, filters: StudentReportFiltersDto): Promise<AttendanceRecordDto[]> {
    const { startDate, endDate } = this.getPeriodDates(filters.period, filters.startDate, filters.endDate);
    
    const whereConditions: any = {
      studentId,
      Lesson: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    };

    if (filters.subjectId) {
      whereConditions.Lesson = {
        ...whereConditions.Lesson,
        studyPlan: {
          id: filters.subjectId
        }
      };
    }

    const lessonResults = await this.prisma.lessonResult.findMany({
      where: whereConditions,
      include: {
        Lesson: {
          include: {
            studyPlan: true
          }
        }
      },
      orderBy: [
        { Lesson: { date: 'desc' } }
      ]
    });

    return lessonResults.map(result => ({
      id: result.id,
      date: result.Lesson?.date || new Date(),
      isPresent: result.attendance === true,
      absentReason: result.absentReason as 'SICK' | 'FAMILY' | 'OTHER' | undefined,
      absentComment: result.absentComment,
      subjectName: result.Lesson?.studyPlan?.name || 'Предмет',
      lessonTopic: result.Lesson?.name || 'Урок'
    }));
  }

  // ============ УТИЛИТЫ ДЛЯ РАСЧЕТОВ (ПРИКАЗ 125) ============

  /**
   * Расчет качества знаний согласно приказу 125
   * Качество знаний - процент оценок "4" и "5" от общего количества оценок
   */
  calculateQualityPercentage(grades: number[]): number {
    if (grades.length === 0) return 0;
    const qualityGrades = grades.filter(grade => grade >= 4).length;
    return Math.round((qualityGrades / grades.length) * 100);
  }

  /**
   * Расчет среднего балла с округлением до десятых
   */
  calculateAverageGrade(grades: number[]): number {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    return Math.round((sum / grades.length) * 10) / 10;
  }

  /**
   * Расчет итоговой оценки за период согласно приказу 125
   */
  calculatePeriodGrades(grades: number[], period?: ReportPeriod): number {
    if (grades.length === 0) return 0;
    
    switch (period) {
      case ReportPeriod.DAY:
      case ReportPeriod.WEEK:
        return this.calculateWeightedAverage(grades);
      
      case ReportPeriod.SCHOOL_QUARTER_1:
      case ReportPeriod.SCHOOL_QUARTER_2:
      case ReportPeriod.SCHOOL_QUARTER_3:
      case ReportPeriod.SCHOOL_QUARTER_4:
      case ReportPeriod.QUARTER:
        return this.calculateQuarterGrade(grades);
      
      case ReportPeriod.FALL_SEMESTER:
      case ReportPeriod.SPRING_SEMESTER:
      case ReportPeriod.SEMESTER:
        return this.calculateSemesterGrade(grades);
      
      case ReportPeriod.YEAR:
        return this.calculateYearGrade(grades);
      
      default:
        return this.calculateQuarterGrade(grades);
    }
  }

  /**
   * Получить список классов/групп в зависимости от роли пользователя
   */
  async getClasses(userId: number, role: string): Promise<{ name: string }[]> {
    try {
      let groups;

      if (role === 'ADMIN' || role === 'DIRECTOR') {
        // Администратор и директор видят все классы
        groups = await this.prisma.group.findMany({
          select: {
            name: true
          },
          orderBy: {
            name: 'asc'
          }
        });
      } else if (role === 'TEACHER') {
        // Учитель видит только свои классы
        groups = await this.prisma.group.findMany({
          where: {
            studyPlans: {
              some: {
                teacherId: userId
              }
            }
          },
          select: {
            name: true
          },
          orderBy: {
            name: 'asc'
          }
        });
      } else {
        // Другие роли - пустой список
        groups = [];
      }

      return groups;
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw new Error('Failed to fetch classes');
    }
  }

  /**
   * Получить список учителей в зависимости от роли пользователя
   */
  async getTeachers(userId: number, role: string): Promise<{ id: number; name: string }[]> {
    try {
      let teachers;

      if (role === 'ADMIN' || role === 'DIRECTOR') {
        // Администратор и директор видят всех учителей
        teachers = await this.prisma.teacher.findMany({
          select: {
            id: true,
            user: {
              select: {
                name: true,
                surname: true,
                middlename: true
              }
            }
          },
          orderBy: {
            user: {
              surname: 'asc'
            }
          }
        });
      } else if (role === 'TEACHER') {
        // Учитель видит только себя
        teachers = await this.prisma.teacher.findMany({
          where: {
            userId: userId
          },
          select: {
            id: true,
            user: {
              select: {
                name: true,
                surname: true,
                middlename: true
              }
            }
          }
        });
      } else {
        // Другие роли - пустой список
        teachers = [];
      }

      // Форматируем имена учителей
      return teachers.map(teacher => ({
        id: teacher.id,
        name: `${teacher.user.surname} ${teacher.user.name.charAt(0)}.${teacher.user.middlename ? teacher.user.middlename.charAt(0) + '.' : ''}`
      }));
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw new Error('Failed to fetch teachers');
    }
  }

  /**
   * Расчет четвертной оценки согласно приказу 125
   * Учитываются все текущие оценки с приоритетом контрольных работ
   */
  private calculateQuarterGrade(grades: number[]): number {
    if (grades.length === 0) return 0;
    
    // Согласно приказу 125, четвертная оценка выставляется с учетом всех текущих оценок
    // В реальной системе здесь должен быть учет типов оценок (контрольные, самостоятельные и т.д.)
    const average = this.calculateAverageGrade(grades);
    
    // Округление согласно педагогическим правилам:
    // 2.5-3.4 = 3, 3.5-4.4 = 4, 4.5-5.0 = 5
    if (average < 2.5) return 2;
    if (average < 3.5) return 3;
    if (average < 4.5) return 4;
    return 5;
  }

  /**
   * Расчет полугодовой оценки на основе четвертных
   */
  private calculateSemesterGrade(grades: number[]): number {
    if (grades.length === 0) return 0;
    
    // В системе полугодий учитываются как четвертные оценки
    return this.calculateQuarterGrade(grades);
  }

  /**
   * Расчет годовой оценки согласно приказу 125 п.4
   * Годовая оценка выставляется на основании четвертных (полугодовых) оценок
   */
  private calculateYearGrade(quarterGrades: number[]): number {
    if (quarterGrades.length === 0) return 0;
    
    // Согласно приказу 125 п.4: годовая оценка на основании четвертных
    const average = this.calculateAverageGrade(quarterGrades);
    
    // Педагогическое округление для итоговых оценок
    if (average < 2.5) return 2;
    if (average < 3.5) return 3;
    if (average < 4.5) return 4;
    return 5;
  }

  /**
   * Расчет взвешенного среднего для недельных оценок
   */
  private calculateWeightedAverage(grades: number[]): number {
    if (grades.length === 0) return 0;
    
    // Простое среднее арифметическое для недельных отчетов
    // В реальной системе можно добавить веса для разных типов работ
    return this.calculateAverageGrade(grades);
  }

  /**
   * Расчет итоговой оценки согласно приказу 125 п.51
   * Учитываются годовая и экзаменационная оценки
   */
  calculateFinalGrade(yearGrade: number, examGrade?: number): number {
    // Согласно приказу 125 п.51:
    if (examGrade) {
      // При неудовлетворительной экзаменационной оценке не выставляется положительная итоговая
      if (examGrade < 3) return examGrade;
      
      // Итоговая оценка не выше экзаменационной
      const average = Math.round((yearGrade + examGrade) / 2);
      return Math.min(average, examGrade);
    }
    
    // Без экзамена - годовая оценка
    return yearGrade;
  }

  // ============ УТИЛИТЫ ДЛЯ РАБОТЫ С ПЕРИОДАМИ ============

  private getPeriodDates(period?: ReportPeriod, startDate?: string, endDate?: string) {
    // Если указаны кастомные даты или период CUSTOM
    if ((startDate && endDate) || period === ReportPeriod.CUSTOM) {
      return {
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date()
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // Централизованные границы учебных четвертей
    const { quarters } = getAcademicQuarterRanges(now);
    const q1Start = quarters[0].start; const q1End = quarters[0].end;
    const q2Start = quarters[1].start; const q2End = quarters[1].end;
    const q3Start = quarters[2].start; const q3End = quarters[2].end;
    const q4Start = quarters[3].start; const q4End = quarters[3].end;

    // Доп. каникулы для 1-х классов: 09.02–15.02 (можно добавить логику при необходимости)

    let start: Date;
    let end: Date;

    switch (period) {
      // ============ БАЗОВЫЕ ПЕРИОДЫ ============
      case ReportPeriod.DAY: {
        start = new Date(currentYear, now.getMonth(), now.getDate());
        end = new Date(currentYear, now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      }
      case ReportPeriod.WEEK: {
        const startOfWeek = now.getDate() - now.getDay() + 1; // Понедельник
        start = new Date(currentYear, now.getMonth(), startOfWeek);
        end = new Date(currentYear, now.getMonth(), startOfWeek + 6, 23, 59, 59);
        break;
      }
      
      // ============ ШКОЛЬНЫЕ ЧЕТВЕРТИ ============
      case ReportPeriod.SCHOOL_QUARTER_1: {
        // 1-я учебная четверть: 02.09 – 26.10 (утверждено)
        start = q1Start;
        end = q1End;
        break;
      }
      case ReportPeriod.SCHOOL_QUARTER_2: {
        // 2-я учебная четверть: 03.11 – 28.12
        start = q2Start;
        end = q2End;
        break;
      }
      case ReportPeriod.SCHOOL_QUARTER_3: {
        // 3-я учебная четверть: 08.01 – 18.03
        start = q3Start;
        end = q3End;
        break;
      }
      case ReportPeriod.SCHOOL_QUARTER_4: {
        // 4-я учебная четверть: 30.03 – 25.05
        start = q4Start;
        end = q4End;
        break;
      }

      // ============ КАЛЕНДАРНЫЕ КВАРТАЛЫ ============
      case ReportPeriod.CALENDAR_Q1: {
        start = new Date(currentYear, 0, 1);  // январь
        end = new Date(currentYear, 2, 31, 23, 59, 59);  // март
        break;
      }
      case ReportPeriod.CALENDAR_Q2: {
        start = new Date(currentYear, 3, 1);  // апрель
        end = new Date(currentYear, 5, 30, 23, 59, 59);  // июнь
        break;
      }
      case ReportPeriod.CALENDAR_Q3: {
        start = new Date(currentYear, 6, 1);  // июль
        end = new Date(currentYear, 8, 30, 23, 59, 59);  // сентябрь
        break;
      }
      case ReportPeriod.CALENDAR_Q4: {
        start = new Date(currentYear, 9, 1);  // октябрь
        end = new Date(currentYear, 11, 31, 23, 59, 59);  // декабрь
        break;
      }

      // ============ СЕМЕСТРЫ ============
      case ReportPeriod.FALL_SEMESTER: {
        // Осенний семестр: сентябрь-декабрь
        start = new Date(currentYear, 8, 1);  // сентябрь
        end = new Date(currentYear, 11, 31, 23, 59, 59);  // декабрь
        break;
      }
      case ReportPeriod.SPRING_SEMESTER: {
        // Весенний семестр: январь-май (следующего года)
        const schoolYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
        start = new Date(schoolYear + 1, 0, 9);  // январь
        end = new Date(schoolYear + 1, 4, 31, 23, 59, 59);  // май
        break;
      }

      // ============ ТРИМЕСТРЫ ============
      case ReportPeriod.TRIMESTER_1: {
        // 1-й триместр: сентябрь-декабрь
        start = new Date(currentYear, 8, 1);  // сентябрь
        end = new Date(currentYear, 11, 31, 23, 59, 59);  // декабрь
        break;
      }
      case ReportPeriod.TRIMESTER_2: {
        // 2-й триместр: январь-март
        const schoolYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
        start = new Date(schoolYear + 1, 0, 9);  // январь
        end = new Date(schoolYear + 1, 2, 31, 23, 59, 59);  // март
        break;
      }
      case ReportPeriod.TRIMESTER_3: {
        // 3-й триместр: апрель-май
        const schoolYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
        start = new Date(schoolYear + 1, 3, 1);  // апрель
        end = new Date(schoolYear + 1, 4, 31, 23, 59, 59);  // май
        break;
      }

      // ============ LEGACY ПОДДЕРЖКА ============
      case ReportPeriod.QUARTER: {
        // Переведено на учебную четверть (академическая)
        const currentQ = getCurrentAcademicQuarterRange(now);
        start = currentQ.start;
        end = currentQ.end;
        break;
      }
      case ReportPeriod.SEMESTER: {
        // Старая логика семестра
        const semester = now.getMonth() < 6 ? 0 : 1;
        start = new Date(currentYear, semester * 6, 1);
        end = new Date(currentYear, semester * 6 + 6, 0, 23, 59, 59);
        break;
      }
      case ReportPeriod.YEAR: {
        // Календарный год
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, 11, 31, 23, 59, 59);
        break;
      }

      default: {
        const currentQ = getCurrentAcademicQuarterRange(now);
        start = currentQ.start;
        end = currentQ.end;
      }
    }

    return { startDate: start, endDate: end };
  }

  private formatStudentName(user: any): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const middleName = user.middleName || '';
    return `${lastName} ${firstName} ${middleName}`.trim();
  }

  // ============ ПОЛУЧЕНИЕ ПРЕДМЕТОВ (StudyPlan) ============

  /**
   * Получить список всех предметов (StudyPlan)
   */
  async getSubjects() {
    return this.prisma.studyPlan.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        teacher: {
          select: {
            user: {
              select: {
                name: true,
                surname: true,
                middlename: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }
}
