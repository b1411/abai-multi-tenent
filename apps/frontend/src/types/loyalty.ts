export interface StudentReview {
  id: number;
  studentId: number;
  teacherId: number;
  groupId: number;
  rating: number;
  comment: string;
  likes: number;
  helpful: number;
  isModerated: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  teacher: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
    };
  };
  group: {
    id: number;
    name: string;
  };
  reactions: ReviewReaction[];
}

export interface ReviewReaction {
  id: number;
  reviewId: number;
  userId: number;
  type: 'like' | 'helpful';
  createdAt: string;
  user: {
    id: number;
    name: string;
    surname: string;
  };
}

export interface CreateReviewRequest {
  teacherId: number;
  groupId: number;
  rating: number;
  comment: string;
}

export interface LoyaltyFilter {
  type?: 'group' | 'direction' | 'teacher' | 'academy';
  period?: 'month' | 'quarter' | 'year';
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
  teacherId?: number;
  groupId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LoyaltyAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    rating: number;
    _count: {
      rating: number;
    };
  }[];
  topTeachers: {
    teacherId: number;
    _avg: {
      rating: number;
    };
    _count: {
      rating: number;
    };
    teacher: {
      id: number;
      user: {
        id: number;
        name: string;
        surname: string;
      };
    };
  }[];
}

export interface LoyaltyTrends {
  period: string;
  average_rating: number;
  review_count: number;
}

export interface TeacherAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    rating: number;
    _count: {
      rating: number;
    };
  }[];
  recentReviews: StudentReview[];
}

export interface GroupAnalytics {
  totalReviews: number;
  averageRating: number;
  teacherRatings: {
    teacherId: number;
    _avg: {
      rating: number;
    };
    _count: {
      rating: number;
    };
    teacher: {
      id: number;
      user: {
        id: number;
        name: string;
        surname: string;
      };
    };
  }[];
}

export interface LoyaltySummary {
  totalReviews: number;
  averageRating: number;
  activeTeachers: number;
  activeGroups: number;
  satisfactionRate: number;
  repeatPurchaseRate?: number;
}

export interface ReviewsResponse {
  data: StudentReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Метрики лояльности, агрегированные из ответов на feedback-формы
export interface FeedbackBasedLoyalty {
  period: string;
  totalResponses: number;
  averageSatisfaction: number; // 0-10
  recommendationScore: number; // 0-100
  teacherRatings: Array<{
    teacherId: number;
    rating: number;
    comment?: string;
  }>;
  courseRatings: Array<{
    courseId?: number;
    rating?: number;
    comment?: string;
  }>;
}

export interface EmotionalLoyalty {
  totalStudents: number;
  averages: {
    mood: number; // 0-100
    motivation: number; // 0-100
    satisfaction: number; // 0-100
  };
  groupStats: Array<{
    group: string;
    students: number;
    averageMood: number;
    averageMotivation: number;
    loyaltyScore: number;
  }>;
  emotionalStates: Array<{ mood: number; motivation: number }>;
}

export interface RepeatPurchaseAnalytics {
  rate: number; // percent 0-100
  totalStudents: number;
  studentsWithRepeatPurchases: number;
  averageDaysBetween: number;
}

export interface FeedbackResponseItem {
  id: number;
  submittedAt: string;
  period: string;
  user: {
    id: number;
    name: string;
    surname: string;
    role: string;
    student?: {
      id: number;
      group?: { id: number; name: string } | null;
    } | null;
  };
  template: { id: number; name: string; title?: string };
  answers: Record<string, unknown>;
  displayData: {
    overallSatisfaction: number | null;
    teacherRating: number | null;
    teacherComment: string | null;
    recommendCourse: boolean | null;
    mood: number | null;
    motivation: number | null;
    concentration: number | null;
  };
}

export interface FeedbackResponsesResponse {
  data: FeedbackResponseItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface FeedbackResponsesStats {
  totalResponses: number;
  responsesByTemplate: Array<{ templateId: number; _count: { id: number } }>;
  responsesByPeriod: Array<{ period: string; _count: { id: number } }>;
  averageRatings: {
    averageSatisfaction: number;
    averageTeacherRating: number;
    recommendationRate: number;
  };
}
