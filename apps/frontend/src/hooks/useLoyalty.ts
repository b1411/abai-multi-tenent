import { useState, useEffect, useCallback } from 'react';
import { loyaltyService } from '../services/loyaltyService';
import {
  StudentReview,
  CreateReviewRequest,
  LoyaltyFilter,
  LoyaltyAnalytics,
  LoyaltyTrends,
  TeacherAnalytics,
  GroupAnalytics,
  LoyaltySummary,
  ReviewsResponse,
  FeedbackBasedLoyalty
} from '../types/loyalty';

export function useLoyalty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData: CreateReviewRequest) => {
    return handleAsyncOperation(() => loyaltyService.createReview(reviewData));
  };

  const getReviews = async (filter?: LoyaltyFilter) => {
    return handleAsyncOperation(() => loyaltyService.getReviews(filter));
  };

  const getReview = async (id: number) => {
    return handleAsyncOperation(() => loyaltyService.getReview(id));
  };

  const addReaction = async (reviewId: number, type: 'like' | 'helpful') => {
    return handleAsyncOperation(() => loyaltyService.addReaction(reviewId, type));
  };

  const getAnalytics = async (filter?: LoyaltyFilter) => {
    return handleAsyncOperation(() => loyaltyService.getAnalytics(filter));
  };

  const getTrends = async (filter?: LoyaltyFilter) => {
    return handleAsyncOperation(() => loyaltyService.getTrends(filter));
  };

  const getTeacherAnalytics = async (teacherId: number, filter?: LoyaltyFilter) => {
    return handleAsyncOperation(() => loyaltyService.getTeacherAnalytics(teacherId, filter));
  };

  const getGroupAnalytics = async (groupId: number, filter?: LoyaltyFilter) => {
    return handleAsyncOperation(() => loyaltyService.getGroupAnalytics(groupId, filter));
  };

  const getSummary = async (filter?: LoyaltyFilter) => {
    return handleAsyncOperation(() => loyaltyService.getSummary(filter));
  };

  return {
    loading,
    error,
    createReview,
    getReviews,
    getReview,
    addReaction,
    getAnalytics,
    getTrends,
    getTeacherAnalytics,
    getGroupAnalytics,
    getSummary,
    // Утилиты форматирования
    formatRating: loyaltyService.formatRating,
    getRatingLabel: loyaltyService.getRatingLabel,
    getRatingColor: loyaltyService.getRatingColor,
    formatTeacherName: loyaltyService.formatTeacherName,
    formatDate: loyaltyService.formatDate,
    getDefaultFilter: loyaltyService.getDefaultFilter,
  };
}

// Hook для получения списка отзывов с автоматической загрузкой
export function useReviews(initialFilter?: LoyaltyFilter) {
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoyaltyFilter>(
    initialFilter || loyaltyService.getDefaultFilter()
  );

  const loadReviews = useCallback(async (newFilter?: LoyaltyFilter) => {
    try {
      setLoading(true);
      setError(null);
      const filterToUse = newFilter || filter;
      const data = await loyaltyService.getReviews(filterToUse);
      setReviews(data);
      if (newFilter) {
        setFilter(newFilter);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки отзывов';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const refetch = () => loadReviews();
  const updateFilter = (newFilter: LoyaltyFilter) => loadReviews(newFilter);

  return {
    reviews,
    loading,
    error,
    filter,
    loadReviews,
    refetch,
    updateFilter,
  };
}

// Hook для получения аналитики с автоматической загрузкой
export function useLoyaltyAnalytics(initialFilter?: LoyaltyFilter) {
  const [analytics, setAnalytics] = useState<LoyaltyAnalytics | null>(null);
  const [trends, setTrends] = useState<LoyaltyTrends[] | null>(null);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [feedbackBased, setFeedbackBased] = useState<FeedbackBasedLoyalty | null>(null);
  const [emotional, setEmotional] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoyaltyFilter>(
    initialFilter || { period: 'month' }
  );

  const loadAnalytics = useCallback(async (newFilter?: LoyaltyFilter) => {
    try {
      setLoading(true);
      setError(null);
      const filterToUse = newFilter || filter;

      const [analyticsData, trendsData, summaryData, feedbackBasedData, emotionalData] = await Promise.all([
        loyaltyService.getAnalytics(filterToUse),
        loyaltyService.getTrends(filterToUse),
        loyaltyService.getSummary(filterToUse),
        loyaltyService.getFeedbackBasedLoyalty(filterToUse),
        loyaltyService.getEmotionalLoyalty(filterToUse),
      ]);

      setAnalytics(analyticsData);
      setTrends(trendsData);
      setSummary(summaryData);
  setFeedbackBased(feedbackBasedData);
  setEmotional(emotionalData);

      if (newFilter) {
        setFilter(newFilter);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки аналитики';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const refetch = () => loadAnalytics();
  const updateFilter = (newFilter: LoyaltyFilter) => loadAnalytics(newFilter);

  return {
    analytics,
    trends,
    summary,
  feedbackBased,
  emotional,
    loading,
    error,
    filter,
    loadAnalytics,
    refetch,
    updateFilter,
  };
}

// Hook для аналитики конкретного учителя
export function useTeacherLoyalty(teacherId: number, initialFilter?: LoyaltyFilter) {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoyaltyFilter>(
    initialFilter || { period: 'month' }
  );

  const loadAnalytics = useCallback(async (newFilter?: LoyaltyFilter) => {
    try {
      setLoading(true);
      setError(null);
      const filterToUse = newFilter || filter;
      const data = await loyaltyService.getTeacherAnalytics(teacherId, filterToUse);
      setAnalytics(data);
      if (newFilter) {
        setFilter(newFilter);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки аналитики учителя';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter, teacherId]);

  useEffect(() => {
    if (teacherId) {
      loadAnalytics();
    }
  }, [teacherId, loadAnalytics]);

  const refetch = () => loadAnalytics();
  const updateFilter = (newFilter: LoyaltyFilter) => loadAnalytics(newFilter);

  return {
    analytics,
    loading,
    error,
    filter,
    loadAnalytics,
    refetch,
    updateFilter,
  };
}

// Hook для аналитики конкретной группы
export function useGroupLoyalty(groupId: number, initialFilter?: LoyaltyFilter) {
  const [analytics, setAnalytics] = useState<GroupAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoyaltyFilter>(
    initialFilter || { period: 'month' }
  );

  const loadAnalytics = useCallback(async (newFilter?: LoyaltyFilter) => {
    try {
      setLoading(true);
      setError(null);
      const filterToUse = newFilter || filter;
      const data = await loyaltyService.getGroupAnalytics(groupId, filterToUse);
      setAnalytics(data);
      if (newFilter) {
        setFilter(newFilter);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки аналитики группы';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter, groupId]);

  useEffect(() => {
    if (groupId) {
      loadAnalytics();
    }
  }, [groupId, loadAnalytics]);

  const refetch = () => loadAnalytics();
  const updateFilter = (newFilter: LoyaltyFilter) => loadAnalytics(newFilter);

  return {
    analytics,
    loading,
    error,
    filter,
    loadAnalytics,
    refetch,
    updateFilter,
  };
}
