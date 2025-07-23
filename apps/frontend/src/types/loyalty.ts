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
