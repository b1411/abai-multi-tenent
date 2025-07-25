import { createContext, useContext } from 'react';

// Типы данных
export interface OnlineUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  lastSeen: string;
  currentPage?: string;
}

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    surname: string;
    email: string;
  };
  type: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface ActivityStats {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    totalActivities: number;
  };
  dailyStats?: any[];
}

export interface ActivityContextType {
  connected: boolean;
  onlineUsers: OnlineUser[];
  activities: ActivityItem[];
  stats: ActivityStats | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  refreshOnlineUsers: () => void;
  refreshActivities: (filters?: any) => void;
  refreshStats: (days?: number) => void;
  exportActivities: () => Promise<void>;
  updateCurrentPage: (page: string) => void;
}

export const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};
