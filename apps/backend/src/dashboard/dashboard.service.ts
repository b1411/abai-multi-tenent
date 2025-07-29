import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getStudentDashboard(userId: number) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      include: {
        group: true,
        lessonsResults: {
          include: {
            Lesson: {
              include: {
                studyPlan: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Берем больше для расчетов
        },
        HomeworkSubmission: {
          include: {
            homework: {
              include: {
                lesson: {
                  include: {
                    studyPlan: true,
                  },
                },
              },
            },
          },
          where: {
            status: 'PENDING',
          },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Calculate statistics
    const grades = student.lessonsResults
      .filter(result => result.lessonScore !== null)
      .map(result => result.lessonScore);

    const averageGrade = grades.length > 0
      ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length
      : 0;

    const attendanceRecords = student.lessonsResults;
    const totalLessons = attendanceRecords.length;
    const attendedLessons = attendanceRecords.filter(result => result.attendance === true).length;
    const attendance = totalLessons > 0 ? Math.round((attendedLessons / totalLessons) * 100) : 0;

    // Get today's schedule from group schedules
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7

    const todaySchedule = await this.prisma.schedule.findMany({
      where: {
        groupId: student.groupId,
        dayOfWeek: dayOfWeek,
      },
      include: {
        studyPlan: true,
        classroom: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Get upcoming lessons (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingLessons = await this.prisma.lesson.findMany({
      where: {
        date: {
          gte: today,
          lte: nextWeek,
        },
        studyPlan: {
          group: {
            some: {
              id: student.groupId,
            },
          },
        },
      },
    });

    // Get subject grades
    const subjectGrades = {};
    student.lessonsResults.forEach(result => {
      if (result.lessonScore !== null && result.Lesson?.studyPlan?.name) {
        const subject = result.Lesson.studyPlan.name;
        if (!subjectGrades[subject]) {
          subjectGrades[subject] = [];
        }
        subjectGrades[subject].push(result.lessonScore);
      }
    });

    const subjectAverages = Object.entries(subjectGrades).map(([subject, grades]: [string, number[]]) => {
      const avg = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      return {
        subject,
        averageGrade: Math.round(avg * 10) / 10,
        description: avg >= 4.5 ? 'Отличная успеваемость' :
          avg >= 4.0 ? 'Хорошая успеваемость' :
            'Нужно подтянуть',
      };
    });

    return {
      upcomingLessons: upcomingLessons.length,
      pendingHomework: student.HomeworkSubmission.length,
      averageGrade: Math.round(averageGrade * 10) / 10,
      attendance,
      todaySchedule: todaySchedule.map(schedule => ({
        id: schedule.studyPlan.id,
        subject: schedule.studyPlan.name,
        time: `${schedule.startTime} - ${schedule.endTime}`,
        classroom: schedule.classroom?.name || 'Не назначен',
      })),
      pendingAssignments: student.HomeworkSubmission.map(submission => ({
        id: submission.id,
        title: submission.homework.name,
        subject: submission.homework.lesson?.studyPlan?.name || 'Общее',
        dueDate: submission.homework.deadline.toLocaleDateString('ru-RU'),
        status: new Date() > submission.homework.deadline ? 'overdue' : 'pending',
      })),
      subjectGrades: subjectAverages,
    };
  }

  async getTeacherDashboard(userId: number) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId },
      include: {
        studyPlans: {
          include: {
            group: {
              include: {
                students: true,
              },
            },
            lessons: {
              include: {
                LessonResult: true,
              },
            },
          },
        },
        schedules: {
          include: {
            studyPlan: true,
            group: true,
            classroom: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Calculate statistics
    const totalStudents = teacher.studyPlans.reduce((total, plan) =>
      total + plan.group.reduce((groupTotal, group) => groupTotal + group.students.length, 0), 0
    );

    const allLessons = teacher.studyPlans.flatMap(plan => plan.lessons);
    const completedLessons = allLessons.filter(lesson => lesson.date < new Date()).length;

    // Get today's schedule
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7

    const todaySchedule = teacher.schedules.filter(schedule =>
      schedule.dayOfWeek === dayOfWeek
    );

    // Get real pending grading data
    const pendingGrading = await this.prisma.homeworkSubmission.count({
      where: {
        status: 'PENDING',
        homework: {
          lesson: {
            studyPlan: {
              teacherId: teacher.id,
            },
          },
        },
      },
    });

    // Get real upcoming deadlines
    const nextWeek = new Date();
    nextWeek.setDate(new Date().getDate() + 7);
    
    const upcomingDeadlines = await this.prisma.homework.count({
      where: {
        deadline: {
          gte: new Date(),
          lte: nextWeek,
        },
        lesson: {
          studyPlan: {
            teacherId: teacher.id,
          },
        },
      },
    });

    // Calculate group performance
    const groupPerformance = teacher.studyPlans.map(plan => {
      const groups = plan.group;
      return groups.map(group => {
        const lessons = plan.lessons;
        const allResults = lessons.flatMap(lesson => lesson.LessonResult);
        const grades = allResults
          .filter(result => result.lessonScore !== null)
          .map(result => result.lessonScore);

        const averageGrade = grades.length > 0
          ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length
          : 0;

        return {
          groupName: group.name,
          studentCount: group.students.length,
          averageGrade: Math.round(averageGrade * 10) / 10,
        };
      });
    }).flat();

    return {
      todayLessons: todaySchedule.length,
      totalStudents,
      pendingGrading,
      upcomingDeadlines,
      completedLessons,
      monthlyWorkload: completedLessons * 2, // Mock calculation
      todaySchedule: todaySchedule.map((schedule, index) => ({
        id: schedule.studyPlanId,
        subject: schedule.studyPlan.name,
        group: schedule.group.name,
        time: `${schedule.startTime} - ${schedule.endTime}`,
        classroom: schedule.classroom ? `Кабинет ${schedule.classroom.name}` : 'Кабинет не назначен',
        status: index === 0 ? 'current' : 'upcoming',
      })),
      alerts: [
        {
          id: 1,
          type: 'homework',
          title: 'Домашние задания',
          description: `${pendingGrading} работ нужно проверить`,
          priority: pendingGrading > 20 ? 'high' : 'medium',
        },
        {
          id: 2,
          type: 'report',
          title: 'Отчеты',
          description: `${upcomingDeadlines} отчетов к сдаче`,
          priority: 'medium',
        },
      ],
      groupPerformance,
    };
  }

  async getAdminDashboard(userId: number) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    // Get overall statistics
    const [
      totalStudents,
      totalTeachers,
      totalGroups,
      totalClassrooms,
      monthlyPayments,
      totalNotifications,
      recentUsers
    ] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
      this.prisma.group.count({ where: { deletedAt: null } }),
      this.prisma.classroom.count({ where: { deletedAt: null } }),
      this.prisma.payment.aggregate({
        where: {
          status: 'paid',
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.notification.count({
        where: { read: false },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        include: {
          teacher: true,
          student: { include: { group: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const monthlyRevenue = monthlyPayments._sum.amount || 0;

    // Calculate financial summary from budget data
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: {
        period: `${currentYear} Q${Math.ceil(currentMonth / 3)}`,
        deletedAt: null,
      },
    });

    const expenses = budgetItems
      .filter(item => item.type === 'EXPENSE')
      .reduce((sum, item) => sum + item.actualAmount, 0);

    // Calculate completion rate based on lesson results
    const lessonResults = await this.prisma.lessonResult.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const completedLessons = lessonResults.filter(result => result.attendance === true).length;
    const totalLessons = lessonResults.length;
    const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Get pending applications (vacation requests)
    const pendingApplications = await this.prisma.vacation.count({
      where: { status: 'pending' },
    });

    // Get recent events from calendar and user registrations
    const upcomingEvents = await this.prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
        deletedAt: null,
      },
      include: {
        createdBy: true,
      },
      orderBy: { startDate: 'asc' },
      take: 3,
    });

    // Combine calendar events with user registration events
    const calendarEvents = upcomingEvents.map(event => ({
      id: event.id,
      type: 'calendar_event',
      title: event.title,
      description: event.description || `Событие запланировано на ${event.startDate.toLocaleDateString('ru-RU')}`,
      timestamp: event.startDate.toISOString(),
    }));

    const userEvents = recentUsers.slice(0, 2).map(user => {
      let eventType = 'new_user';
      let title = 'Новый пользователь';
      let description = `${user.name} ${user.surname} зарегистрирован в системе`;

      if (user.teacher) {
        eventType = 'new_teacher';
        title = 'Новый преподаватель';
        description = `${user.name} ${user.surname} добавлен как преподаватель`;
      } else if (user.student) {
        eventType = 'new_student';
        title = 'Новый студент';
        description = `${user.name} ${user.surname} зачислен в ${user.student.group?.name || 'группу'}`;
      }

      return {
        id: user.id,
        type: eventType,
        title,
        description,
        timestamp: user.createdAt.toISOString(),
      };
    });

    const recentEvents = [...calendarEvents, ...userEvents].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      totalStudents,
      totalTeachers,
      totalGroups,
      monthlyRevenue,
      pendingApplications,
      systemAlerts: totalNotifications, // Используем непрочитанные уведомления как системные алерты
      activeClassrooms: totalClassrooms,
      completionRate,
      financialSummary: {
        income: monthlyRevenue,
        expenses: Math.round(expenses / 3), // Примерно за месяц
        profit: monthlyRevenue - Math.round(expenses / 3),
      },
      recentEvents: recentEvents.slice(0, 5), // Показываем последние 5 событий
    };
  }

  async getParentDashboard(userId: number) {
    const parent = await this.prisma.parent.findFirst({
      where: { userId },
      include: {
        students: {
          include: {
            user: true,
            group: true,
            lessonsResults: {
              include: {
                Lesson: {
                  include: {
                    studyPlan: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            HomeworkSubmission: {
              include: {
                homework: {
                  include: {
                    lesson: {
                      include: {
                        studyPlan: true,
                      },
                    },
                  },
                },
              },
              where: {
                status: 'PENDING',
              },
            },
            Payment: {
              where: {
                status: { in: ['unpaid', 'partial', 'overdue'] },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new Error('Parent not found');
    }

    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const children = await Promise.all(parent.students.map(async (student) => {
      const grades = student.lessonsResults
        .filter(result => result.lessonScore !== null)
        .map(result => result.lessonScore);

      const averageGrade = grades.length > 0
        ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length
        : 0;

      const attendanceRecords = student.lessonsResults;
      const totalLessons = attendanceRecords.length;
      const attendedLessons = attendanceRecords.filter(result => result.attendance === true).length;
      const attendance = totalLessons > 0 ? Math.round((attendedLessons / totalLessons) * 100) : 0;

      // Get upcoming lessons for this student
      const upcomingLessons = await this.prisma.lesson.count({
        where: {
          date: {
            gte: today,
            lte: nextWeek,
          },
          studyPlan: {
            group: {
              some: {
                id: student.groupId,
              },
            },
          },
        },
      });

      // Get today's schedule for this student
      const todaySchedule = await this.prisma.schedule.findMany({
        where: {
          groupId: student.groupId,
          dayOfWeek: dayOfWeek,
        },
        include: {
          studyPlan: true,
          classroom: true,
        },
        orderBy: { startTime: 'asc' },
      });

      return {
        id: student.id,
        name: student.user.name,
        surname: student.user.surname,
        grade: student.group.name,
        averageGrade: Math.round(averageGrade * 10) / 10,
        attendance,
        upcomingLessons,
        pendingHomework: student.HomeworkSubmission.length,
        todaySchedule: todaySchedule.map(schedule => ({
          subject: schedule.studyPlan.name,
          time: `${schedule.startTime} - ${schedule.endTime}`,
          classroom: schedule.classroom?.name || 'Не назначен',
        })),
        pendingAssignments: student.HomeworkSubmission.map(submission => ({
          title: submission.homework.name,
          subject: submission.homework.lesson?.studyPlan?.name || 'Общее',
          dueDate: submission.homework.deadline.toLocaleDateString('ru-RU'),
          status: new Date() > submission.homework.deadline ? 'overdue' : 'pending',
        })),
      };
    }));

    const totalPayments = parent.students.reduce((total, student) =>
      total + student.Payment.reduce((sum, payment) => sum + payment.amount, 0), 0
    );

    const overduePayments = parent.students.reduce((total, student) =>
      total + student.Payment.filter(payment => payment.status === 'overdue').length, 0
    );

    // Get unread messages for this parent
    const unreadMessages = await this.prisma.notification.count({
      where: {
        userId: parent.userId,
        read: false,
        type: 'message',
      },
    });

    // Get recent notifications for this parent
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: parent.userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      children,
      totalPayments,
      overduePayments,
      unreadMessages,
      payments: parent.students.flatMap(student =>
        student.Payment.map(payment => ({
          id: payment.id,
          title: payment.serviceName,
          description: payment.serviceType,
          amount: payment.amount,
          status: payment.status,
        }))
      ),
      notifications: notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.message.split('•')[0]?.trim() || 'Уведомление',
        description: notification.message,
        timestamp: notification.createdAt.toISOString(),
      })),
    };
  }

  async getFinancistDashboard(userId: number) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    // Get payments data
    const [
      totalPayments,
      monthlyPayments,
      overduePayments,
      outstandingPayments,
      pendingBudgetRequests
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'paid',
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'overdue' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: { in: ['unpaid', 'partial'] } },
        _sum: { amount: true },
      }),
      this.prisma.purchaseRequest.count({
        where: { status: 'PENDING' },
      }),
    ]);

    // Get budget data
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: {
        period: `${currentYear} Q${Math.ceil(currentMonth / 3)}`,
        deletedAt: null,
      },
    });

    const totalRevenue = totalPayments._sum.amount || 0;
    const monthlyRevenue = monthlyPayments._sum.amount || 0;

    const expenses = budgetItems
      .filter(item => item.type === 'EXPENSE')
      .reduce((sum, item) => sum + item.actualAmount, 0);

    const monthlyExpenses = budgetItems
      .filter(item => item.type === 'EXPENSE')
      .reduce((sum, item) => sum + (item.actualAmount / 3), 0); // Примерно за месяц

    // Calculate revenue structure
    const revenueByType = await this.prisma.payment.groupBy({
      by: ['serviceType'],
      where: { status: 'paid' },
      _sum: { amount: true },
    });

    const totalRevenueForStructure = revenueByType.reduce((sum, item) => sum + (item._sum.amount || 0), 0);
    const revenueStructure = revenueByType.map(item => ({
      category: item.serviceType,
      amount: item._sum.amount || 0,
      percentage: totalRevenueForStructure > 0 ? Math.round(((item._sum.amount || 0) / totalRevenueForStructure) * 100) : 0,
    }));

    // Calculate expense structure from budget
    const expensesByCategory: Record<string, number> = budgetItems
      .filter(item => item.type === 'EXPENSE')
      .reduce((acc: Record<string, number>, item) => {
        if (!acc[item.category]) {
          acc[item.category] = 0;
        }
        acc[item.category] += item.actualAmount;
        return acc;
      }, {});

    const totalExpensesForStructure = Object.values(expensesByCategory).reduce((sum: number, amount: number) => sum + amount, 0);
    const expenseStructure = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpensesForStructure > 0 ? Math.round((amount / totalExpensesForStructure) * 100) : 0,
    }));

    // Get recent payments as transactions
    const recentPayments = await this.prisma.payment.findMany({
      where: { status: 'paid' },
      include: { student: { include: { user: true } } },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    // Get recent purchase requests as budget requests
    const budgetRequests = await this.prisma.purchaseRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalRevenue,
      monthlyRevenue,
      totalExpenses: expenses,
      monthlyExpenses: Math.round(monthlyExpenses),
      profit: totalRevenue - expenses,
      outstandingPayments: outstandingPayments._sum.amount || 0,
      overduePayments: overduePayments._sum.amount || 0,
      pendingBudgetRequests,
      revenueGrowth: await this.calculateRevenueGrowth(startOfMonth, endOfMonth),
      expenseGrowth: await this.calculateExpenseGrowth(startOfMonth, endOfMonth),
      revenueStructure,
      expenseStructure,
      recentTransactions: recentPayments.map(payment => ({
        id: payment.id,
        type: 'income',
        title: payment.serviceName,
        description: `Поступление • ${payment.student.user.name} ${payment.student.user.surname}`,
        amount: payment.amount,
        date: payment.paymentDate?.toISOString() || payment.createdAt.toISOString(),
      })),
      budgetRequests: budgetRequests.map(request => ({
        id: request.id,
        title: request.title,
        description: request.description || '',
        amount: request.totalAmount,
        status: request.status.toLowerCase(),
        priority: request.urgency.toLowerCase(),
      })),
    };
  }

  async getHRDashboard(userId: number) {
    const now = new Date();

    // Get HR statistics
    const [
      totalEmployees,
      activeTeachers,
      vacationData,
      pendingVacations,
      averageSalaryData
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: { in: ['TEACHER', 'ADMIN', 'HR', 'FINANCIST'] }
        }
      }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
      this.prisma.vacation.groupBy({
        by: ['status', 'type'],
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
        },
        _count: true,
      }),
      this.prisma.vacation.count({
        where: { status: 'pending' },
      }),
      this.prisma.salary.aggregate({
        where: {
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
        _avg: { totalNet: true },
      }),
    ]);

    // Calculate vacation statistics
    const onVacation = vacationData
      .filter(v => v.type === 'vacation')
      .reduce((sum, v) => sum + v._count, 0);

    const sickLeave = vacationData
      .filter(v => v.type === 'sick_leave')
      .reduce((sum, v) => sum + v._count, 0);

    // Get vacation requests
    const vacationRequests = await this.prisma.vacation.findMany({
      where: { status: 'pending' },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get upcoming birthdays (next 30 days)
    const nextMonth = new Date();
    nextMonth.setDate(now.getDate() + 30);

    const upcomingBirthdays = await this.prisma.user.count({
      where: {
        deletedAt: null,
        role: { in: ['TEACHER', 'ADMIN', 'HR', 'FINANCIST'] },
        // Note: For birthdays, we would need a birthDate field in the User model
        // For now, using mock data
      },
    });

    // Department analytics based on roles
    const departmentCounts = await this.prisma.user.groupBy({
      by: ['role'],
      where: {
        deletedAt: null,
        role: { in: ['TEACHER', 'ADMIN', 'HR', 'FINANCIST'] },
      },
      _count: true,
    });

    const departmentAnalytics = departmentCounts.map(dept => {
      let departmentName = '';
      switch (dept.role) {
        case 'TEACHER':
          departmentName = 'Преподавательский состав';
          break;
        case 'ADMIN':
          departmentName = 'Административный персонал';
          break;
        case 'HR':
          departmentName = 'HR департамент';
          break;
        case 'FINANCIST':
          departmentName = 'Финансовый департамент';
          break;
        default:
          departmentName = 'Другое';
      }

      return {
        department: departmentName,
        employeeCount: dept._count,
        percentage: totalEmployees > 0 ? Math.round((dept._count / totalEmployees) * 100) : 0,
      };
    });

    return {
      totalEmployees,
      activeTeachers,
      pendingApplications: 0, // No model for job applications
      onVacation,
      sickLeave,
      pendingTimeoffs: pendingVacations,
      upcomingBirthdays: 0, // No birthDate field in User model
      contractsExpiring: 0, // No contractEndDate field in Teacher model
      averageSalary: Math.round((averageSalaryData._avg.totalNet) || 0),
      turnoverRate: 0, // Can be calculated based on deletedAt in the future
      employeeStatus: {
        working: totalEmployees - onVacation - sickLeave,
        vacation: onVacation,
        sick: sickLeave,
      },
      vacationRequests: vacationRequests.map(request => ({
        id: request.id,
        type: request.type,
        employeeName: `${request.teacher.user.name} ${request.teacher.user.surname}`,
        dates: `${request.startDate.toLocaleDateString('ru-RU')} - ${request.endDate.toLocaleDateString('ru-RU')}`,
        duration: `${request.days} дней`,
        status: request.status,
        submittedAt: request.createdAt.toISOString(),
      })),
      departmentAnalytics,
      upcomingEvents: await this.getUpcomingHREvents(now),
    };
  }

  private async getUpcomingHREvents(now: Date) {
    // Get upcoming calendar events related to HR
    const upcomingEvents = await this.prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
        deletedAt: null,
        OR: [
          { title: { contains: 'собеседование', mode: 'insensitive' } },
          { title: { contains: 'аттестация', mode: 'insensitive' } },
          { title: { contains: 'встреча', mode: 'insensitive' } },
          { title: { contains: 'тренинг', mode: 'insensitive' } },
          { description: { contains: 'HR', mode: 'insensitive' } },
        ],
      },
      include: {
        createdBy: true,
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    // Map calendar events to HR events format
    const hrEvents = upcomingEvents.map(event => {
      let eventType = 'event';
      
      if (event.title.toLowerCase().includes('собеседование')) {
        eventType = 'interview';
      } else if (event.title.toLowerCase().includes('аттестация')) {
        eventType = 'evaluation';
      } else if (event.title.toLowerCase().includes('день рождения')) {
        eventType = 'birthday';
      } else if (event.title.toLowerCase().includes('контракт')) {
        eventType = 'contract_expiry';
      }

      return {
        id: event.id,
        type: eventType,
        title: event.title,
        description: event.description || `Событие запланировано на ${event.startDate.toLocaleDateString('ru-RU')}`,
        date: event.startDate.toISOString(),
      };
    });

    // Return only real calendar events, no fallback data
    return hrEvents;
  }

  private async calculateRevenueGrowth(startOfMonth: Date, endOfMonth: Date): Promise<number> {
    // Get current month revenue
    const currentRevenue = await this.prisma.payment.aggregate({
      where: {
        status: 'paid',
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    // Get previous month revenue
    const previousMonth = new Date(startOfMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const endOfPreviousMonth = new Date(startOfMonth);
    endOfPreviousMonth.setDate(0); // Last day of previous month

    const previousRevenue = await this.prisma.payment.aggregate({
      where: {
        status: 'paid',
        paymentDate: {
          gte: previousMonth,
          lte: endOfPreviousMonth,
        },
      },
      _sum: { amount: true },
    });

    const current = currentRevenue._sum.amount || 0;
    const previous = previousRevenue._sum.amount || 0;

    if (previous === 0) return 0;
    
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  private async calculateExpenseGrowth(startOfMonth: Date, endOfMonth: Date): Promise<number> {
    const currentMonth = startOfMonth.getMonth() + 1;
    const currentYear = startOfMonth.getFullYear();
    
    // Get current quarter expenses
    const currentQuarter = Math.ceil(currentMonth / 3);
    const currentExpenses = await this.prisma.budgetItem.aggregate({
      where: {
        type: 'EXPENSE',
        period: `${currentYear} Q${currentQuarter}`,
        deletedAt: null,
      },
      _sum: { actualAmount: true },
    });

    // Get previous quarter expenses
    let prevQuarter = currentQuarter - 1;
    let prevYear = currentYear;
    if (prevQuarter === 0) {
      prevQuarter = 4;
      prevYear = currentYear - 1;
    }

    const previousExpenses = await this.prisma.budgetItem.aggregate({
      where: {
        type: 'EXPENSE',
        period: `${prevYear} Q${prevQuarter}`,
        deletedAt: null,
      },
      _sum: { actualAmount: true },
    });

    const current = (currentExpenses._sum.actualAmount || 0) / 3; // Monthly estimate
    const previous = (previousExpenses._sum.actualAmount || 0) / 3;

    if (previous === 0) return 0;
    
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }
}
