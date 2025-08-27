/**
 * Типы модуля лояльности (реальные данные с backend, без моков)
 */

export interface LoyaltyFilter {
  period?: 'month' | 'quarter' | 'year';
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
  teacherId?: number;
  groupId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RatingDistribution {
  rating: number;
  _count: {
    rating: number;
  };
}

export interface TopTeacher {
  teacherId: number;
  _avg: {
    rating: number | null;
  };
  _count: {
    rating: number;
  };
  teacher?: {
    id: number;
    user?: {
      id: number;
      name: string;
      surname: string;
    };
  } | null;
}

export interface LoyaltyAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: RatingDistribution[];
  topTeachers: TopTeacher[];
}

export interface LoyaltySummary {
  totalReviews: number;
  averageRating: number;
  activeTeachers: number;
  activeGroups: number;
  satisfactionRate: number;
  repeatPurchaseRate: number;
  loyaltyScore: number;
}

export interface RepeatPurchaseAnalytics {
  rate: number;
  totalStudents: number;
  studentsWithRepeatPurchases: number;
  averageDaysBetween: number;
}

export interface TrendEntry {
  period: string;
  review_count: number;
  average_rating: number;
}

export interface ReviewReaction {
  id: number;
  reviewId: number;
  userId: number;
  type: 'LIKE' | 'HELPFUL';
  createdAt: string;
  user?: {
    id: number;
    name: string;
    surname: string;
  };
}

export interface ReviewTeacher {
  id: number;
  user?: {
    id: number;
    name: string;
    surname: string;
  };
}

export interface ReviewGroup {
  id: number;
  name: string;
}

export interface StudentUser {
  id: number;
  name: string;
  surname: string;
}

export interface ReviewStudent {
  id: number;
  user?: StudentUser;
}

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
  student?: ReviewStudent;
  teacher?: ReviewTeacher;
  group?: ReviewGroup;
  reactions?: ReviewReaction[];
}

export interface PaginatedReviews {
  data: StudentReview[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface AddReactionRequest {
  type: 'LIKE' | 'HELPFUL';
}

export interface CreateReviewRequest {
  teacherId: number;
  groupId: number;
  rating: number; // 1-5
  comment: string;
}

export interface FeedbackResponseDisplayData {
  overallSatisfaction: number | null;
  teacherRating: number | null;
  teacherComment: string | null;
  recommendCourse: boolean | null;
  mood: number | null;
  motivation: number | null;
  concentration: number | null;
}

export interface FeedbackResponse {
  id: number;
  submittedAt: string;
  period: string;
  answers: Record<string, any>;
  user: {
    id: number;
    name: string;
    surname: string;
    role: string;
    student?: {
      id: number;
      group?: {
        id: number;
        name: string;
      };
    };
  };
  template: {
    id: number;
    name: string;
    title: string;
  };
  displayData: FeedbackResponseDisplayData;
}

export interface PaginatedFeedbackResponses {
  data: FeedbackResponse[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface TeacherAnalytics {
  teacherId: number;
  totalReviews: number;
  averageRating: number;
  reviews: StudentReview[];
  feedbackData: {
    averageSatisfaction: number;
    recommendationScore: number;
    teacherRatings: {
      teacherId: number;
      rating: number;
      comment?: string;
    }[];
    courseRatings: any[];
  };
}

export interface GroupEmotionalData {
  studentsCount: number;
  averages: {
    mood: number;
    motivation: number;
    concentration: number;
    socialization: number;
  };
  emotionalStates: any[];
}

export interface GroupAnalytics {
  groupId: number;
  group: {
    id: number;
    name: string;
    students: {
      id: number;
      user: {
        id: number;
        name: string;
        surname: string;
      };
    }[];
  } | null;
  totalReviews: number;
  reviews: StudentReview[];
  emotionalData: GroupEmotionalData | null;
}

export interface EmotionalLoyalty {
  totalStudents: number;
  averages: {
    mood: number;
    motivation: number;
    satisfaction: number;
  };
  groupStats: {
    group: string;
    students: number;
    averageMood: number;
    averageMotivation: number;
    loyaltyScore: number;
  }[];
  emotionalStates: any[];
}

export interface FeedbackBasedLoyalty {
  period: string;
  totalResponses: number;
  averageSatisfaction: number;
  recommendationScore: number;
  teacherRatings: {
    teacherId: number;
    rating: number;
    comment?: string;
  }[];
  courseRatings: any[];
}
