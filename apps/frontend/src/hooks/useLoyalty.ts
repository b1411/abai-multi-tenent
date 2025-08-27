import { useState, useEffect, useCallback } from 'react';
import { loyaltyService } from '../loyalty/services/loyaltyService';
import {
  CreateReviewRequest,
  LoyaltyFilter,
  LoyaltyAnalytics,
  TrendEntry,
  TeacherAnalytics,
  GroupAnalytics,
  LoyaltySummary,
  PaginatedReviews,
  FeedbackBasedLoyalty,
  EmotionalLoyalty,
  RepeatPurchaseAnalytics
} from '../loyalty/types/loyalty';

// Базовый hook
export function useLoyalty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createReview = (data: CreateReviewRequest) => run(() => loyaltyService.createReview(data));
  const getReviews = (filter?: LoyaltyFilter) => run(() => loyaltyService.getReviews(filter));
  const getReview = (id: number) => run(() => loyaltyService.getReview(id));
  const addReaction = (reviewId: number, type: 'like' | 'helpful') => run(() => loyaltyService.addReaction(reviewId, type));
  const getAnalytics = (filter?: LoyaltyFilter) => run(() => loyaltyService.getAnalytics(filter));
  const getTrends = (filter?: LoyaltyFilter) => run(() => loyaltyService.getTrends(filter));
  const getTeacherAnalytics = (teacherId: number, filter?: LoyaltyFilter) => run(() => loyaltyService.getTeacherAnalytics(teacherId, filter));
  const getGroupAnalytics = (groupId: number, filter?: LoyaltyFilter) => run(() => loyaltyService.getGroupAnalytics(groupId, filter));
  const getSummary = (filter?: LoyaltyFilter) => run(() => loyaltyService.getSummary(filter));
  const getFeedbackBased = (filter?: LoyaltyFilter) => run(() => loyaltyService.getFeedbackBasedLoyalty(filter));
  const getEmotional = (filter?: LoyaltyFilter) => run(() => loyaltyService.getEmotionalLoyalty(filter));
  const getRepeatPurchases = (filter?: LoyaltyFilter) => run(() => loyaltyService.getRepeatPurchases(filter));

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
    getFeedbackBased,
    getEmotional,
    getRepeatPurchases,
    formatRating: loyaltyService.formatRating,
    getRatingLabel: loyaltyService.getRatingLabel,
    getRatingColor: loyaltyService.getRatingColor,
    formatTeacherName: loyaltyService.formatTeacherName,
    formatDate: loyaltyService.formatDate,
    getDefaultFilter: loyaltyService.getDefaultFilter
  };
}

// Hook списка отзывов
export function useReviews(initialFilter?: LoyaltyFilter) {
  const [data, setData] = useState<PaginatedReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoyaltyFilter>(initialFilter || loyaltyService.getDefaultFilter());

  const load = useCallback(async (f?: LoyaltyFilter) => {
    try {
      setLoading(true);
      setError(null);
      const useFilter = f || filter;
      const res = await loyaltyService.getReviews(useFilter);
      setData(res);
      if (f) setFilter(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки отзывов');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    reviews: data,
    loading,
    error,
    filter,
    refetch: () => load(),
    updateFilter: (f: LoyaltyFilter) => load(f)
  };
}

// Hook комплексной аналитики
export function useLoyaltyAnalytics(initialFilter?: LoyaltyFilter) {
  const [analytics, setAnalytics] = useState<LoyaltyAnalytics | null>(null);
  const [trends, setTrends] = useState<TrendEntry[] | null>(null);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [feedbackBased, setFeedbackBased] = useState<FeedbackBasedLoyalty | null>(null);
  const [emotional, setEmotional] = useState<EmotionalLoyalty | null>(null);
  const [repeatPurchases, setRepeatPurchases] = useState<RepeatPurchaseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoyaltyFilter>(initialFilter || { period: 'month' });

  const load = useCallback(async (f?: LoyaltyFilter) => {
    try {
      setLoading(true);
      setError(null);
      const useFilter = f || filter;
      const [
        analyticsData,
        trendsData,
        summaryData,
        feedbackData,
        emotionalData,
        repeatData
      ] = await Promise.all([
        loyaltyService.getAnalytics(useFilter),
        loyaltyService.getTrends(useFilter),
        loyaltyService.getSummary(useFilter),
        loyaltyService.getFeedbackBasedLoyalty(useFilter),
        loyaltyService.getEmotionalLoyalty(useFilter),
        loyaltyService.getRepeatPurchases(useFilter)
      ]);
      setAnalytics(analyticsData);
      setTrends(trendsData);
      setSummary(summaryData);
      setFeedbackBased(feedbackData);
      setEmotional(emotionalData);
      setRepeatPurchases(repeatData);
      if (f) setFilter(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    analytics,
    trends,
    summary,
    feedbackBased,
    emotional,
    repeatPurchases,
    loading,
    error,
    filter,
    refetch: () => load(),
    updateFilter: (f: LoyaltyFilter) => load(f)
  };
}

// Hook аналитики учителя
export function useTeacherLoyalty(teacherId: number, initialFilter?: LoyaltyFilter) {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoyaltyFilter>(initialFilter || { period: 'month' });

  const load = useCallback(async (f?: LoyaltyFilter) => {
    if (!teacherId) return;
    try {
      setLoading(true);
      setError(null);
      const useFilter = f || filter;
      const data = await loyaltyService.getTeacherAnalytics(teacherId, useFilter);
      setAnalytics(data);
      if (f) setFilter(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка аналитики учителя');
    } finally {
      setLoading(false);
    }
  }, [teacherId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    analytics,
    loading,
    error,
    filter,
    refetch: () => load(),
    updateFilter: (f: LoyaltyFilter) => load(f)
  };
}

// Hook аналитики группы
export function useGroupLoyalty(groupId: number, initialFilter?: LoyaltyFilter) {
  const [analytics, setAnalytics] = useState<GroupAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoyaltyFilter>(initialFilter || { period: 'month' });

  const load = useCallback(async (f?: LoyaltyFilter) => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError(null);
      const useFilter = f || filter;
      const data = await loyaltyService.getGroupAnalytics(groupId, useFilter);
      setAnalytics(data);
      if (f) setFilter(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка аналитики группы');
    } finally {
      setLoading(false);
    }
  }, [groupId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    analytics,
    loading,
    error,
    filter,
    refetch: () => load(),
    updateFilter: (f: LoyaltyFilter) => load(f)
  };
}
