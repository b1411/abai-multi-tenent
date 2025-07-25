import { Post, User, ReactionType } from '../types/newsFeed';

// Mock users
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Айгуль',
    surname: 'Назарбаева',
    email: 'aigul@abai.edu.kz',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b739?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2', 
    name: 'Мурат',
    surname: 'Токтаров',
    email: 'murat@abai.edu.kz',
    role: 'TEACHER',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Асель',
    surname: 'Жакупова',
    email: 'asel@abai.edu.kz', 
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'Данияр',
    surname: 'Сапаров',
    email: 'daniyar@abai.edu.kz',
    role: 'TEACHER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '5',
    name: 'Жанар',
    surname: 'Кенжебаева', 
    email: 'zhanar@abai.edu.kz',
    role: 'HR',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
  }
];

// Mock posts with rich content
export const mockPosts: Post[] = [
  {
    id: '1',
    content: '🎉 Поздравляем наших студентов с отличными результатами на республиканской олимпиаде по математике! Особая благодарность Асель Жакуповой за 1-е место и Ернару Тулегенову за 2-е место. Гордимся нашими талантами! 🏆',
    author: mockUsers[0],
    createdAt: '2025-01-25T10:30:00Z',
    updatedAt: '2025-01-25T10:30:00Z',
    images: [
      {
        id: '1',
        imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop',
        fileName: 'olympiad_winners.jpg'
      }
    ],
    files: [],
    reactions: [
      { id: '1', type: 'LOVE' as ReactionType, userId: '2', user: mockUsers[1] },
      { id: '2', type: 'LIKE' as ReactionType, userId: '3', user: mockUsers[2] },
      { id: '3', type: 'WOW' as ReactionType, userId: '4', user: mockUsers[3] },
      { id: '4', type: 'LOVE' as ReactionType, userId: '5', user: mockUsers[4] }
    ],
    comments: [
      {
        id: '1',
        content: 'Невероятные результаты! Поздравляю от всего сердца! 🎊',
        author: mockUsers[1],
        createdAt: '2025-01-25T10:45:00Z'
      },
      {
        id: '2', 
        content: 'Спасибо большое! Это был действительно сложный конкурс, но мы справились!',
        author: mockUsers[2],
        createdAt: '2025-01-25T11:00:00Z'
      }
    ],
    _count: {
      reactions: 4,
      comments: 2
    }
  },
  {
    id: '2',
    content: '📚 Новый учебный план по ИИ и машинному обучению готов! Курс будет включать практические занятия с Python, TensorFlow и работу над реальными проектами. Регистрация открыта до 1 февраля.',
    author: mockUsers[1],
    createdAt: '2025-01-25T09:15:00Z',
    updatedAt: '2025-01-25T09:15:00Z',
    images: [],
    files: [
      {
        id: '1',
        fileUrl: '/mock-files/ai_curriculum.pdf',
        fileName: 'Учебный план ИИ 2025.pdf',
        fileType: 'pdf'
      }
    ],
    reactions: [
      { id: '5', type: 'LIKE' as ReactionType, userId: '1', user: mockUsers[0] },
      { id: '6', type: 'WOW' as ReactionType, userId: '3', user: mockUsers[2] },
      { id: '7', type: 'LIKE' as ReactionType, userId: '5', user: mockUsers[4] }
    ],
    comments: [
      {
        id: '3',
        content: 'Отличная инициатива! Когда начнем набор студентов?',
        author: mockUsers[0],
        createdAt: '2025-01-25T09:30:00Z'
      },
      {
        id: '4',
        content: 'Я уже готов записаться! Это именно то, что мне нужно для карьеры',
        author: mockUsers[2],
        createdAt: '2025-01-25T09:45:00Z'
      }
    ],
    _count: {
      reactions: 3,
      comments: 2
    }
  },
  {
    id: '3',
    content: '🍕 Объявляется пицца-пятница в актовом зале! Сегодня в 18:00 собираемся всей командой, чтобы отметить успешное завершение семестра. Будет весело! 🎈',
    author: mockUsers[4],
    createdAt: '2025-01-25T08:45:00Z',
    updatedAt: '2025-01-25T08:45:00Z',
    images: [
      {
        id: '2',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
        fileName: 'pizza_party.jpg'
      }
    ],
    files: [],
    reactions: [
      { id: '8', type: 'LAUGH' as ReactionType, userId: '1', user: mockUsers[0] },
      { id: '9', type: 'LOVE' as ReactionType, userId: '2', user: mockUsers[1] },
      { id: '10', type: 'LIKE' as ReactionType, userId: '3', user: mockUsers[2] },
      { id: '11', type: 'LAUGH' as ReactionType, userId: '4', user: mockUsers[3] }
    ],
    comments: [
      {
        id: '5',
        content: 'Ура! Наконец-то можно расслабиться после экзаменов! 🎉',
        author: mockUsers[2],
        createdAt: '2025-01-25T09:00:00Z'
      }
    ],
    _count: {
      reactions: 4,
      comments: 1
    }
  },
  {
    id: '4',
    content: '⚠️ Техническое обслуживание системы планируется на завтра (26 января) с 02:00 до 04:00. В это время доступ к платформе будет временно ограничен. Планируйте свою работу заранее.',
    author: mockUsers[0],
    createdAt: '2025-01-25T07:30:00Z',
    updatedAt: '2025-01-25T07:30:00Z',
    images: [],
    files: [
      {
        id: '2',
        fileUrl: '/mock-files/maintenance_schedule.docx',
        fileName: 'График технического обслуживания.docx',
        fileType: 'docx'
      }
    ],
    reactions: [
      { id: '12', type: 'LIKE' as ReactionType, userId: '2', user: mockUsers[1] },
      { id: '13', type: 'LIKE' as ReactionType, userId: '4', user: mockUsers[3] }
    ],
    comments: [
      {
        id: '6',
        content: 'Спасибо за предупреждение! Учту при планировании занятий.',
        author: mockUsers[1],
        createdAt: '2025-01-25T07:45:00Z'
      }
    ],
    _count: {
      reactions: 2,
      comments: 1
    }
  },
  {
    id: '5',
    content: '📖 Хочу поделиться впечатлениями от вчерашней лекции по квантовой физике! Профессор Данияр Сапаров объяснил сложные концепции так доступно, что даже я поняла принцип суперпозиции. Спасибо за вдохновляющий урок! ✨',
    author: mockUsers[2],
    createdAt: '2025-01-24T20:15:00Z',
    updatedAt: '2025-01-24T20:15:00Z',
    images: [
      {
        id: '3',
        imageUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=600&fit=crop',
        fileName: 'quantum_physics_board.jpg'
      }
    ],
    files: [],
    reactions: [
      { id: '14', type: 'LOVE' as ReactionType, userId: '1', user: mockUsers[0] },
      { id: '15', type: 'LIKE' as ReactionType, userId: '4', user: mockUsers[3] },
      { id: '16', type: 'WOW' as ReactionType, userId: '5', user: mockUsers[4] }
    ],
    comments: [
      {
        id: '7',
        content: 'Благодарю за отзыв! Мне очень приятно, что материал был понятен 😊',
        author: mockUsers[3],
        createdAt: '2025-01-24T20:30:00Z'
      },
      {
        id: '8',
        content: 'Согласен! Данияр Александрович лучший преподаватель физики!',
        author: mockUsers[1],
        createdAt: '2025-01-24T21:00:00Z'
      }
    ],
    _count: {
      reactions: 3,
      comments: 2
    }
  },
  {
    id: '6',
    content: '🏃‍♀️ Напоминание: завтра в 16:00 спортивные соревнования между факультетами! Приходите поддержать наших студентов. Будут волейбол, баскетбол и настольный теннис. Болельщикам - бесплатный чай! ☕',
    author: mockUsers[4],
    createdAt: '2025-01-24T18:45:00Z',
    updatedAt: '2025-01-24T18:45:00Z',
    images: [
      {
        id: '4',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        fileName: 'sports_competition.jpg'
      }
    ],
    files: [],
    reactions: [
      { id: '17', type: 'LIKE' as ReactionType, userId: '1', user: mockUsers[0] },
      { id: '18', type: 'LIKE' as ReactionType, userId: '2', user: mockUsers[1] },
      { id: '19', type: 'LAUGH' as ReactionType, userId: '3', user: mockUsers[2] }
    ],
    comments: [
      {
        id: '9',
        content: 'Обязательно приду! За какую команду болеете?',
        author: mockUsers[1],
        createdAt: '2025-01-24T19:00:00Z'
      }
    ],
    _count: {
      reactions: 3,
      comments: 1
    }
  },
  {
    id: '7',
    content: '💡 Идея дня: что если мы создадим студенческий стартап-инкубатор прямо в университете? Могли бы помогать молодым предпринимателям развивать свои проекты. Кто готов обсудить эту идею?',
    author: mockUsers[1],
    createdAt: '2025-01-24T16:20:00Z',
    updatedAt: '2025-01-24T16:20:00Z',
    images: [],
    files: [],
    reactions: [
      { id: '20', type: 'WOW' as ReactionType, userId: '1', user: mockUsers[0] },
      { id: '21', type: 'LOVE' as ReactionType, userId: '3', user: mockUsers[2] },
      { id: '22', type: 'LIKE' as ReactionType, userId: '5', user: mockUsers[4] }
    ],
    comments: [
      {
        id: '10',
        content: 'Блестящая идея! У меня есть несколько контактов в IT-сфере, которые могли бы помочь',
        author: mockUsers[0],
        createdAt: '2025-01-24T16:35:00Z'
      },
      {
        id: '11',
        content: 'Я уже работаю над проектом мобильного приложения! Было бы здорово получить поддержку',
        author: mockUsers[2],
        createdAt: '2025-01-24T16:50:00Z'
      },
      {
        id: '12',
        content: 'Давайте созвонимся на следующей неделе и обсудим детали?',
        author: mockUsers[4],
        createdAt: '2025-01-24T17:15:00Z'
      }
    ],
    _count: {
      reactions: 3,
      comments: 3
    }
  },
  {
    id: '8',
    content: '📋 Внимание! Изменения в расписании на следующую неделю: лекция по высшей математике переносится с понедельника на вторник. Семинар по программированию остается без изменений.',
    author: mockUsers[0],
    createdAt: '2025-01-24T14:10:00Z',
    updatedAt: '2025-01-24T14:10:00Z',
    images: [],
    files: [
      {
        id: '3',
        fileUrl: '/mock-files/schedule_changes.pdf',
        fileName: 'Изменения в расписании.pdf',
        fileType: 'pdf'
      }
    ],
    reactions: [
      { id: '23', type: 'LIKE' as ReactionType, userId: '2', user: mockUsers[1] },
      { id: '24', type: 'LIKE' as ReactionType, userId: '3', user: mockUsers[2] }
    ],
    comments: [],
    _count: {
      reactions: 2,
      comments: 0
    }
  }
];
