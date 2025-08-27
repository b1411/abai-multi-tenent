import apiClient from '../../services/apiClient';
import {
  LoyaltyFilter,
  LoyaltyAnalytics,
  LoyaltySummary,
  RepeatPurchaseAnalytics,
  TrendEntry,
  PaginatedReviews,
  StudentReview,
  AddReactionRequest,
  CreateReviewRequest,
  TeacherAnalytics,
  GroupAnalytics,
  EmotionalLoyalty,
  PaginatedFeedbackResponses,
  FeedbackBasedLoyalty,
  FeedbackResponse
} from '../types/loyalty';

/**
 * Моки (по запросу оператора). Используются только при ошибке API.
 */
const mockReviews: StudentReview[] = [
  {
    id: 1,
    studentId: 11,
    teacherId: 5,
    groupId: 101,
    rating: 5,
    comment: 'Отличный преподаватель! Очень доступно объясняет сложные темы.',
    likes: 12,
    helpful: 8,
    isModerated: true,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    student: { id: 1, user: { id: 201, name: 'Алексей', surname: 'К.' } },
    teacher: { id: 5, user: { id: 301, name: 'Иванов', surname: 'И.И.' } },
    group: { id: 101, name: 'МК24-1М' },
    reactions: []
  },
  {
    id: 2,
    studentId: 12,
    teacherId: 6,
    groupId: 102,
    rating: 4,
    comment: 'Хорошо, но мало практики.',
    likes: 5,
    helpful: 3,
    isModerated: true,
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    student: { id: 2, user: { id: 202, name: 'Мария', surname: 'С.' } },
    teacher: { id: 6, user: { id: 302, name: 'Петрова', surname: 'М.С.' } },
    group: { id: 102, name: 'МК24-2М' },
    reactions: []
  }
];

const mockAnalytics: LoyaltyAnalytics = {
  totalReviews: mockReviews.length,
  averageRating: +(mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(2),
  ratingDistribution: [5, 4, 3].map(r => ({
    rating: r,
    _count: { rating: mockReviews.filter(x => x.rating === r).length || (r === 3 ? 1 : 0) }
  })),
  topTeachers: [
    {
      teacherId: 5,
      _avg: { rating: 4.8 },
      _count: { rating: 20 },
      teacher: { id: 5, user: { id: 301, name: 'Иванов', surname: 'И.И.' } }
    },
    {
      teacherId: 6,
      _avg: { rating: 4.6 },
      _count: { rating: 18 },
      teacher: { id: 6, user: { id: 302, name: 'Петрова', surname: 'М.С.' } }
    }
  ]
};

const mockRepeat: RepeatPurchaseAnalytics = {
  rate: 75,
  totalStudents: 20,
  studentsWithRepeatPurchases: 15,
  averageDaysBetween: 32
};

const mockSummary: LoyaltySummary = {
  totalReviews: mockAnalytics.totalReviews,
  averageRating: mockAnalytics.averageRating,
  activeTeachers: 2,
  activeGroups: 2,
  satisfactionRate: 78,
  repeatPurchaseRate: mockRepeat.rate,
  loyaltyScore: Math.round(((mockAnalytics.averageRating / 5) * 100 + 78 + mockRepeat.rate) / 3)
};

const mockTrends: TrendEntry[] = Array.from({ length: 6 }).map((_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - (5 - i));
  return {
    period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
    review_count: 10 + i * 2,
    average_rating: 4 + (i % 2) * 0.2
  };
});

const mockFeedbackBased: FeedbackBasedLoyalty = {
  period: new Date().toISOString().slice(0, 7),
  totalResponses: 25,
  averageSatisfaction: 8,
  recommendationScore: 82,
  teacherRatings: [
    { teacherId: 5, rating: 5, comment: 'Супер' },
    { teacherId: 6, rating: 4, comment: 'Больше практики' }
  ],
  courseRatings: []
};

const mockEmotional: EmotionalLoyalty = {
  totalStudents: 20,
  averages: { mood: 7, motivation: 8, satisfaction: 8 },
  groupStats: [
    { group: 'МК24-1М', students: 10, averageMood: 7, averageMotivation: 8, loyaltyScore: 78 },
    { group: 'МК24-2М', students: 10, averageMood: 6, averageMotivation: 7, loyaltyScore: 72 }
  ],
  emotionalStates: []
};

function buildQuery(filter?: LoyaltyFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

class LoyaltyService {
  async getSummary(filter?: LoyaltyFilter): Promise<LoyaltySummary> {
    try {
      return await apiClient.get(`/loyalty/analytics/summary${buildQuery(filter)}`);
    } catch {
      return mockSummary;
    }
  }

  async getAnalytics(filter?: LoyaltyFilter): Promise<LoyaltyAnalytics> {
    try {
      return await apiClient.get(`/loyalty/analytics${buildQuery(filter)}`);
    } catch {
      return mockAnalytics;
    }
  }

  async getFeedbackBasedLoyalty(filter?: LoyaltyFilter): Promise<FeedbackBasedLoyalty> {
    try {
      return await apiClient.get(`/loyalty/analytics/feedback-based${buildQuery(filter)}`);
    } catch {
      return mockFeedbackBased;
    }
  }

  async getTrends(filter?: LoyaltyFilter): Promise<TrendEntry[]> {
    try {
      return await apiClient.get(`/loyalty/analytics/trends${buildQuery(filter)}`);
    } catch {
      return mockTrends;
    }
  }

  async getRepeatPurchases(filter?: LoyaltyFilter): Promise<RepeatPurchaseAnalytics> {
    try {
      return await apiClient.get(`/loyalty/analytics/repeat-purchases${buildQuery(filter)}`);
    } catch {
      return mockRepeat;
    }
  }

  async getReviews(filter?: LoyaltyFilter): Promise<PaginatedReviews> {
    try {
      return await apiClient.get(`/loyalty/reviews${buildQuery(filter)}`);
    } catch {
      const page = filter?.page || 1;
      const limit = filter?.limit || 20;
      return {
        data: mockReviews.slice(0, limit),
        total: mockReviews.length,
        page,
        totalPages: 1,
        limit
      };
    }
  }

  async getReview(id: number): Promise<StudentReview | null> {
    try {
      return await apiClient.get(`/loyalty/reviews/${id}`);
    } catch {
      return mockReviews.find(r => r.id === id) || null;
    }
  }

  async createReview(dto: CreateReviewRequest): Promise<StudentReview> {
    try {
      return await apiClient.post('/loyalty/reviews', dto);
    } catch {
      const created: StudentReview = {
        id: mockReviews.length + 1,
        studentId: 999,
        teacherId: dto.teacherId,
        groupId: dto.groupId,
        rating: dto.rating,
        comment: dto.comment,
        likes: 0,
        helpful: 0,
        isModerated: true,
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockReviews.unshift(created);
      mockAnalytics.totalReviews = mockReviews.length;
      mockAnalytics.averageRating = +(mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(2);
      mockSummary.totalReviews = mockAnalytics.totalReviews;
      mockSummary.averageRating = mockAnalytics.averageRating;
      return created;
    }
  }

  async addReaction(reviewId: number, type: 'like' | 'helpful'): Promise<void> {
    const payload: AddReactionRequest = { type: type === 'like' ? 'LIKE' : 'HELPFUL' };
    try {
      await apiClient.post(`/loyalty/reviews/${reviewId}/reactions`, payload);
    } catch {
      const r = mockReviews.find(x => x.id === reviewId);
      if (!r) return;
      if (payload.type === 'LIKE') r.likes += 1;
      if (payload.type === 'HELPFUL') r.helpful += 1;
    }
  }

  async getTeacherAnalytics(teacherId: number, filter?: LoyaltyFilter): Promise<TeacherAnalytics> {
    try {
      return await apiClient.get(`/loyalty/analytics/teacher/${teacherId}${buildQuery(filter)}`);
    } catch {
      return {
        teacherId,
        totalReviews: mockReviews.filter(r => r.teacherId === teacherId).length,
        averageRating: 4.7,
        reviews: mockReviews.filter(r => r.teacherId === teacherId),
        feedbackData: {
          averageSatisfaction: 8,
            recommendationScore: 82,
            teacherRatings: [{ teacherId, rating: 5, comment: 'Супер' }],
            courseRatings: []
        }
      };
    }
  }

  async getGroupAnalytics(groupId: number, filter?: LoyaltyFilter): Promise<GroupAnalytics> {
    try {
      return await apiClient.get(`/loyalty/analytics/group/${groupId}${buildQuery(filter)}`);
    } catch {
      return {
        groupId,
        group: {
          id: groupId,
          name: 'МК24-1М',
          students: [
            { id: 1, user: { id: 5001, name: 'Алексей', surname: 'К.' } },
            { id: 2, user: { id: 5002, name: 'Мария', surname: 'С.' } }
          ]
        },
        totalReviews: mockReviews.filter(r => r.groupId === groupId).length,
        reviews: mockReviews.filter(r => r.groupId === groupId),
        emotionalData: {
          studentsCount: 2,
          averages: { mood: 7, motivation: 8, concentration: 7, socialization: 7 },
          emotionalStates: []
        }
      };
    }
  }

  async getEmotionalLoyalty(filter?: LoyaltyFilter): Promise<EmotionalLoyalty> {
    try {
      return await apiClient.get(`/loyalty/analytics/emotional${buildQuery(filter)}`);
    } catch {
      return mockEmotional;
    }
  }

  async getFeedbackResponses(filter?: LoyaltyFilter): Promise<PaginatedFeedbackResponses> {
    try {
      return await apiClient.get(`/loyalty/feedback-responses${buildQuery(filter)}`);
    } catch {
      return { data: [], total: 0, page: 1, totalPages: 1, limit: filter?.limit || 10 };
    }
  }

  async getFeedbackResponse(id: number): Promise<FeedbackResponse | null> {
    try {
      return await apiClient.get(`/loyalty/feedback-responses/${id}`);
    } catch {
      return null;
    }
  }

  async getFeedbackResponsesStats(filter?: LoyaltyFilter) {
    try {
      return await apiClient.get(`/loyalty/feedback-responses/stats${buildQuery(filter)}`);
    } catch {
      return {
        totalResponses: mockFeedbackBased.totalResponses,
        responsesByTemplate: [],
        responsesByPeriod: [],
        averageRatings: {
          averageSatisfaction: mockFeedbackBased.averageSatisfaction,
          averageTeacherRating: mockAnalytics.averageRating,
          recommendationRate: mockFeedbackBased.recommendationScore
        }
      };
    }
  }

  // Утилиты
  formatRating(r: number) {
    return `${r}/5`;
  }
  getRatingLabel(r: number) {
    if (r >= 4.5) return 'Отлично';
    if (r >= 3.5) return 'Хорошо';
    if (r >= 2.5) return 'Удовлетворительно';
    if (r >= 1.5) return 'Плохо';
    return 'Очень плохо';
  }
  getRatingColor(r: number) {
    if (r >= 4.5) return '#10B981';
    if (r >= 3.5) return '#F59E0B';
    if (r >= 2.5) return '#EF4444';
    return '#DC2626';
  }
  formatTeacherName(t: any) {
    if (!t?.user) return 'Неизвестный учитель';
    return `${t.user.name} ${t.user.surname}`;
  }
  formatDate(d: string | Date) {
    return new Intl.DateTimeFormat('ru-RU').format(new Date(d));
  }
  getDefaultFilter(): LoyaltyFilter {
    return { period: 'month', page: 1, limit: 20 };
  }
}

export const loyaltyService = new LoyaltyService();
