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
      monthlyWorkload: completedLessons,
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

    // Get upcoming birthdays (next 30 days) - требует поле birthDate в User model
    // const nextMonth = new Date();
    // nextMonth.setDate(now.getDate() + 30);
    const upcomingBirthdays = 0; // Нет поля birthDate в User model

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

  // Widget data endpoints
  async getUserWidgets(userId: number) {
    try {
      const widgets = await this.prisma.dashboardWidget.findMany({
        where: { userId, isActive: true, deletedAt: null },
        orderBy: { order: 'asc' },
      });

      // Filter only allowed widget types
      const allowedTypes = new Set([
        'schedule','teacher-schedule','child-schedule','grades','child-grades','assignments','child-homework','attendance','child-attendance',
        'system-stats','finance-overview','system-alerts','activity-monitoring','school-attendance','teacher-workload','classroom-usage','grade-analytics','system-monitoring','news','tasks','birthdays'
      ]);

      const filtered = widgets
        .filter(w => allowedTypes.has(w.type))
        .map(widget => ({
          ...widget,
          size: this.convertSizeToDimensions(widget.size)
        }));

      return filtered;
    } catch (error) {
      console.error('Error fetching user widgets:', error);
      return [];
    }
  }

  async addWidget(userId: number, widgetData: any) {
    try {
      // Convert size to string if it's an object
      const size = typeof widgetData.size === 'object' ? widgetData.size.width : widgetData.size;
      
      const widget = await this.prisma.dashboardWidget.create({
        data: {
          userId,
          type: widgetData.type,
          title: widgetData.title,
          size: size,
          position: widgetData.position || { x: 0, y: 0, width: 2, height: 1 },
          config: widgetData.config || {},
        },
      });
      
      // Return widget with converted size
      return {
        ...widget,
        size: this.convertSizeToDimensions(widget.size)
      };
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  }

  async updateWidget(widgetId: string, widgetData: any) {
    try {
      // Convert size to string if it's an object
      const size = typeof widgetData.size === 'object' ? widgetData.size.width : widgetData.size;
      
      const widget = await this.prisma.dashboardWidget.update({
        where: { id: widgetId },
        data: {
          title: widgetData.title,
          size: size,
          position: widgetData.position,
          config: widgetData.config,
        },
      });
      
      // Return widget with converted size
      return {
        ...widget,
        size: this.convertSizeToDimensions(widget.size)
      };
    } catch (error) {
      console.error('Error updating widget:', error);
      throw error;
    }
  }

  async deleteWidget(widgetId: string) {
    try {
      await this.prisma.dashboardWidget.delete({
        where: { id: widgetId },
      });
    } catch (error) {
      console.error('Error deleting widget:', error);
      throw error;
    }
  }

  async getDashboardLayout(userId: number) {
    try {
      const widgets = await this.prisma.dashboardWidget.findMany({
        where: { userId, isActive: true, deletedAt: null },
        orderBy: { order: 'asc' },
      });

      return {
        userId,
        widgets: widgets.map(widget => ({
          ...widget,
          size: this.convertSizeToDimensions(widget.size)
        })),
        gridSettings: { columns: 4, gap: 4 },
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching dashboard layout:', error);
      return null;
    }
  }

  async saveDashboardLayout(userId: number, layoutData: any) {
    try {
      // Update widget positions and order
      if (layoutData.widgets && Array.isArray(layoutData.widgets)) {
        for (let i = 0; i < layoutData.widgets.length; i++) {
          const widget = layoutData.widgets[i];
          // Check if widget exists before updating
          const existingWidget = await this.prisma.dashboardWidget.findFirst({
            where: {
              id: widget.id,
              userId: userId,
              isActive: true,
              deletedAt: null
            }
          });

          if (existingWidget) {
            await this.prisma.dashboardWidget.update({
              where: { id: widget.id },
              data: {
                position: widget.position,
                order: i
              },
            });
          } else {
            console.warn(`Widget with id ${widget.id} not found for user ${userId}, skipping update`);
          }
        }
      }
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      throw error;
    }
  }

  async getWidgetData(userId: number, widgetType: string, config?: any) {
    try {
      // Get user to determine role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          student: { include: { group: true } },
          teacher: true,
          parent: { include: { students: { include: { group: true } } } },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check RBAC permissions for widget type
      if (!this.canAccessWidget(user.role, widgetType)) {
        throw new Error(`Access denied: User role ${user.role} cannot access widget ${widgetType}`);
      }

      // Route to appropriate widget data based on type and user role
      switch (widgetType) {
        case 'schedule':
        case 'teacher-schedule':
        case 'child-schedule':
          return await this.getScheduleWidgetData(user, config);

        case 'grades':
        case 'child-grades':
          return await this.getGradesWidgetData(user, config);

        case 'assignments':
        case 'child-homework':
          return await this.getAssignmentsWidgetData(user, config);

        case 'attendance':
        case 'child-attendance':
          return await this.getAttendanceWidgetData(user, config);

        case 'system-stats':
          return await this.getSystemStatsWidgetData();

        case 'finance-overview':
          return await this.getFinanceOverviewWidgetData();

        case 'system-alerts':
          return await this.getSystemAlertsWidgetData();

        case 'school-attendance':
          return await this.getSchoolAttendanceWidgetData();

        case 'teacher-workload':
          return await this.getTeacherWorkloadWidgetData();

        case 'classroom-usage':
          return await this.getClassroomUsageWidgetData();

        case 'grade-analytics':
          return await this.getGradeAnalyticsWidgetData();

        case 'activity-monitoring':
          return await this.getActivityMonitoringWidgetData();

        case 'system-monitoring':
          return await this.getSystemMonitoringWidgetData();

        case 'news':
        case 'school-events':
          return await this.getNewsWidgetData(config);

        case 'tasks':
          return await this.getTasksWidgetData(user, config);

        case 'birthdays':
          return await this.getBirthdaysWidgetData();

        default:
          return { message: 'Данные загружаются...', note: 'Виджет в разработке' };
      }
    } catch (error) {
      console.error(`Error fetching widget data for ${widgetType}:`, error);
      throw error;
    }
  }

  // Widget data methods
  private async getScheduleWidgetData(user: any, config?: any) {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

    let groupId: number | null = null;

    // Determine group based on user role
    if (user.student) {
      groupId = user.student.groupId;
    } else if (user.parent && user.parent.students.length > 0) {
      groupId = user.parent.students[0].groupId; // First child's group
    }

    if (!groupId) {
      return { lessons: [] };
    }

    const schedule = await this.prisma.schedule.findMany({
      where: {
        groupId: groupId,
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

    return {
      lessons: schedule.map(item => ({
        id: item.id,
        subject: item.studyPlan.name,
        time: `${item.startTime}-${item.endTime}`,
        classroom: item.classroom?.name || 'Не назначен',
        teacher: `${item.teacher.user.name} ${item.teacher.user.surname}`,
      })),
    };
  }

  private async getGradesWidgetData(user: any, config?: any) {
    let studentId: number | null = null;

    if (user.student) {
      studentId = user.student.id;
    } else if (user.parent && user.parent.students.length > 0) {
      studentId = user.parent.students[0].id; // First child
    }

    if (!studentId) {
      return {
        averageGrade: 0,
        lastGrades: [],
        gradeDistribution: { 5: 0, 4: 0, 3: 0, 2: 0 },
        trend: 'stable'
      };
    }

    const results = await this.prisma.lessonResult.findMany({
      where: {
        studentId: studentId,
        lessonScore: { not: null },
      },
      include: {
        Lesson: {
          include: {
            studyPlan: {
              include: {
                teacher: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const grades = results.map(r => r.lessonScore).filter(g => g !== null);
    const averageGrade = grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0;

    // Grade distribution
    const gradeDistribution = {
      5: grades.filter(g => g === 5).length,
      4: grades.filter(g => g === 4).length,
      3: grades.filter(g => g === 3).length,
      2: grades.filter(g => g === 2).length,
    };

    // Calculate trend (compare last 5 with previous 5)
    const recentGrades = grades.slice(0, 5);
    const previousGrades = grades.slice(5, 10);
    const recentAvg = recentGrades.length > 0 ? recentGrades.reduce((sum, grade) => sum + grade, 0) / recentGrades.length : 0;
    const previousAvg = previousGrades.length > 0 ? previousGrades.reduce((sum, grade) => sum + grade, 0) / previousGrades.length : 0;

    let trend = 'stable';
    if (recentAvg > previousAvg) trend = 'up';
    else if (recentAvg < previousAvg) trend = 'down';

    return {
      averageGrade: Math.round(averageGrade * 10) / 10,
      lastGrades: results.slice(0, 5).map(result => ({
        subject: result.Lesson?.studyPlan?.name || 'Неизвестно',
        grade: result.lessonScore,
        date: result.createdAt.toLocaleDateString('ru-RU'),
        teacher: `${result.Lesson?.studyPlan?.teacher?.user?.name || ''} ${result.Lesson?.studyPlan?.teacher?.user?.surname || ''}`.trim() || 'Неизвестно',
      })),
      gradeDistribution,
      trend,
    };
  }

  private async getAssignmentsWidgetData(user: any, config?: any) {
    let studentId: number | null = null;

    if (user.student) {
      studentId = user.student.id;
    } else if (user.parent && user.parent.students.length > 0) {
      studentId = user.parent.students[0].id; // First child
    }

    if (!studentId) {
      return { assignments: [] };
    }

    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: {
        studentId: studentId,
        status: 'PENDING',
      },
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
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      assignments: submissions.map(submission => ({
        id: submission.id,
        title: submission.homework.name,
        dueDate: submission.homework.deadline.toLocaleDateString('ru-RU'),
        subject: submission.homework.lesson?.studyPlan?.name || 'Общее',
        teacher: 'Неизвестно',
      })),
    };
  }

  private async getAttendanceWidgetData(user: any, config?: any) {
    let studentId: number | null = null;

    if (user.student) {
      studentId = user.student.id;
    } else if (user.parent && user.parent.students.length > 0) {
      studentId = user.parent.students[0].id; // First child
    }

    if (!studentId) {
      return {
        currentMonth: {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          percentage: 0
        },
        recentAttendance: [],
        weeklyStats: {
          thisWeek: 0,
          lastWeek: 0,
          trend: 'stable'
        }
      };
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Получаем все результаты уроков за текущий месяц
    const monthlyResults = await this.prisma.lessonResult.findMany({
      where: {
        studentId: studentId,
        createdAt: {
          gte: startOfMonth,
        }
      },
      include: {
        Lesson: {
          include: {
            studyPlan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Группируем по дням для точного подсчета
    const dailyAttendance = {};
    monthlyResults.forEach(result => {
      const date = new Date(result.createdAt).toDateString();
      if (!dailyAttendance[date]) {
        dailyAttendance[date] = {
          lessons: 0,
          attended: 0,
          hasAttendanceRecord: false,
          status: 'absent',
          note: null
        };
      }

      dailyAttendance[date].lessons++;

      // Проверяем посещаемость по полю attendance
      if (result.attendance === true) {
        dailyAttendance[date].attended++;
        dailyAttendance[date].hasAttendanceRecord = true;
        dailyAttendance[date].status = 'present';
      } else if (result.attendance === false) {
        // Явно помечен как отсутствующий
        dailyAttendance[date].hasAttendanceRecord = true;
        dailyAttendance[date].status = 'absent';
        if (result.absentReason) {
          const reasonMap = {
            'SICK': 'Болезнь',
            'FAMILY': 'Семейные обстоятельства',
            'OTHER': 'Другая причина'
          };
          dailyAttendance[date].note = reasonMap[result.absentReason] || result.absentComment || 'Причина не указана';
        }
      } else if (result.lessonScore !== null && result.lessonScore > 0) {
        // Если есть оценка, считаем что присутствовал (fallback)
        dailyAttendance[date].attended++;
        dailyAttendance[date].status = 'present';
        dailyAttendance[date].note = 'Получена оценка';
      }
    });

    // Подсчитываем статистику по дням
    const totalDays = Object.keys(dailyAttendance).length;
    const presentDays = Object.values(dailyAttendance).filter((day: any) => day.status === 'present').length;
    const absentDays = totalDays - presentDays;
    const lateDays = 0; // Пока не реализовано в схеме
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Последние 7 дней для детальной статистики
    const last7Days = Object.entries(dailyAttendance)
      .slice(0, 7)
      .map(([dateStr, data]: [string, any]) => ({
        date: new Date(dateStr).toISOString().split('T')[0],
        status: data.status,
        lessons: data.lessons,
        note: data.note
      }));

    // Статистика по неделям
    const startOfThisWeek = new Date(currentDate);
    startOfThisWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Понедельник

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const thisWeekResults = monthlyResults.filter(result =>
      new Date(result.createdAt) >= startOfThisWeek
    );

    const lastWeekResults = monthlyResults.filter(result => {
      const date = new Date(result.createdAt);
      return date >= startOfLastWeek && date < startOfThisWeek;
    });

    const thisWeekAttended = thisWeekResults.filter(r => r.attendance === true || (r.lessonScore !== null && r.attendance !== false)).length;
    const thisWeekTotal = thisWeekResults.length;
    const thisWeek = thisWeekTotal > 0 ? Math.round((thisWeekAttended / thisWeekTotal) * 100) : 0;

    const lastWeekAttended = lastWeekResults.filter(r => r.attendance === true || (r.lessonScore !== null && r.attendance !== false)).length;
    const lastWeekTotal = lastWeekResults.length;
    const lastWeekStats = lastWeekTotal > 0 ? Math.round((lastWeekAttended / lastWeekTotal) * 100) : 0;

    const trend = thisWeek > lastWeekStats ? 'up' : thisWeek < lastWeekStats ? 'down' : 'stable';

    return {
      currentMonth: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        percentage
      },
      recentAttendance: last7Days,
      weeklyStats: {
        thisWeek,
        lastWeek: lastWeekStats,
        trend
      }
    };
  }

  private async getSystemStatsWidgetData() {
    const [totalStudents, totalTeachers, totalGroups, totalSubjects] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
      this.prisma.group.count({ where: { deletedAt: null } }),
      this.prisma.studyPlan.count({ where: { deletedAt: null } }),
    ]);

    const activeUsers = await this.prisma.user.count({
      where: {
        deletedAt: null,
        // Could add lastLogin filter here if we had that field
      },
    });

    return {
      totalStudents,
      totalTeachers,
      totalGroups,
      totalSubjects,
      activeUsers,
      systemUptime: '99.8%', // Mock data
    };
  }

  private async getFinanceOverviewWidgetData() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    try {
      // Получаем доходы от платежей за текущий месяц
      const monthlyPayments = await this.prisma.payment.aggregate({
        where: {
          status: 'paid',
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          deletedAt: null
        },
        _sum: { amount: true },
      });

      // Получаем общие доходы за год
      const startOfYear = new Date(currentYear, 0, 1);
      const yearlyPayments = await this.prisma.payment.aggregate({
        where: {
          status: 'paid',
          paymentDate: { gte: startOfYear },
          deletedAt: null
        },
        _sum: { amount: true },
      });

      // Получаем задолженности (неоплаченные платежи)
      const unpaidPayments = await this.prisma.payment.aggregate({
        where: {
          status: { in: ['pending', 'unpaid', 'overdue'] },
          deletedAt: null
        },
        _sum: { amount: true },
      });

      // Получаем расходы из бюджета за текущий месяц
      // Берем фактические расходы за месяц, а не квартал
      const monthlyExpenses = await this.prisma.budgetItem.findMany({
        where: {
          type: 'EXPENSE',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          deletedAt: null,
        },
      });

      const totalExpenses = monthlyExpenses.reduce((sum, item) => {
        // Используем plannedAmount если actualAmount равен 0
        return sum + (item.actualAmount > 0 ? item.actualAmount : item.plannedAmount);
      }, 0);

      const totalRevenue = yearlyPayments._sum.amount || 0;
      const monthlyRevenue = monthlyPayments._sum.amount || 0;
      const unpaidFees = unpaidPayments._sum.amount || 0;

      // Рассчитываем рост доходов по сравнению с прошлым месяцем
      const startOfPreviousMonth = new Date(currentYear, currentMonth - 2, 1);
      const endOfPreviousMonth = new Date(currentYear, currentMonth - 1, 0);

      const previousMonthPayments = await this.prisma.payment.aggregate({
        where: {
          status: 'paid',
          paymentDate: {
            gte: startOfPreviousMonth,
            lte: endOfPreviousMonth
          },
          deletedAt: null
        },
        _sum: { amount: true },
      });

      const previousRevenue = previousMonthPayments._sum.amount || 0;
      const monthlyGrowth = previousRevenue > 0
        ? Math.round(((monthlyRevenue - previousRevenue) / previousRevenue) * 100 * 10) / 10
        : monthlyRevenue > 0 ? 100 : 0;

      return {
        totalRevenue: monthlyRevenue, // Показываем месячный доход, а не годовой
        totalExpenses,
        netProfit: monthlyRevenue - totalExpenses,
        unpaidFees,
        monthlyGrowth,
      };
    } catch (error) {
      console.error('Error in getFinanceOverviewWidgetData:', error);

      // Возвращаем нулевые значения при ошибке
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        unpaidFees: 0,
        monthlyGrowth: 0,
      };
    }
  }

  private async getSystemAlertsWidgetData() {
    const notifications = await this.prisma.notification.findMany({
      where: { read: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const critical = notifications.filter(n => n.type === 'critical').length;
    const warnings = notifications.filter(n => n.type === 'warning').length;
    const info = notifications.length - critical - warnings;

    return {
      critical,
      warnings,
      info,
      alerts: notifications.slice(0, 5).map(notification => ({
        id: notification.id,
        type: notification.type || 'info',
        message: notification.message,
        time: notification.createdAt.toLocaleString('ru-RU'),
      })),
    };
  }

  private async getSchoolAttendanceWidgetData() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    // Get all lesson results for this week
    const weekResults = await this.prisma.lessonResult.findMany({
      where: {
        createdAt: {
          gte: startOfWeek,
          lte: today,
        },
      },
      include: {
        Student: {
          include: {
            group: true,
          },
        },
      },
    });

    const totalRecords = weekResults.length;
    const attendedRecords = weekResults.filter(r => r.attendance === true).length;
    const overall = totalRecords > 0 ? Math.round((attendedRecords / totalRecords) * 100) : 0;

    // Group by grades
    const gradeGroups = await this.prisma.group.findMany({
      where: { deletedAt: null },
      include: {
        students: {
          include: {
            lessonsResults: {
              where: {
                createdAt: {
                  gte: startOfWeek,
                  lte: today,
                },
              },
            },
          },
        },
      },
    });

    const byGrade = gradeGroups.map(group => {
      const allResults = group.students.flatMap(s => s.lessonsResults);
      const attended = allResults.filter(r => r.attendance === true).length;
      const total = allResults.length;
      const attendance = total > 0 ? Math.round((attended / total) * 100) : 0;

      return {
        grade: group.name,
        attendance,
        students: group.students.length,
      };
    });

    return {
      overall,
      trend: '+2.1%', // Mock data
      trendDirection: 'up',
      byGrade,
      today: {
        present: attendedRecords,
        absent: totalRecords - attendedRecords,
        late: 0, // Would need a separate field for this
        total: totalRecords,
      },
    };
  }

  private async getTeacherWorkloadWidgetData() {
    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
        studyPlans: {
          include: {
            group: true,
          },
        },
        schedules: true,
      },
    });

    const teacherData = teachers.map(teacher => {
      const hours = teacher.schedules.length * 2; // Approximate hours per week
      const groups = teacher.studyPlans.reduce((total, plan) => total + plan.group.length, 0);
      const subjects = [...new Set(teacher.studyPlans.map(plan => plan.name))];

      let status = 'normal';
      if (hours > 25) status = 'overloaded';
      else if (hours > 20) status = 'optimal';
      else status = 'underloaded';

      return {
        name: `${teacher.user.name} ${teacher.user.surname}`,
        hours,
        subjects: subjects.slice(0, 2), // Show first 2 subjects
        groups,
        status,
      };
    });

    const averageHours = teacherData.length > 0 ? teacherData.reduce((sum, t) => sum + t.hours, 0) / teacherData.length : 0;
    const overloaded = teacherData.filter(t => t.status === 'overloaded').length;
    const underloaded = teacherData.filter(t => t.status === 'underloaded').length;

    return {
      averageHours: Math.round(averageHours * 10) / 10,
      totalTeachers: teachers.length,
      overloadedTeachers: overloaded,
      underloadedTeachers: underloaded,
      teachers: teacherData.slice(0, 6),
      distribution: {
        overloaded,
        optimal: teacherData.filter(t => t.status === 'optimal').length,
        underloaded,
      },
    };
  }

  private async getClassroomUsageWidgetData() {
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    const classrooms = await this.prisma.classroom.findMany({
      where: { deletedAt: null },
    });

    const activeSchedules = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek: dayOfWeek,
        // Would need to parse startTime/endTime for proper filtering
      },
      include: {
        studyPlan: true,
        group: true,
        teacher: {
          include: {
            user: true,
          },
        },
        classroom: true,
      },
    });

    const occupiedRooms = activeSchedules.length;
    const freeRooms = classrooms.length - occupiedRooms;
    const utilizationRate = classrooms.length > 0 ? Math.round((occupiedRooms / classrooms.length) * 100) : 0;

    const rooms = classrooms.slice(0, 6).map((classroom, index) => {
      const schedule = activeSchedules.find(s => s.classroomId === classroom.id);

      if (schedule) {
        return {
          number: classroom.name,
          status: 'occupied',
          subject: schedule.studyPlan.name,
          teacher: `${schedule.teacher.user.name} ${schedule.teacher.user.surname}`,
          group: schedule.group.name,
          timeLeft: '25 мин', // Mock data
          nextClass: '14:00 - Физика',
        };
      } else {
        return {
          number: classroom.name,
          status: 'free',
          nextClass: '14:00 - Английский',
          teacher: 'Не назначен',
          group: 'Не назначена',
        };
      }
    });

    return {
      totalRooms: classrooms.length,
      occupiedRooms,
      freeRooms,
      utilizationRate,
      rooms,
      floors: [
        { floor: '1 этаж', total: Math.ceil(classrooms.length / 3), occupied: Math.ceil(occupiedRooms / 3), utilization: utilizationRate },
        { floor: '2 этаж', total: Math.ceil(classrooms.length / 3), occupied: Math.ceil(occupiedRooms / 3), utilization: utilizationRate },
        { floor: '3 этаж', total: Math.floor(classrooms.length / 3), occupied: Math.floor(occupiedRooms / 3), utilization: utilizationRate },
      ],
    };
  }

  private async getGradeAnalyticsWidgetData() {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Получаем все результаты уроков с оценками
    const results = await this.prisma.lessonResult.findMany({
      where: {
        lessonScore: { not: null },
        createdAt: {
          gte: startOfMonth, // Фокусируемся на текущем месяце
        },
      },
      include: {
        Lesson: {
          include: {
            studyPlan: true,
          },
        },
        Student: {
          include: {
            group: true,
          },
        },
      },
    });

    const grades = results.map(r => r.lessonScore).filter(g => g !== null);
    const averageGrade = grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0;
    const totalGrades = grades.length;

    // Рассчитываем тренд по сравнению с прошлым месяцем
    const startOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const previousResults = await this.prisma.lessonResult.findMany({
      where: {
        lessonScore: { not: null },
        createdAt: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth,
        },
      },
    });

    const previousGrades = previousResults.map(r => r.lessonScore).filter(g => g !== null);
    const previousAverageGrade = previousGrades.length > 0 ? previousGrades.reduce((sum, grade) => sum + grade, 0) / previousGrades.length : 0;
    const trend = averageGrade > previousAverageGrade ? 'up' : averageGrade < previousAverageGrade ? 'down' : 'stable';
    const trendValue = previousAverageGrade > 0 ? ((averageGrade - previousAverageGrade) / previousAverageGrade * 100).toFixed(1) : '0.0';

    // Распределение оценок
    const gradeDistribution = [
      { grade: '5', count: grades.filter(g => g === 5).length, percentage: 0 },
      { grade: '4', count: grades.filter(g => g === 4).length, percentage: 0 },
      { grade: '3', count: grades.filter(g => g === 3).length, percentage: 0 },
      { grade: '2', count: grades.filter(g => g === 2).length, percentage: 0 },
    ];

    gradeDistribution.forEach(item => {
      item.percentage = grades.length > 0 ? Math.round((item.count / grades.length) * 100) : 0;
    });

    // Аналитика по предметам с количеством оценок
    const subjectGrades: Record<string, number[]> = {};
    results.forEach(result => {
      const subject = result.Lesson?.studyPlan?.name;
      if (subject && result.lessonScore !== null) {
        if (!subjectGrades[subject]) {
          subjectGrades[subject] = [];
        }
        subjectGrades[subject].push(result.lessonScore);
      }
    });

    const topSubjects = Object.entries(subjectGrades)
      .map(([subject, subjectGradeList]) => ({
        subject,
        average: Math.round((subjectGradeList.reduce((sum, grade) => sum + grade, 0) / subjectGradeList.length) * 10) / 10,
        count: subjectGradeList.length,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);

    // Анализ по классам
    const classesPerformance: Record<string, { grades: number[], students: Set<number> }> = {};
    results.forEach(result => {
      const className = result.Student?.group?.name;
      if (className && result.lessonScore !== null) {
        if (!classesPerformance[className]) {
          classesPerformance[className] = { grades: [], students: new Set() };
        }
        classesPerformance[className].grades.push(result.lessonScore);
        classesPerformance[className].students.add(result.studentId);
      }
    });

    const classAnalytics = Object.entries(classesPerformance)
      .map(([className, data]) => ({
        class: className,
        average: Math.round((data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length) * 10) / 10,
        students: data.students.size,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);

    return {
      averageGrade: Math.round(averageGrade * 10) / 10,
      totalGrades,
      trend,
      trendValue: `${trend === 'up' ? '+' : trend === 'down' ? '' : ''}${trendValue}`,
      trendDirection: trend,
      gradeDistribution,
      topSubjects,
      classesPerformance: classAnalytics,
    };
  }

  private async getActivityMonitoringWidgetData() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get active users (with sessions in last 24 hours)
    const activeSessions = await this.prisma.userSession.findMany({
      where: {
        lastActivityAt: {
          gte: last24Hours,
        },
        status: 'ACTIVE',
      },
      include: {
        user: true,
      },
    });

    const activeUsers = activeSessions.length;
    const onlineStudents = activeSessions.filter(s => s.user.role === 'STUDENT').length;
    const onlineTeachers = activeSessions.filter(s => s.user.role === 'TEACHER').length;

    // Calculate average session time
    const completedSessions = await this.prisma.userSession.findMany({
      where: {
        status: 'EXPIRED',
        logoutAt: {
          gte: last24Hours,
        },
      },
    });

    const totalSessionTime = completedSessions.reduce((total, session) => {
      if (session.logoutAt && session.loginAt) {
        return total + (session.logoutAt.getTime() - session.loginAt.getTime());
      }
      return total;
    }, 0);

    const averageSessionTime = completedSessions.length > 0
      ? Math.round(totalSessionTime / completedSessions.length / (1000 * 60)) // in minutes
      : 0;

    // Get top activities from activity logs
    const activityLogs = await this.prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
      take: 100,
    });

    const activityCounts: Record<string, number> = {};
    activityLogs.forEach(log => {
      const activity = log.action || log.type;
      activityCounts[activity] = (activityCounts[activity] || 0) + 1;
    });

    const topActivities = Object.entries(activityCounts)
      .map(([name, count]) => ({
        name,
        users: count,
        percentage: activityLogs.length > 0 ? Math.round((count / activityLogs.length) * 100) : 0,
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 4);

    // Get recent activity
    const recentActivity = await this.prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 30 * 60 * 1000), // Last 30 minutes
        },
        type: { in: ['LOGIN', 'CREATE', 'UPDATE'] },
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const formattedRecentActivity = recentActivity.map(activity => {
      const timeAgo = Math.round((now.getTime() - activity.createdAt.getTime()) / (1000 * 60));
      let actionText = activity.action || 'Неизвестное действие';
      let type = 'login';

      if (activity.type === 'CREATE') {
        actionText = 'Создал запись';
        type = 'content';
      } else if (activity.type === 'UPDATE') {
        actionText = 'Обновил данные';
        type = 'content';
      } else if (activity.type === 'LOGIN') {
        actionText = 'Вошел в систему';
        type = 'login';
      }

      return {
        user: `${activity.user.name} ${activity.user.surname}`,
        action: actionText,
        time: timeAgo === 0 ? 'только что' : `${timeAgo} мин назад`,
        type,
      };
    });

    return {
      activeUsers,
      onlineStudents,
      onlineTeachers,
      averageSessionTime: `${Math.floor(averageSessionTime / 60)}ч ${averageSessionTime % 60}м`,
      topActivities,
      locationData: [
        { location: 'Веб-платформа', users: Math.round(activeUsers * 0.6), percentage: 60 },
        { location: 'Мобильное приложение', users: Math.round(activeUsers * 0.4), percentage: 40 },
      ],
      recentActivity: formattedRecentActivity,
    };
  }

  private async getSystemMonitoringWidgetData() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Активные сессии
    const activeSessions = await this.prisma.userSession.count({
      where: {
        status: 'ACTIVE',
        lastActivityAt: {
          gte: new Date(now.getTime() - 30 * 60 * 1000) // активные в последние 30 минут
        }
      }
    });

    // Статистика за последние 24 часа
    const [
      totalSessions,
      totalActivities,
      uniqueUsers,
      errorLogs
    ] = await Promise.all([
      this.prisma.userSession.count({
        where: {
          loginAt: { gte: last24Hours }
        }
      }),
      this.prisma.activityLog.count({
        where: {
          createdAt: { gte: last24Hours }
        }
      }),
      this.prisma.userSession.groupBy({
        by: ['userId'],
        where: {
          lastActivityAt: { gte: last24Hours }
        }
      }),
      this.prisma.activityLog.count({
        where: {
          createdAt: { gte: last24Hours },
          success: false
        }
      })
    ]);

    // Среднее время сессии
    const completedSessions = await this.prisma.userSession.findMany({
      where: {
        status: 'EXPIRED',
        logoutAt: {
          gte: last24Hours,
        },
      },
      select: {
        loginAt: true,
        logoutAt: true,
      },
    });

    const totalSessionTime = completedSessions.reduce((total, session) => {
      if (session.logoutAt && session.loginAt) {
        return total + (session.logoutAt.getTime() - session.loginAt.getTime());
      }
      return total;
    }, 0);

    const averageSessionTime = completedSessions.length > 0
      ? Math.round(totalSessionTime / completedSessions.length / (1000 * 60)) // в минутах
      : 0;

    // Топ активности
    const topActivities = await this.prisma.activityLog.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: last24Hours }
      },
      _count: {
        type: true
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      },
      take: 5
    });

    // Производительность системы (на основе логов активности)
    const requestsPerSecond = Math.round(totalActivities / (24 * 60 * 60)); // примерно
    const errorRate = totalActivities > 0 ? Math.round((errorLogs / totalActivities) * 100 * 10) / 10 : 0;

    // Сервисы (на основе активности)
    const services = [
      {
        name: 'Web Server',
        status: errorRate < 5 ? 'running' : 'warning',
        uptime: '15 дней',
        load: Math.min(100, Math.round((requestsPerSecond / 10) * 100)) // примерная нагрузка
      },
      {
        name: 'Database',
        status: 'running',
        uptime: '30 дней',
        load: Math.min(100, Math.round((totalActivities / 1000) * 100))
      },
      {
        name: 'User Sessions',
        status: activeSessions > 0 ? 'running' : 'warning',
        uptime: `${activeSessions} активных`,
        load: Math.min(100, Math.round((activeSessions / 100) * 100))
      },
      {
        name: 'Activity Monitoring',
        status: 'running',
        uptime: '8 дней',
        load: Math.min(100, Math.round((totalActivities / 500) * 100))
      }
    ];

    // Недавние события
    const recentAlerts = await this.prisma.activityLog.findMany({
      where: {
        success: false,
        createdAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) } // последние 2 часа
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        type: true,
        action: true,
        createdAt: true,
        errorMessage: true
      }
    });

    return {
      serverStatus: errorRate < 10 ? 'healthy' : 'warning',
      cpuUsage: Math.min(100, Math.round((requestsPerSecond / 5) * 100)), // симуляция на основе нагрузки
      memoryUsage: Math.min(100, Math.round((activeSessions / 50) * 100 + 30)), // базовые 30% + активные сессии
      diskUsage: 82.1, // можно добавить реальный мониторинг диска
      networkLatency: errorRate < 5 ? 12 : 25,
      activeConnections: activeSessions,
      uptime: '15 дней 4 часа',
      services,
      performance: {
        requestsPerSecond,
        responseTime: errorRate < 5 ? 234 : 456,
        errorRate,
        throughput: `${Math.round(totalActivities / 1000)} к/ч`
      },
      alerts: recentAlerts.map(alert => ({
        type: 'error',
        message: alert.errorMessage || `Ошибка ${alert.type}: ${alert.action}`,
        time: alert.createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      })),
      stats: {
        totalSessions,
        totalActivities,
        uniqueUsers: uniqueUsers.length,
        averageSessionTime: `${Math.floor(averageSessionTime / 60)}ч ${averageSessionTime % 60}м`
      }
    };
  }

  private async getNewsWidgetData(config?: any) {
    // Get notifications as news/events
    const notifications = await this.prisma.notification.findMany({
      where: {
        type: { in: ['news', 'event', 'announcement'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      articles: notifications.map(notification => ({
        id: notification.id,
        title: notification.message.split('•')[0]?.trim() || 'Новость',
        content: notification.message,
        date: notification.createdAt.toLocaleDateString('ru-RU'),
        author: 'Администрация',
      })),
    };
  }

  private async getTasksWidgetData(user: any, config?: any) {
    // For students - get homework as tasks
    if (user.student) {
      const submissions = await this.prisma.homeworkSubmission.findMany({
        where: {
          studentId: user.student.id,
          status: 'PENDING',
        },
        include: {
          homework: true,
        },
        take: 5,
      });

      return {
        tasks: submissions.map(submission => ({
          id: submission.id,
          title: submission.homework.name,
          completed: false,
          dueDate: submission.homework.deadline.toLocaleDateString('ru-RU'),
          priority: new Date() > submission.homework.deadline ? 'high' : 'medium',
        })),
      };
    }

    // For teachers - get pending grading as tasks
    if (user.teacher) {
      const submissions = await this.prisma.homeworkSubmission.findMany({
        where: {
          status: 'PENDING',
          homework: {
            lesson: {
              studyPlan: {
                teacherId: user.teacher.id,
              },
            },
          },
        },
        include: {
          homework: true,
          student: {
            include: {
              user: true,
            },
          },
        },
        take: 5,
      });

      return {
        tasks: submissions.map(submission => ({
          id: submission.id,
          title: `Проверить: ${submission.homework.name}`,
          completed: false,
          dueDate: submission.homework.deadline.toLocaleDateString('ru-RU'),
          priority: 'medium',
        })),
      };
    }

    return { tasks: [] };
  }

  private async getBirthdaysWidgetData() {
    // Поскольку в модели User нет поля birthDate, возвращаем пустые данные
    // В будущем можно добавить поле birthDate в схему Prisma
    return {
      upcomingBirthdays: [],
      todayBirthdays: [],
      thisWeekBirthdays: 0,
      thisMonthBirthdays: 0,
      message: 'Для работы виджета дней рождений необходимо добавить поле birthDate в модель User'
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

  // RBAC method for widget access control
  private canAccessWidget(userRole: string, widgetType: string): boolean {
    const widgetPermissions = {
      'schedule': ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'],
      'grades': ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'],
      'assignments': ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'],
      'attendance': ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'],
      'tasks': ['STUDENT', 'TEACHER', 'ADMIN', "FINANCIST", "HR"],
      'news': ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN', 'HR', 'FINANCIST'],
      'weather': ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN', 'HR', 'FINANCIST'],
      'child-schedule': ['PARENT', 'ADMIN'],
      'child-grades': ['PARENT', 'ADMIN'],
      'child-homework': ['PARENT', 'ADMIN'],
      'child-attendance': ['PARENT', 'ADMIN'],
      'teacher-schedule': ['TEACHER', 'ADMIN'],
      'teacher-workload': ['TEACHER', 'ADMIN', 'HR'],
      'system-stats': ['ADMIN'],
      'system-alerts': ['ADMIN'],
      'system-monitoring': ['ADMIN'],
      'school-attendance': ['ADMIN', 'TEACHER'],
      'grade-analytics': ['ADMIN', 'TEACHER'],
      'classroom-usage': ['ADMIN', 'TEACHER'],
      'finance-overview': ['ADMIN', 'FINANCIST'],
      'activity-monitoring': ['ADMIN', 'HR'],
      'school-events': ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN', 'HR', 'FINANCIST']
    };

    const allowedRoles = widgetPermissions[widgetType];
    return allowedRoles ? allowedRoles.includes(userRole) : userRole === 'ADMIN';
  }

  // Additional widget endpoints
  async getFinanceOverview(user: any) {
    // Check permissions
    if (!['ADMIN', 'FINANCIST'].includes(user.role)) {
      throw new Error('Access denied');
    }

    return this.getFinanceOverviewWidgetData();
  }

  async getSystemAlerts(user: any) {
    // Check permissions
    if (!['ADMIN'].includes(user.role)) {
      throw new Error('Access denied');
    }

    return this.getSystemAlertsWidgetData();
  }

  async getClassroomUsage(user: any) {
    // Check permissions
    if (!['ADMIN', 'TEACHER'].includes(user.role)) {
      throw new Error('Access denied');
    }

    return this.getClassroomUsageWidgetData();
  }

  async getTeacherWorkload(user: any) {
    // Check permissions
    if (!['ADMIN', 'HR', 'TEACHER'].includes(user.role)) {
      throw new Error('Access denied');
    }

    return this.getTeacherWorkloadWidgetData();
  }

  private convertSizeToDimensions(size: any): { width: string; height: string } {
    // If size is already an object, return it
    if (typeof size === 'object' && size.width && size.height) {
      return size;
    }
    
    // If size is a string, convert it to dimensions
    const sizeString = size as string;
    return {
      width: sizeString || 'medium',
      height: sizeString || 'medium'
    };
  }
}
