export const scheduleGenerationSchema = {
  type: "object",
  properties: {
    generatedSchedule: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: {
            type: "string",
            enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
          },
          startTime: {
            type: "string",
            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
          },
          endTime: {
            type: "string",
            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
          },
          subject: {
            type: "string",
            minLength: 1,
            maxLength: 100
          },
          groupId: {
            type: "string",
            minLength: 1,
            maxLength: 50
          },
          teacherId: {
            type: "string",
            minLength: 1,
            maxLength: 50
          },
          teacherName: {
            type: "string",
            minLength: 1,
            maxLength: 100
          },
          roomId: {
            type: "string",
            minLength: 1,
            maxLength: 50
          },
          type: {
            type: "string",
            enum: ["lesson", "consultation", "extra"]
          },
          repeat: {
            type: "string",
            enum: ["weekly", "biweekly", "once"]
          },
          status: {
            type: "string",
            enum: ["upcoming", "completed", "cancelled"]
          },
          date: {
            type: "string",
            format: "date"
          },
          roomType: {
            type: "string"
          },
          roomCapacity: {
            type: "number",
            minimum: 1,
            maximum: 1000
          },
          groupSize: {
            type: "number",
            minimum: 1,
            maximum: 200
          }
        },
  // Требуем как day (день недели) так и date (конкретная дата)
  required: ["day", "startTime", "endTime", "subject", "groupId", "teacherId", "teacherName", "roomId", "type", "repeat", "status", "date", "roomType", "roomCapacity", "groupSize"],
        additionalProperties: false
      }
    },
    conflicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["teacher_conflict", "room_conflict", "group_conflict", "time_conflict", "capacity_conflict"]
          },
          description: {
            type: "string",
            minLength: 10,
            maxLength: 500
          },
          severity: {
            type: "string",
            enum: ["high", "medium", "low"]
          },
          affectedItems: {
            type: "array",
            items: {
              type: "number",
              minimum: 0
            }
          },
          solution: {
            type: "string",
            maxLength: 300
          },
          timeSlot: {
            type: "string"
          },
          conflictingRoom: {
            type: "string"
          },
          conflictingTeacher: {
            type: "string"
          }
        },
        required: ["type", "description", "severity", "affectedItems", "solution", "timeSlot", "conflictingRoom", "conflictingTeacher"],
        additionalProperties: false
      }
    },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["time_optimization", "room_optimization", "teacher_balancing", "workload_distribution", "break_optimization"]
          },
          description: {
            type: "string",
            minLength: 10,
            maxLength: 500
          },
          priority: {
            type: "string",
            enum: ["high", "medium", "low"]
          },
          affectedItems: {
            type: "array",
            items: {
              type: "number",
              minimum: 0
            }
          },
          reasoning: {
            type: "string",
            maxLength: 300
          },
          expectedImprovement: {
            type: "number",
            minimum: 0,
            maximum: 100
          }
        },
        required: ["type", "description", "priority", "affectedItems", "reasoning", "expectedImprovement"],
        additionalProperties: false
      }
    },
    reasoning: {
      type: "string",
      minLength: 50,
      maxLength: 2000
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1
    },
    statistics: {
      type: "object",
      properties: {
        totalLessons: {
          type: "number",
          minimum: 0
        },
        teachersCount: {
          type: "number",
          minimum: 0
        },
        roomsCount: {
          type: "number",
          minimum: 0
        },
        groupsCount: {
          type: "number",
          minimum: 0
        },
        roomUtilization: {
          type: "number",
          minimum: 0,
          maximum: 100
        },
        teacherWorkload: {
          type: "number",
          minimum: 0,
          maximum: 100
        },
        averageStudentGaps: {
          type: "number",
          minimum: 0
        },
        averageDailyLessons: {
          type: "number",
          minimum: 0
        }
      },
      required: ["totalLessons", "teachersCount", "roomsCount", "groupsCount", "roomUtilization", "teacherWorkload", "averageStudentGaps", "averageDailyLessons"],
      additionalProperties: false
    },
    generatedAt: {
      type: "string",
      format: "date-time"
    },
    aiModel: {
      type: "string"
    },
    algorithmVersion: {
      type: "string"
    }
  },
  required: ["generatedSchedule", "conflicts", "suggestions", "reasoning", "confidence", "statistics", "generatedAt", "aiModel", "algorithmVersion"],
  additionalProperties: false
};

export const scheduleAnalysisSchema = {
  type: "object",
  properties: {
    analysisResults: {
      type: "object",
      properties: {
        overallScore: {
          type: "number",
          minimum: 0,
          maximum: 100
        },
        efficiency: {
          type: "number",
          minimum: 0,
          maximum: 100
        },
        teacherSatisfaction: {
          type: "number",
          minimum: 0,
          maximum: 100
        },
        studentSatisfaction: {
          type: "number",
          minimum: 0,
          maximum: 100
        },
        resourceUtilization: {
          type: "number",
          minimum: 0,
          maximum: 100
        }
      },
      required: ["overallScore", "efficiency", "teacherSatisfaction", "studentSatisfaction", "resourceUtilization"]
    },
    detectedIssues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          issue: {
            type: "string"
          },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"]
          },
          impact: {
            type: "string"
          },
          recommendation: {
            type: "string"
          }
        },
        required: ["issue", "severity", "impact", "recommendation"]
      }
    },
    improvementOpportunities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          opportunity: {
            type: "string"
          },
          benefit: {
            type: "string"
          },
          implementation: {
            type: "string"
          },
          estimatedGain: {
            type: "number",
            minimum: 0,
            maximum: 100
          }
        },
        required: ["opportunity", "benefit", "implementation", "estimatedGain"]
      }
    },
    reasoning: {
      type: "string",
      minLength: 50,
      maxLength: 2000
    }
  },
  required: ["analysisResults", "detectedIssues", "improvementOpportunities", "reasoning"],
  additionalProperties: false
};
