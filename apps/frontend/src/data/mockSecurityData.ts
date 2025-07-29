import { 
  SecurityAlert, 
  Camera, 
  FaceIDEntry, 
  SecurityGuard, 
  EmergencyCall, 
  SecurityMetrics,
  AIDetection
} from '../types/security';

// Моковые тревоги
export const mockAlerts: SecurityAlert[] = [
  {
    id: '1',
    type: 'fire',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 минут назад
    camera: 'Камера-01',
    location: 'Коридор 1 этаж',
    description: 'Обнаружено возгорание в районе электрощитовой',
    severity: 'critical',
    screenshot: '/screenshots/fire-alert-1.jpg',
    resolved: false
  },
  {
    id: '2',
    type: 'unknown_face',
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 минут назад
    camera: 'Камера-03',
    location: 'Главный вход',
    description: 'Неизвестное лицо пытается пройти через турникет',
    severity: 'high',
    screenshot: '/screenshots/unknown-face-1.jpg',
    resolved: false
  },
  {
    id: '3',
    type: 'crowd',
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 минут назад
    camera: 'Камера-05',
    location: 'Столовая',
    description: 'Скопление более 20 человек в столовой',
    severity: 'medium',
    screenshot: '/screenshots/crowd-1.jpg',
    resolved: true,
    assignedTo: 'Охранник Иванов'
  },
  {
    id: '4',
    type: 'fight',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 час назад
    camera: 'Камера-07',
    location: 'Спортзал',
    description: 'Потасовка между учащимися',
    severity: 'high',
    screenshot: '/screenshots/fight-1.jpg',
    resolved: true,
    assignedTo: 'Охранник Петров'
  }
];

// Моковые камеры
export const mockCameras: Camera[] = [
  {
    id: 'cam-1',
    name: 'Камера-01',
    location: 'Главный вход',
    status: 'online',
    aiEnabled: true,
    detections: [],
    lastActivity: new Date().toISOString()
  },
  {
    id: 'cam-2',
    name: 'Камера-02',
    location: 'Коридор 1 этаж',
    status: 'online',
    aiEnabled: true,
    detections: [],
    lastActivity: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: 'cam-3',
    name: 'Камера-03',
    location: 'Столовая',
    status: 'offline',
    aiEnabled: false,
    detections: [],
    lastActivity: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'cam-4',
    name: 'Камера-04',
    location: 'Спортзал',
    status: 'maintenance',
    aiEnabled: true,
    detections: [],
    lastActivity: new Date(Date.now() - 3600000).toISOString()
  }
];

// Моковые записи Face ID
export const mockFaceIDEntries: FaceIDEntry[] = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'Иван Петров',
    userRole: 'TEACHER',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'entry',
    turnstileId: 'turnstile-1',
    turnstileName: 'Главный вход',
    photo: '/faces/ivan-petrov.jpg',
    authorized: true
  },
  {
    id: '2',
    userId: 'user-2',
    userName: 'Мария Сидорова',
    userRole: 'STUDENT',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    type: 'entry',
    turnstileId: 'turnstile-1',
    turnstileName: 'Главный вход',
    photo: '/faces/maria-sidorova.jpg',
    authorized: true
  },
  {
    id: '3',
    userId: 'user-3',
    userName: 'Александр Козлов',
    userRole: 'ADMIN',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    type: 'exit',
    turnstileId: 'turnstile-2',
    turnstileName: 'Запасной выход',
    photo: '/faces/alex-kozlov.jpg',
    authorized: true
  },
  {
    id: '4',
    userId: 'unknown',
    userName: 'Неизвестный',
    userRole: 'UNKNOWN',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    type: 'entry',
    turnstileId: 'turnstile-1',
    turnstileName: 'Главный вход',
    photo: '/faces/unknown-1.jpg',
    authorized: false
  },
  {
    id: '5',
    userId: 'user-4',
    userName: 'Елена Васильева',
    userRole: 'PARENT',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    type: 'entry',
    turnstileId: 'turnstile-1',
    turnstileName: 'Главный вход',
    photo: '/faces/elena-vasilieva.jpg',
    authorized: true
  }
];

// Моковые охранники
export const mockGuards: SecurityGuard[] = [
  {
    id: 'guard-1',
    name: 'Сергей',
    surname: 'Иванов',
    shiftStart: new Date().setHours(8, 0, 0, 0).toString(),
    shiftEnd: new Date().setHours(16, 0, 0, 0).toString(),
    post: 'Главный вход',
    status: 'present',
    photo: '/guards/sergey-ivanov.jpg',
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    comments: 'Дежурство проходит штатно'
  },
  {
    id: 'guard-2',
    name: 'Михаил',
    surname: 'Петров',
    shiftStart: new Date().setHours(8, 0, 0, 0).toString(),
    shiftEnd: new Date().setHours(16, 0, 0, 0).toString(),
    post: 'Периметр здания',
    status: 'on_break',
    photo: '/guards/mikhail-petrov.jpg',
    lastSeen: new Date(Date.now() - 900000).toISOString(),
    comments: 'Ушел на обеденный перерыв в 12:00'
  },
  {
    id: 'guard-3',
    name: 'Андрей',
    surname: 'Козлов',
    shiftStart: new Date().setHours(16, 0, 0, 0).toString(),
    shiftEnd: new Date().setHours(0, 0, 0, 0).toString(),
    post: 'Ночная смена',
    status: 'absent',
    photo: '/guards/andrey-kozlov.jpg',
    lastSeen: new Date(Date.now() - 7200000).toISOString(),
    comments: 'Заболел, замена не найдена'
  },
  {
    id: 'guard-4',
    name: 'Дмитрий',
    surname: 'Волков',
    shiftStart: new Date().setHours(12, 0, 0, 0).toString(),
    shiftEnd: new Date().setHours(20, 0, 0, 0).toString(),
    post: 'Внутренний контроль',
    status: 'present',
    photo: '/guards/dmitry-volkov.jpg',
    lastSeen: new Date(Date.now() - 600000).toISOString()
  }
];

// Моковые экстренные вызовы
export const mockEmergencyCalls: EmergencyCall[] = [
  {
    id: '1',
    type: 'police',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    initiatedBy: 'Охранник Иванов',
    status: 'completed',
    notes: 'Ложная тревога, система сработала из-за технической неисправности'
  },
  {
    id: '2',
    type: 'ambulance',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    initiatedBy: 'Учитель Петрова',
    status: 'completed',
    notes: 'Ученик получил травму на уроке физкультуры'
  }
];

// Моковые метрики
export const mockMetrics: SecurityMetrics = {
  totalPeopleInBuilding: 247,
  activeThreatLevel: 'medium',
  todayEntries: 312,
  todayExits: 287,
  activeAlerts: 2,
  camerasOnline: 6,
  camerasTotal: 8,
  guardsPresent: 3,
  guardsTotal: 4,
  lastIncident: '15 минут назад - Неизвестное лицо (решено)'
};

// Функции для генерации данных
export const generateRandomAlert = (): SecurityAlert => {
  const types: SecurityAlert['type'][] = ['fire', 'weapon', 'unknown_face', 'crowd', 'fight', 'suspicious_behavior'];
  const severities: SecurityAlert['severity'][] = ['low', 'medium', 'high', 'critical'];
  const cameras = ['Камера-01', 'Камера-02', 'Камера-03', 'Камера-04', 'Камера-05'];
  const locations = ['Главный вход', 'Коридор 1 этаж', 'Столовая', 'Спортзал', 'Библиотека', 'Актовый зал'];

  const type = types[Math.floor(Math.random() * types.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];

  const descriptions: { [key in SecurityAlert['type']]: string[] } = {
    fire: ['Обнаружено возгорание', 'Датчик дыма сработал', 'Подозрение на пожар'],
    weapon: ['Обнаружен подозрительный предмет', 'Возможное оружие', 'Металлодетектор сработал'],
    unknown_face: ['Неизвестное лицо', 'Человек не в базе данных', 'Несанкционированный доступ'],
    crowd: ['Скопление людей', 'Превышена допустимая плотность', 'Массовое собрание'],
    fight: ['Потасовка между людьми', 'Агрессивное поведение', 'Конфликтная ситуация'],
    suspicious_behavior: ['Подозрительное поведение', 'Странные движения', 'Аномальная активность']
  };

  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    timestamp: new Date().toISOString(),
    camera: cameras[Math.floor(Math.random() * cameras.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    description: descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
    severity,
    screenshot: `/screenshots/${type}-${Math.floor(Math.random() * 3) + 1}.jpg`,
    resolved: Math.random() > 0.7
  };
};

export const generateRandomFaceIDEntry = (): FaceIDEntry => {
  const names = [
    { name: 'Алексей', surname: 'Иванов', role: 'TEACHER' },
    { name: 'Мария', surname: 'Петрова', role: 'STUDENT' },
    { name: 'Николай', surname: 'Сидоров', role: 'ADMIN' },
    { name: 'Елена', surname: 'Козлова', role: 'PARENT' },
    { name: 'Дмитрий', surname: 'Волков', role: 'TEACHER' }
  ];

  const person = names[Math.floor(Math.random() * names.length)];
  const type: FaceIDEntry['type'] = Math.random() > 0.5 ? 'entry' : 'exit';
  const turnstiles = [
    { id: 'turnstile-1', name: 'Главный вход' },
    { id: 'turnstile-2', name: 'Запасной выход' },
    { id: 'turnstile-3', name: 'Служебный вход' }
  ];

  const turnstile = turnstiles[Math.floor(Math.random() * turnstiles.length)];

  return {
    id: Math.random().toString(36).substr(2, 9),
    userId: Math.random().toString(36).substr(2, 9),
    userName: `${person.name} ${person.surname}`,
    userRole: person.role,
    timestamp: new Date().toISOString(),
    type,
    turnstileId: turnstile.id,
    turnstileName: turnstile.name,
    photo: `/faces/${person.name.toLowerCase()}-${person.surname.toLowerCase()}.jpg`,
    authorized: Math.random() > 0.1 // 90% авторизованных
  };
};

// Функция для обновления метрик в реальном времени
export const updateMetrics = (currentMetrics: SecurityMetrics): SecurityMetrics => {
  return {
    ...currentMetrics,
    totalPeopleInBuilding: currentMetrics.totalPeopleInBuilding + Math.floor(Math.random() * 6) - 3,
    activeAlerts: Math.max(0, currentMetrics.activeAlerts + Math.floor(Math.random() * 3) - 1),
    todayEntries: currentMetrics.todayEntries + Math.floor(Math.random() * 3),
    todayExits: currentMetrics.todayExits + Math.floor(Math.random() * 3),
    camerasOnline: Math.max(4, Math.min(8, currentMetrics.camerasOnline + Math.floor(Math.random() * 3) - 1))
  };
};
