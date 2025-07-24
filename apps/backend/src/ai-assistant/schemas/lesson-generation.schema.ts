export const lessonGenerationSchema = {
  type: "object",
  properties: {
    generatedLessons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Название урока"
          },
          date: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            description: "Дата урока в формате YYYY-MM-DD"
          },
          startTime: {
            type: "string",
            pattern: "^\\d{2}:\\d{2}$",
            description: "Время начала в формате HH:MM"
          },
          endTime: {
            type: "string",
            pattern: "^\\d{2}:\\d{2}$",
            description: "Время окончания в формате HH:MM"
          },
          studyPlanId: {
            type: "integer",
            description: "ID учебного плана"
          },
          studyPlanName: {
            type: "string",
            description: "Название предмета"
          },
          groupId: {
            type: "integer",
            description: "ID группы"
          },
          groupName: {
            type: "string",
            description: "Название группы"
          },
          teacherId: {
            type: "integer",
            description: "ID преподавателя"
          },
          teacherName: {
            type: "string",
            description: "Имя преподавателя"
          },
          classroomId: {
            type: "integer",
            description: "ID аудитории"
          },
          classroomName: {
            type: "string",
            description: "Название аудитории"
          },
          description: {
            type: "string",
            description: "Описание урока"
          },
          lessonNumber: {
            type: "integer",
            description: "Номер урока в последовательности"
          },
          topicNumber: {
            type: "integer",
            description: "Номер темы в курсе"
          },
          difficulty: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
            description: "Уровень сложности урока"
          }
        },
        required: [
          "name",
          "date", 
          "startTime",
          "endTime",
          "studyPlanId",
          "studyPlanName",
          "groupId",
          "groupName",
          "teacherId",
          "teacherName",
          "classroomId",
          "classroomName",
          "description",
          "lessonNumber",
          "topicNumber",
          "difficulty"
        ],
        additionalProperties: false
      }
    },
    summary: {
      type: "object",
      properties: {
        totalLessons: {
          type: "integer",
          description: "Общее количество сгенерированных уроков"
        },
        startDate: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description: "Дата начала периода"
        },
        endDate: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description: "Дата окончания периода"
        },
        academicYear: {
          type: "string",
          description: "Учебный год"
        },
        semester: {
          type: "integer",
          description: "Семестр"
        }
      },
      required: [
        "totalLessons",
        "startDate",
        "endDate",
        "academicYear",
        "semester"
      ],
      additionalProperties: false
    },
    analysis: {
      type: "object",
      properties: {
        overallScore: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Общая оценка качества расписания"
        },
        efficiency: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Эффективность использования ресурсов"
        },
        teacherSatisfaction: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Удовлетворенность преподавателей"
        },
        studentSatisfaction: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Удовлетворенность студентов"
        },
        resourceUtilization: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Использование ресурсов"
        }
      },
      required: [
        "overallScore",
        "efficiency", 
        "teacherSatisfaction",
        "studentSatisfaction",
        "resourceUtilization"
      ],
      additionalProperties: false
    },
    recommendations: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Рекомендации по улучшению"
    },
    conflicts: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Обнаруженные конфликты"
    },
    warnings: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Предупреждения"
    }
  },
  required: [
    "generatedLessons",
    "summary",
    "analysis",
    "recommendations",
    "conflicts",
    "warnings"
  ],
  additionalProperties: false
};
