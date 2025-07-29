import { useState, useEffect, useCallback } from 'react';
import {
  Event,
  Club,
  VolunteerHours,
  GlobalStats,
  LeaderboardEntry,
  Notification,
  EventFilters,
  ClubFilters,
  VolunteerFilters
} from '../types/jasLife';
import {
  mockEvents,
  mockClubs,
  mockVolunteerHours,
  mockGlobalStats,
  mockLeaderboard,
  mockNotifications
} from '../data/mockJasLifeData';

export interface UseJasLifeReturn {
  // Events
  events: Event[];
  eventsLoading: boolean;
  eventFilters: EventFilters;
  setEventFilters: (filters: EventFilters) => void;
  
  // Clubs
  clubs: Club[];
  clubsLoading: boolean;
  clubFilters: ClubFilters;
  setClubFilters: (filters: ClubFilters) => void;
  
  // Volunteer Hours
  volunteerHours: VolunteerHours[];
  volunteerLoading: boolean;
  volunteerFilters: VolunteerFilters;
  setVolunteerFilters: (filters: VolunteerFilters) => void;
  
  // Global data
  globalStats: GlobalStats | null;
  leaderboard: LeaderboardEntry[];
  notifications: Notification[];
  
  // Actions
  registerForEvent: (eventId: string) => Promise<void>;
  joinClub: (clubId: string) => Promise<void>;
  submitVolunteerHours: (hours: Omit<VolunteerHours, 'id' | 'status'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  
  // Utils
  refreshData: () => void;
  error: string | null;
}

export const useJasLife = (): UseJasLifeReturn => {
  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventFilters, setEventFilters] = useState<EventFilters>({});
  
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubFilters, setClubFilters] = useState<ClubFilters>({});
  
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours[]>([]);
  const [volunteerLoading, setVolunteerLoading] = useState(true);
  const [volunteerFilters, setVolunteerFilters] = useState<VolunteerFilters>({});
  
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [error, setError] = useState<string | null>(null);

  // Filter functions
  const filterEvents = useCallback((events: Event[], filters: EventFilters): Event[] => {
    return events.filter(event => {
      // Category filter
      if (filters.category && event.category !== filters.category) {
        return false;
      }
      
      // Date range filter
      if (filters.dateFrom && event.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && event.date > filters.dateTo) {
        return false;
      }
      
      // Location filter
      if (filters.location && !event.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      
      // Organizer filter
      if (filters.organizer && !event.organizer.name.toLowerCase().includes(filters.organizer.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filters.status && event.status !== filters.status) {
        return false;
      }
      
      // Has spots filter
      if (filters.hasSpots && event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
        return false;
      }
      
      // Online only filter
      if (filters.onlineOnly && !event.isOnline) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesDescription = event.description.toLowerCase().includes(searchLower);
        const matchesTags = event.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }
      
      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          event.tags.some(eventTag => eventTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }, []);

  const filterClubs = useCallback((clubs: Club[], filters: ClubFilters): Club[] => {
    const filtered = clubs.filter(club => {
      // Category filter
      if (filters.category && club.category !== filters.category) {
        return false;
      }
      
      // Has spots filter (assuming clubs have member limits)
      if (filters.hasSpots && club.memberCount >= 100) { // Mock limit
        return false;
      }
      
      // Rating filter
      if (filters.rating && club.rating < filters.rating) {
        return false;
      }
      
      // Faculty filter (based on leader's faculty)
      if (filters.faculty && club.leader.faculty !== filters.faculty) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = club.name.toLowerCase().includes(searchLower);
        const matchesDescription = club.description.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }
      
      return true;
    });

    // Sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'members':
            aValue = a.memberCount;
            bValue = b.memberCount;
            break;
          case 'rating':
            aValue = a.rating;
            bValue = b.rating;
            break;
          case 'activity':
            aValue = a.events.length; // Mock activity score
            bValue = b.events.length;
            break;
          default:
            return 0;
        }
        
        if (filters.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }

    return filtered;
  }, []);

  const filterVolunteerHours = useCallback((hours: VolunteerHours[], filters: VolunteerFilters): VolunteerHours[] => {
    return hours.filter(hour => {
      // Status filter
      if (filters.status && hour.status !== filters.status) {
        return false;
      }
      
      // Category filter
      if (filters.category && hour.category !== filters.category) {
        return false;
      }
      
      // Date range filter
      if (filters.dateFrom && hour.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && hour.date > filters.dateTo) {
        return false;
      }
      
      // Hours range filter
      if (filters.minHours && hour.hours < filters.minHours) {
        return false;
      }
      if (filters.maxHours && hour.hours > filters.maxHours) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesDescription = hour.description.toLowerCase().includes(searchLower);
        const matchesEvent = hour.event?.title.toLowerCase().includes(searchLower);
        
        if (!matchesDescription && !matchesEvent) {
          return false;
        }
      }
      
      return true;
    });
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Simulate API calls with setTimeout
      setTimeout(() => {
        setEvents(mockEvents);
        setEventsLoading(false);
      }, 500);
      
      setTimeout(() => {
        setClubs(mockClubs);
        setClubsLoading(false);
      }, 300);
      
      setTimeout(() => {
        setVolunteerHours(mockVolunteerHours);
        setVolunteerLoading(false);
      }, 400);
      
      setTimeout(() => {
        setGlobalStats(mockGlobalStats);
        setLeaderboard(mockLeaderboard);
        setNotifications(mockNotifications);
      }, 200);
      
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error('JasLife data loading error:', err);
    }
  }, []);

  // Actions
  const registerForEvent = useCallback(async (eventId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, currentParticipants: event.currentParticipants + 1 }
          : event
      ));
      
      // Add notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        recipient: { id: 'current-user' } as any,
        title: 'Регистрация подтверждена',
        message: 'Вы успешно зарегистрировались на мероприятие',
        type: 'event',
        createdAt: new Date()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
    } catch (err) {
      setError('Ошибка при регистрации на мероприятие');
      throw err;
    }
  }, []);

  const joinClub = useCallback(async (clubId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setClubs(prev => prev.map(club => 
        club.id === clubId 
          ? { ...club, memberCount: club.memberCount + 1 }
          : club
      ));
      
      // Add notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        recipient: { id: 'current-user' } as any,
        title: 'Заявка отправлена',
        message: 'Ваша заявка на вступление в клуб рассматривается',
        type: 'club',
        createdAt: new Date()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
    } catch (err) {
      setError('Ошибка при вступлении в клуб');
      throw err;
    }
  }, []);

  const submitVolunteerHours = useCallback(async (hours: Omit<VolunteerHours, 'id' | 'status'>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new volunteer hours entry
      const newHours: VolunteerHours = {
        ...hours,
        id: Date.now().toString(),
        status: 'pending'
      };
      
      setVolunteerHours(prev => [newHours, ...prev]);
      
      // Add notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        recipient: { id: 'current-user' } as any,
        title: 'Часы отправлены на проверку',
        message: `Заявка на ${hours.hours} волонтерских часов отправлена`,
        type: 'hours',
        createdAt: new Date()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
    } catch (err) {
      setError('Ошибка при подаче волонтерских часов');
      throw err;
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, readAt: new Date() }
          : notification
      ));
      
    } catch (err) {
      setError('Ошибка при отметке уведомления');
      throw err;
    }
  }, []);

  const refreshData = useCallback(() => {
    setEventsLoading(true);
    setClubsLoading(true);
    setVolunteerLoading(true);
    loadData();
  }, [loadData]);

  // Effects
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters to data
  const filteredEvents = filterEvents(events, eventFilters);
  const filteredClubs = filterClubs(clubs, clubFilters);
  const filteredVolunteerHours = filterVolunteerHours(volunteerHours, volunteerFilters);

  return {
    // Events
    events: filteredEvents,
    eventsLoading,
    eventFilters,
    setEventFilters,
    
    // Clubs
    clubs: filteredClubs,
    clubsLoading,
    clubFilters,
    setClubFilters,
    
    // Volunteer Hours
    volunteerHours: filteredVolunteerHours,
    volunteerLoading,
    volunteerFilters,
    setVolunteerFilters,
    
    // Global data
    globalStats,
    leaderboard,
    notifications,
    
    // Actions
    registerForEvent,
    joinClub,
    submitVolunteerHours,
    markNotificationAsRead,
    
    // Utils
    refreshData,
    error
  };
};

export default useJasLife;
