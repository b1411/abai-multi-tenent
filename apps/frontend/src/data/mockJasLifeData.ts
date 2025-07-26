import { 
  User, 
  Club, 
  Event, 
  VolunteerHours, 
  Badge, 
  QRCode, 
  EventCategory, 
  ClubCategory, 
  VolunteerLevel,
  GlobalStats,
  ClubStats,
  LeaderboardEntry,
  Notification,
  ClubNews
} from '../types/jasLife';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Айгерим',
    surname: 'Нурланова',
    email: 'aigerim@abai.kz',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    role: 'student',
    faculty: 'Информационные технологии',
    group: 'ИТ-21-1',
    volunteerHours: 75,
    volunteerLevel: 'silver',
    badges: [],
    joinedClubs: ['1', '3']
  },
  {
    id: '2',
    name: 'Данияр',
    surname: 'Касымов',
    email: 'daniyar@abai.kz',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'club_leader',
    faculty: 'Экология',
    group: 'ЭК-20-2',
    volunteerHours: 180,
    volunteerLevel: 'gold',
    badges: [],
    joinedClubs: ['2', '4']
  },
  {
    id: '3',
    name: 'Амина',
    surname: 'Жаксылыкова',
    email: 'amina@abai.kz',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    role: 'student',
    faculty: 'Педагогика',
    group: 'ПД-22-1',
    volunteerHours: 25,
    volunteerLevel: 'bronze',
    badges: [],
    joinedClubs: ['1', '5']
  },
  {
    id: '4',
    name: 'Арман',
    surname: 'Токтаров',
    email: 'arman@abai.kz',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'student',
    faculty: 'Спорт',
    group: 'СП-21-3',
    volunteerHours: 95,
    volunteerLevel: 'silver',
    badges: [],
    joinedClubs: ['6']
  },
  {
    id: '5',
    name: 'Жанар',
    surname: 'Бекетова',
    email: 'zhanar@abai.kz',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    role: 'admin',
    faculty: 'Администрация',
    group: '',
    volunteerHours: 300,
    volunteerLevel: 'platinum',
    badges: [],
    joinedClubs: []
  }
];

// Mock Badges
export const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'Активист месяца',
    description: 'Самый активный участник месяца',
    icon: '🏆',
    color: 'from-yellow-400 to-orange-500',
    criteria: '50+ часов за месяц',
    rarity: 'rare'
  },
  {
    id: '2',
    name: 'Эко-воин',
    description: 'Участие в экологических мероприятиях',
    icon: '🌱',
    color: 'from-green-400 to-emerald-500',
    criteria: '20+ экологических часов',
    rarity: 'common'
  },
  {
    id: '3',
    name: 'Организатор',
    description: 'Организовал 5+ мероприятий',
    icon: '🎯',
    color: 'from-purple-400 to-pink-500',
    criteria: 'Организация 5+ событий',
    rarity: 'epic'
  },
  {
    id: '4',
    name: 'Волонтер года',
    description: 'Выдающиеся заслуги в волонтерстве',
    icon: '⭐',
    color: 'from-blue-400 to-purple-500',
    criteria: '200+ часов за год',
    rarity: 'legendary'
  }
];

// Mock Clubs
export const mockClubs: Club[] = [
  {
    id: '1',
    name: 'IT Club ABAI',
    description: 'Клуб для студентов IT специальностей. Изучаем новые технологии, участвуем в хакатонах, делимся опытом.',
    logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200',
    category: 'academic',
    leader: mockUsers[0],
    members: [mockUsers[0], mockUsers[2]],
    memberCount: 45,
    rating: 4.8,
    createdAt: new Date('2023-09-01'),
    isActive: true,
    socialLinks: {
      telegram: '@itclub_abai',
      instagram: '@itclub.abai'
    },
    events: [],
    news: []
  },
  {
    id: '2',
    name: 'Green Future',
    description: 'Экологический клуб университета. Боремся за чистую окружающую среду и устойчивое развитие.',
    logo: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200',
    category: 'environmental',
    leader: mockUsers[1],
    members: [mockUsers[1]],
    memberCount: 32,
    rating: 4.9,
    createdAt: new Date('2023-08-15'),
    isActive: true,
    socialLinks: {
      telegram: '@greenfuture_abai',
      instagram: '@green.future.abai'
    },
    events: [],
    news: []
  },
  {
    id: '3',
    name: 'Debate Society',
    description: 'Клуб дебатов и ораторского мастерства. Развиваем критическое мышление и навыки публичных выступлений.',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    category: 'academic',
    leader: mockUsers[2],
    members: [mockUsers[0], mockUsers[2]],
    memberCount: 28,
    rating: 4.6,
    createdAt: new Date('2023-09-10'),
    isActive: true,
    events: [],
    news: []
  },
  {
    id: '4',
    name: 'Волонтерский центр',
    description: 'Организуем социальные акции и благотворительные мероприятия для помощи нуждающимся.',
    logo: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=200',
    category: 'volunteer',
    leader: mockUsers[1],
    members: [mockUsers[1]],
    memberCount: 67,
    rating: 4.9,
    createdAt: new Date('2023-07-20'),
    isActive: true,
    socialLinks: {
      telegram: '@volunteer_abai'
    },
    events: [],
    news: []
  },
  {
    id: '5',
    name: 'Креативная мастерская',
    description: 'Творческий клуб для художников, дизайнеров и всех творческих личностей.',
    logo: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200',
    category: 'creative',
    leader: mockUsers[2],
    members: [mockUsers[2]],
    memberCount: 23,
    rating: 4.7,
    createdAt: new Date('2023-09-05'),
    isActive: true,
    events: [],
    news: []
  },
  {
    id: '6',
    name: 'ABAI Sports',
    description: 'Спортивный клуб университета. Организуем соревнования и спортивные мероприятия.',
    logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200',
    category: 'sports',
    leader: mockUsers[3],
    members: [mockUsers[3]],
    memberCount: 89,
    rating: 4.8,
    createdAt: new Date('2023-08-01'),
    isActive: true,
    socialLinks: {
      instagram: '@abai.sports'
    },
    events: [],
    news: []
  }
];

// Mock Events
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Хакатон AI4Good',
    description: 'Двухдневный хакатон по разработке AI-решений для социальных проблем. Призовой фонд 500,000 тенге.',
    shortDescription: 'Создаем AI для добрых дел',
    date: new Date('2025-02-15T09:00:00'),
    endDate: new Date('2025-02-16T18:00:00'),
    location: 'IT Lab, корпус 1',
    category: 'science',
    organizer: mockClubs[0],
    maxParticipants: 50,
    currentParticipants: 32,
    volunteerHours: 16,
    qrCode: 'qr_hackathon_2025',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400',
    requirements: ['Ноутбук', 'Базовые знания программирования', 'Желание творить'],
    attendees: [mockUsers[0], mockUsers[2]],
    likes: 45,
    comments: [],
    createdAt: new Date('2025-01-20'),
    isOnline: false,
    registrationDeadline: new Date('2025-02-10'),
    tags: ['hackathon', 'ai', 'programming', 'innovation']
  },
  {
    id: '2',
    title: 'Уборка парка Kok-Tobe',
    description: 'Присоединяйтесь к экологической акции по уборке парка. Вносим свой вклад в чистоту города.',
    shortDescription: 'Делаем город чище вместе',
    date: new Date('2025-02-08T10:00:00'),
    endDate: new Date('2025-02-08T15:00:00'),
    location: 'Парк Kok-Tobe',
    category: 'environment',
    organizer: mockClubs[1],
    maxParticipants: 100,
    currentParticipants: 67,
    volunteerHours: 5,
    qrCode: 'qr_cleanup_koktobe',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    requirements: ['Удобная одежда', 'Перчатки (выдадим на месте)', 'Хорошее настроение'],
    attendees: [mockUsers[1]],
    likes: 78,
    comments: [],
    createdAt: new Date('2025-01-15'),
    isOnline: false,
    registrationDeadline: new Date('2025-02-07'),
    tags: ['ecology', 'volunteer', 'cleanup', 'nature']
  },
  {
    id: '3',
    title: 'Мастер-класс "Дебаты для начинающих"',
    description: 'Изучаем основы академических дебатов, техники аргументации и публичных выступлений.',
    shortDescription: 'Учимся спорить конструктивно',
    date: new Date('2025-02-12T16:00:00'),
    endDate: new Date('2025-02-12T18:00:00'),
    location: 'Аудитория 205, корпус 2',
    category: 'education',
    organizer: mockClubs[2],
    maxParticipants: 30,
    currentParticipants: 18,
    volunteerHours: 2,
    qrCode: 'qr_debate_workshop',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400',
    requirements: ['Блокнот и ручка', 'Открытость к обучению'],
    attendees: [mockUsers[0], mockUsers[2]],
    likes: 23,
    comments: [],
    createdAt: new Date('2025-01-25'),
    isOnline: false,
    registrationDeadline: new Date('2025-02-11'),
    tags: ['debate', 'education', 'skills', 'communication']
  },
  {
    id: '4',
    title: 'Благотворительный концерт',
    description: 'Концерт в поддержку детского дома "Балапан". Все средства пойдут на нужды детей.',
    shortDescription: 'Творим добро через искусство',
    date: new Date('2025-02-20T19:00:00'),
    endDate: new Date('2025-02-20T21:30:00'),
    location: 'Актовый зал',
    category: 'charity',
    organizer: mockClubs[4],
    maxParticipants: 200,
    currentParticipants: 145,
    volunteerHours: 3,
    qrCode: 'qr_charity_concert',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    requirements: ['Входной билет 1000 тенге'],
    attendees: [mockUsers[2]],
    likes: 156,
    comments: [],
    createdAt: new Date('2025-01-18'),
    isOnline: false,
    registrationDeadline: new Date('2025-02-19'),
    tags: ['charity', 'concert', 'music', 'help']
  },
  {
    id: '5',
    title: 'Турнир по футболу',
    description: 'Межфакультетский турнир по мини-футболу. Награждение победителей кубками и призами.',
    shortDescription: 'Спортивные баталии начинаются',
    date: new Date('2025-02-25T14:00:00'),
    endDate: new Date('2025-02-25T18:00:00'),
    location: 'Спортивный зал',
    category: 'sport',
    organizer: mockClubs[5],
    maxParticipants: 80,
    currentParticipants: 72,
    volunteerHours: 4,
    qrCode: 'qr_football_tournament',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    requirements: ['Спортивная форма', 'Футбольные бутсы', 'Справка от врача'],
    attendees: [mockUsers[3]],
    likes: 92,
    comments: [],
    createdAt: new Date('2025-01-22'),
    isOnline: false,
    registrationDeadline: new Date('2025-02-23'),
    tags: ['football', 'sport', 'tournament', 'competition']
  },
  {
    id: '6',
    title: 'Онлайн-лекция "Будущее образования"',
    description: 'Лекция о современных трендах в образовании, EdTech и дистанционном обучении.',
    shortDescription: 'Заглядываем в будущее обучения',
    date: new Date('2025-02-10T15:00:00'),
    endDate: new Date('2025-02-10T16:30:00'),
    location: 'Zoom (ссылка придет на почту)',
    category: 'education',
    organizer: mockClubs[0],
    currentParticipants: 234,
    volunteerHours: 2,
    qrCode: 'qr_online_lecture_education',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    requirements: ['Стабильный интернет', 'Zoom-приложение'],
    attendees: [mockUsers[0], mockUsers[2], mockUsers[4]],
    likes: 67,
    comments: [],
    createdAt: new Date('2025-01-28'),
    isOnline: true,
    registrationDeadline: new Date('2025-02-09'),
    tags: ['education', 'online', 'future', 'edtech']
  }
];

// Mock QR Codes
export const mockQRCodes: QRCode[] = [
  {
    id: '1',
    event: mockEvents[0],
    token: 'abc123xyz789hackathon',
    createdAt: new Date('2025-01-20'),
    expiresAt: new Date('2025-02-16T23:59:59'),
    scans: [],
    isActive: true
  },
  {
    id: '2',
    event: mockEvents[1],
    token: 'def456uvw012cleanup',
    createdAt: new Date('2025-01-15'),
    expiresAt: new Date('2025-02-08T23:59:59'),
    scans: [],
    isActive: true
  }
];

// Mock Volunteer Hours
export const mockVolunteerHours: VolunteerHours[] = [
  {
    id: '1',
    user: mockUsers[0],
    event: mockEvents[0],
    description: 'Участие в хакатоне AI4Good 2024',
    hours: 16,
    date: new Date('2024-12-15'),
    status: 'approved',
    verifiedBy: mockUsers[4],
    verifiedAt: new Date('2024-12-16'),
    feedback: 'Отличная работа в команде!',
    category: 'science'
  },
  {
    id: '2',
    user: mockUsers[1],
    event: mockEvents[1],
    description: 'Организация уборки парка',
    hours: 8,
    date: new Date('2024-12-20'),
    status: 'approved',
    verifiedBy: mockUsers[4],
    verifiedAt: new Date('2024-12-21'),
    category: 'environment'
  },
  {
    id: '3',
    user: mockUsers[2],
    description: 'Помощь в проведении олимпиады по математике',
    hours: 4,
    date: new Date('2025-01-10'),
    status: 'pending',
    category: 'education'
  },
  {
    id: '4',
    user: mockUsers[0],
    description: 'Волонтерство в детском доме',
    hours: 6,
    date: new Date('2025-01-25'),
    status: 'approved',
    verifiedBy: mockUsers[4],
    verifiedAt: new Date('2025-01-26'),
    feedback: 'Дети были в восторге от мастер-класса!',
    category: 'charity'
  }
];

// Mock Global Stats
export const mockGlobalStats: GlobalStats = {
  totalUsers: 1247,
  totalClubs: 23,
  totalEvents: 156,
  totalVolunteerHours: 12450,
  activeUsers: 892,
  upcomingEvents: 12,
  topClubs: mockClubs.slice(0, 5),
  topVolunteers: mockUsers.slice(0, 5),
  categoryDistribution: {
    volunteer: 45,
    sport: 28,
    science: 32,
    culture: 19,
    social: 15,
    education: 38,
    environment: 22,
    charity: 31
  },
  facultyParticipation: {
    'Информационные технологии': 234,
    'Экология': 187,
    'Педагогика': 198,
    'Спорт': 156,
    'Филология': 143,
    'Математика': 167,
    'История': 132
  }
};

// Mock Club Stats
export const mockClubStats: ClubStats = {
  club: mockClubs[0],
  totalEvents: 12,
  totalParticipants: 340,
  averageAttendance: 28.3,
  totalVolunteerHours: 456,
  memberGrowth: 15,
  eventSuccessRate: 92,
  topEvents: mockEvents.slice(0, 3),
  memberActivity: {
    'Айгерим Нурланова': 85,
    'Амина Жаксылыкова': 67,
    'Другие участники': 45
  },
  monthlyStats: [
    { month: 'Сен', events: 3, participants: 89, hours: 124 },
    { month: 'Окт', events: 2, participants: 67, hours: 89 },
    { month: 'Ноя', events: 4, participants: 112, hours: 156 },
    { month: 'Дек', events: 3, participants: 72, hours: 87 }
  ]
};

// Mock Leaderboard
export const mockLeaderboard: LeaderboardEntry[] = [
  {
    user: mockUsers[1],
    score: 180,
    rank: 1,
    category: 'hours',
    period: 'semester'
  },
  {
    user: mockUsers[3],
    score: 95,
    rank: 2,
    category: 'hours',
    period: 'semester'
  },
  {
    user: mockUsers[0],
    score: 75,
    rank: 3,
    category: 'hours',
    period: 'semester'
  },
  {
    user: mockUsers[2],
    score: 25,
    rank: 4,
    category: 'hours',
    period: 'semester'
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    recipient: mockUsers[0],
    title: 'Новое мероприятие!',
    message: 'IT Club ABAI приглашает на хакатон AI4Good',
    type: 'event',
    createdAt: new Date('2025-01-20T10:00:00'),
    actionUrl: '/jas-life/events/1'
  },
  {
    id: '2',
    recipient: mockUsers[0],
    title: 'Часы подтверждены',
    message: 'Ваши 6 волонтерских часов были подтверждены',
    type: 'hours',
    createdAt: new Date('2025-01-26T14:30:00'),
    readAt: new Date('2025-01-26T15:00:00')
  },
  {
    id: '3',
    recipient: mockUsers[2],
    title: 'Новый бейдж!',
    message: 'Поздравляем! Вы получили бейдж "Активист месяца"',
    type: 'achievement',
    createdAt: new Date('2025-01-25T16:00:00')
  }
];

// Mock Club News
export const mockClubNews: ClubNews[] = [
  {
    id: '1',
    title: 'Победа в региональном хакатоне!',
    content: 'Команда IT Club ABAI заняла первое место в региональном хакатоне по разработке мобильных приложений. Поздравляем наших участников с заслуженной победой!',
    author: mockUsers[0],
    club: mockClubs[0],
    createdAt: new Date('2025-01-20T12:00:00'),
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400',
    likes: 89,
    comments: []
  },
  {
    id: '2',
    title: 'Планируем экспедицию в горы',
    content: 'Green Future организует экологическую экспедицию в горы Алатау для изучения биоразнообразия и очистки туристических маршрутов.',
    author: mockUsers[1],
    club: mockClubs[1],
    createdAt: new Date('2025-01-18T15:30:00'),
    likes: 45,
    comments: []
  }
];

// Helper functions
export const getCategoryColor = (category: EventCategory): string => {
  const colors = {
    volunteer: 'from-blue-400 to-blue-600',
    sport: 'from-orange-400 to-red-500',
    science: 'from-purple-400 to-indigo-600',
    culture: 'from-pink-400 to-rose-500',
    social: 'from-green-400 to-emerald-500',
    education: 'from-cyan-400 to-blue-500',
    environment: 'from-green-500 to-teal-600',
    charity: 'from-red-400 to-pink-500'
  };
  return colors[category] || 'from-gray-400 to-gray-600';
};

export const getCategoryIcon = (category: EventCategory): string => {
  const icons = {
    volunteer: '🤝',
    sport: '⚽',
    science: '🔬',
    culture: '🎭',
    social: '👥',
    education: '📚',
    environment: '🌱',
    charity: '❤️'
  };
  return icons[category] || '📅';
};

export const getVolunteerLevelColor = (level: VolunteerLevel): string => {
  const colors = {
    bronze: 'from-amber-600 to-yellow-600',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-indigo-600'
  };
  return colors[level];
};

export const getVolunteerLevelRequirements = (level: VolunteerLevel): number => {
  const requirements = {
    bronze: 50,
    silver: 100,
    gold: 200,
    platinum: 500
  };
  return requirements[level];
};

// Generate mock QR code data URL
export const generateMockQRCode = (token: string): string => {
  // This would normally use a real QR code library like 'qrcode'
  // For now, returning a placeholder data URL
  return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwMCIvPgogIDxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmZmYiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDAwIj5RUjwvdGV4dD4KPC9zdmc+`;
};

export default {
  mockUsers,
  mockClubs,
  mockEvents,
  mockVolunteerHours,
  mockBadges,
  mockQRCodes,
  mockGlobalStats,
  mockClubStats,
  mockLeaderboard,
  mockNotifications,
  mockClubNews,
  getCategoryColor,
  getCategoryIcon,
  getVolunteerLevelColor,
  getVolunteerLevelRequirements,
  generateMockQRCode
};
