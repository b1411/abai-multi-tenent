export type EventCategory = 
  | 'volunteer' 
  | 'sport' 
  | 'science' 
  | 'culture' 
  | 'social' 
  | 'education'
  | 'environment'
  | 'charity';

export type ClubCategory = 
  | 'academic' 
  | 'sports' 
  | 'creative' 
  | 'volunteer' 
  | 'professional' 
  | 'hobby'
  | 'social'
  | 'environmental';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type VolunteerStatus = 'pending' | 'approved' | 'rejected';

export type UserRole = 'student' | 'club_leader' | 'admin' | 'teacher';

export type VolunteerLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatar?: string;
  role: UserRole;
  faculty?: string;
  group?: string;
  volunteerHours: number;
  volunteerLevel: VolunteerLevel;
  badges: Badge[];
  joinedClubs: string[]; // club IDs
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: ClubCategory;
  leader: User;
  members: User[];
  memberCount: number;
  rating: number;
  createdAt: Date;
  isActive: boolean;
  socialLinks?: {
    telegram?: string;
    instagram?: string;
    facebook?: string;
  };
  events: Event[];
  news: ClubNews[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  date: Date;
  endDate?: Date;
  location: string;
  category: EventCategory;
  organizer: Club;
  maxParticipants?: number;
  currentParticipants: number;
  volunteerHours: number;
  qrCode: string;
  status: EventStatus;
  image?: string;
  requirements?: string[];
  attendees: User[];
  likes: number;
  comments: Comment[];
  createdAt: Date;
  isOnline: boolean;
  registrationDeadline?: Date;
  tags: string[];
}

export interface ClubNews {
  id: string;
  title: string;
  content: string;
  author: User;
  club: Club;
  createdAt: Date;
  image?: string;
  likes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  parentId?: string; // for replies
  likes: number;
}

export interface VolunteerHours {
  id: string;
  user: User;
  event?: Event;
  description: string;
  hours: number;
  date: Date;
  status: VolunteerStatus;
  evidence?: string; // file URL
  verifiedBy?: User;
  verifiedAt?: Date;
  feedback?: string;
  category: EventCategory;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

export interface QRCode {
  id: string;
  event: Event;
  token: string;
  createdAt: Date;
  expiresAt?: Date;
  scans: QRScan[];
  isActive: boolean;
}

export interface QRScan {
  id: string;
  qrCode: QRCode;
  user: User;
  scannedAt: Date;
  location?: string;
  verified: boolean;
}

export interface Membership {
  id: string;
  user: User;
  club: Club;
  role: 'member' | 'moderator' | 'leader';
  joinedAt: Date;
  status: 'active' | 'pending' | 'inactive';
  contribution: number; // activity score
}

export interface EventRegistration {
  id: string;
  user: User;
  event: Event;
  registeredAt: Date;
  attended: boolean;
  checkedInAt?: Date;
  feedback?: string;
  rating?: number;
}

export interface LeaderboardEntry {
  user: User;
  score: number;
  rank: number;
  category: 'hours' | 'events' | 'leadership' | 'overall';
  period: 'week' | 'month' | 'semester' | 'year';
}

export interface Notification {
  id: string;
  recipient: User;
  title: string;
  message: string;
  type: 'event' | 'club' | 'hours' | 'achievement' | 'system';
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  data?: any;
}

export interface GlobalStats {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  totalVolunteerHours: number;
  activeUsers: number;
  upcomingEvents: number;
  topClubs: Club[];
  topVolunteers: User[];
  categoryDistribution: Record<EventCategory, number>;
  facultyParticipation: Record<string, number>;
}

export interface ClubStats {
  club: Club;
  totalEvents: number;
  totalParticipants: number;
  averageAttendance: number;
  totalVolunteerHours: number;
  memberGrowth: number;
  eventSuccessRate: number;
  topEvents: Event[];
  memberActivity: Record<string, number>;
  monthlyStats: {
    month: string;
    events: number;
    participants: number;
    hours: number;
  }[];
}

// Filter interfaces
export interface EventFilters {
  category?: EventCategory;
  dateFrom?: Date;
  dateTo?: Date;
  location?: string;
  organizer?: string;
  status?: EventStatus;
  hasSpots?: boolean;
  onlineOnly?: boolean;
  search?: string;
  tags?: string[];
}

export interface ClubFilters {
  category?: ClubCategory;
  hasSpots?: boolean;
  rating?: number;
  faculty?: string;
  search?: string;
  sortBy?: 'name' | 'members' | 'rating' | 'activity';
  sortOrder?: 'asc' | 'desc';
}

export interface VolunteerFilters {
  status?: VolunteerStatus;
  category?: EventCategory;
  dateFrom?: Date;
  dateTo?: Date;
  minHours?: number;
  maxHours?: number;
  search?: string;
}

// Form interfaces
export interface CreateEventForm {
  title: string;
  description: string;
  shortDescription: string;
  date: Date;
  endDate?: Date;
  location: string;
  category: EventCategory;
  maxParticipants?: number;
  volunteerHours: number;
  image?: File;
  requirements?: string[];
  isOnline: boolean;
  registrationDeadline?: Date;
  tags: string[];
}

export interface CreateClubForm {
  name: string;
  description: string;
  category: ClubCategory;
  logo?: File;
  socialLinks?: {
    telegram?: string;
    instagram?: string;
    facebook?: string;
  };
}

export interface SubmitHoursForm {
  eventId?: string;
  description: string;
  hours: number;
  date: Date;
  category: EventCategory;
  evidence?: File;
}

// API Response interfaces
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Hook return types
export interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  filters: EventFilters;
  setFilters: (filters: EventFilters) => void;
  registerForEvent: (eventId: string) => Promise<void>;
  unregisterFromEvent: (eventId: string) => Promise<void>;
  likeEvent: (eventId: string) => Promise<void>;
  addComment: (eventId: string, comment: string) => Promise<void>;
  refetch: () => void;
}

export interface UseClubsReturn {
  clubs: Club[];
  loading: boolean;
  error: string | null;
  filters: ClubFilters;
  setFilters: (filters: ClubFilters) => void;
  joinClub: (clubId: string) => Promise<void>;
  leaveClub: (clubId: string) => Promise<void>;
  refetch: () => void;
}

export interface UseVolunteerHoursReturn {
  hours: VolunteerHours[];
  totalHours: number;
  currentLevel: VolunteerLevel;
  nextLevelHours: number;
  loading: boolean;
  error: string | null;
  submitHours: (form: SubmitHoursForm) => Promise<void>;
  refetch: () => void;
}
