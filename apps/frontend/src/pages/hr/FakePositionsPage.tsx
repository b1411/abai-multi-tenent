/**
 * @page FakePositionsPage
 * @description Страница контроля фиктивных ставок с использованием AI
 * 
 * @backend_requirements
 * 
 * 1. API Endpoints:
 * 
 * GET /api/v1/fake-positions/alerts
 * - Получение списка уведомлений о потенциальных нарушениях
 * - Параметры запроса:
 *   - status?: 'new' | 'investigating' | 'resolved' | 'dismissed'
 *   - riskLevel?: 'high' | 'medium' | 'low' | 'none'
 *   - search?: string
 *   - page?: number
 *   - limit?: number
 * 
 * GET /api/v1/fake-positions/presence
 * - Получение данных о присутствии сотрудников
 * - Параметры запроса:
 *   - date: string (YYYY-MM-DD)
 *   - employeeId?: string
 * 
 * POST /api/v1/fake-positions/presence
 * - Регистрация присутствия сотрудника
 * - Body:
 *   - employeeId: string
 *   - date: string (YYYY-MM-DD)
 *   - time: string (HH:mm)
 *   - photo: File
 *   - location: string
 * 
 * PUT /api/v1/fake-positions/alerts/{alertId}
 * - Обновление статуса уведомления
 * - Body:
 *   - status: 'investigating' | 'resolved' | 'dismissed'
 *   - resolutionNote?: string
 *   - assignedTo?: string
 * 
 * POST /api/v1/fake-positions/scan
 * - Запуск AI проверки для обнаружения фиктивных ставок
 * - Body:
 *   - dateRange?: { start: string, end: string }
 *   - departments?: string[]
 * 
 * 2. Модели данных:
 * 
 * interface FakePositionAlert {
 *   id: string;
 *   employeeId: string;
 *   employeeName: string;
 *   position: string;
 *   department: string;
 *   riskLevel: 'high' | 'medium' | 'low' | 'none';
 *   anomalyType: 'no_presence' | 'schedule_conflict' | 'workload_excess' | 
 *                'qualification_mismatch' | 'document_inconsistency';
 *   description: string;
 *   detectedDate: string;
 *   status: 'new' | 'investigating' | 'resolved' | 'dismissed';
 *   evidences: Array<{
 *     type: string;
 *     description: string;
 *     confidenceScore: number;
 *   }>;
 *   aiConfidence: number;
 *   resolutionNote?: string;
 *   assignedTo?: string;
 * }
 * 
 * interface Presence {
 *   id: string;
 *   employeeId: string;
 *   employeeName: string;
 *   date: string;
 *   time: string;
 *   photo: string;
 *   location: string;
 *   terminalLog?: {
 *     entryTime: string;
 *     exitTime?: string;
 *   };
 *   status: 'confirmed' | 'pending' | 'absent';
 * }
 * 
 * 3. Интеграции:
 * - Система контроля доступа для получения данных о входе/выходе
 * - Система видеонаблюдения для верификации присутствия
 * - HR система для получения данных о сотрудниках и ставках
 * 
 * 4. Требования к безопасности:
 * - Доступ только для сотрудников HR с соответствующими правами
 * - Логирование всех действий с уведомлениями
 * - Шифрование персональных данных
 * - Rate limiting для API endpoints
 * 
 * 5. Кэширование:
 * - Кэширование списка уведомлений на 5 минут
 * - Кэширование данных о присутствии на текущий день на 1 минуту
 * 
 * 6. Уведомления:
 * - WebSocket для real-time обновлений статусов
 * - Email уведомления ответственным лицам при новых алертах
 * 
 * @author Your Name
 * @last_updated 2024-03-23
 */

import React, { useState } from 'react';
import { IconType } from 'react-icons';
import { IconBaseProps } from 'react-icons/lib';
import { 
  FaRobot, 
  FaFilter, 
  FaSearch, 
  FaFileExport,
  FaExclamationTriangle,
  FaCheck,
  FaInfoCircle,
  FaEye,
  FaThumbsUp,
  FaThumbsDown,
  FaFingerprint,
  FaUserCheck,
  FaCamera,
  FaClock,
  FaImage,
  FaHistory,
  FaMapMarkerAlt
} from 'react-icons/fa';

// Типы данных
type RiskLevel = 'high' | 'medium' | 'low' | 'none';
type AnomalyType = 
  | 'no_presence' 
  | 'schedule_conflict' 
  | 'workload_excess' 
  | 'qualification_mismatch'
  | 'document_inconsistency';

interface Evidence {
  type: string;
  description: string;
  confidenceScore: number;
}

interface FakePositionAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  riskLevel: RiskLevel;
  anomalyType: AnomalyType;
  description: string;
  detectedDate: string;
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';
  evidences: Evidence[];
  aiConfidence: number;
  resolutionNote?: string;
  assignedTo?: string;
}

interface Presence {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  photo: string;
  location: string;
  terminalLog?: {
    entryTime: string;
    exitTime?: string;
  };
  status: 'confirmed' | 'pending' | 'absent';
}

// Данные для демонстрации
const anomalyTypes = [
  { 
    value: 'no_presence', 
    label: 'Отсутствие фактического присутствия',
    description: 'Сотрудник не был замечен на рабочем месте в указанные часы'
  },
  { 
    value: 'schedule_conflict', 
    label: 'Конфликт расписания',
    description: 'Сотрудник числится одновременно в нескольких местах'
  },
  { 
    value: 'workload_excess', 
    label: 'Превышение нормы нагрузки',
    description: 'Указанная нагрузка превышает физически возможную'
  },
  { 
    value: 'qualification_mismatch', 
    label: 'Несоответствие квалификации',
    description: 'Квалификация не соответствует занимаемой должности'
  },
  { 
    value: 'document_inconsistency', 
    label: 'Несоответствие в документах',
    description: 'Обнаружены противоречия в документации'
  }
];

const initialAlerts: FakePositionAlert[] = [
  {
    id: 'alert001',
    employeeId: '101',
    employeeName: 'Сатпаев Арман Нурланович',
    position: 'Преподаватель физики',
    department: 'Кафедра естественных наук',
    riskLevel: 'high',
    anomalyType: 'no_presence',
    description: 'Сотрудник числится на полной ставке, но камеры не зафиксировали его присутствие в школе в указанные часы работы за последние 3 недели.',
    detectedDate: '2024-03-10',
    status: 'investigating',
    evidences: [
      {
        type: 'Данные системы контроля доступа',
        description: 'Отсутствуют записи входа/выхода в период с 20.02.2024 по 10.03.2024',
        confidenceScore: 0.95
      },
      {
        type: 'Журнал посещений',
        description: 'Занятия проводились согласно расписанию, но преподаватель не отмечался в журнале',
        confidenceScore: 0.85
      },
      {
        type: 'Данные видеонаблюдения',
        description: 'Анализ видеозаписей не выявил присутствия сотрудника в здании',
        confidenceScore: 0.90
      }
    ],
    aiConfidence: 0.92,
    assignedTo: 'Алиева Д.К.'
  },
  {
    id: 'alert002',
    employeeId: '102',
    employeeName: 'Нурмагамбетова Айгуль Маратовна',
    position: 'Преподаватель математики',
    department: 'Кафедра математики',
    riskLevel: 'medium',
    anomalyType: 'schedule_conflict',
    description: 'Обнаружено совпадение расписания занятий в двух разных учебных заведениях.',
    detectedDate: '2024-03-15',
    status: 'new',
    evidences: [
      {
        type: 'Расписание занятий',
        description: 'Преподаватель числится ведущим занятия в школе №1 и школе №5 в одно и то же время (вторник и четверг, 10:00-11:30)',
        confidenceScore: 0.98
      },
      {
        type: 'Данные системы контроля доступа',
        description: 'Отсутствуют записи входа/выхода в школу №1 в указанные дни',
        confidenceScore: 0.90
      }
    ],
    aiConfidence: 0.88
  },
  {
    id: 'alert003',
    employeeId: '103',
    employeeName: 'Бекенов Даулет Ержанович',
    position: 'Преподаватель информатики',
    department: 'Кафедра информатики',
    riskLevel: 'low',
    anomalyType: 'workload_excess',
    description: 'Суммарная нагрузка сотрудника превышает нормативы на 50%.',
    detectedDate: '2024-03-05',
    status: 'resolved',
    evidences: [
      {
        type: 'Табель учета рабочего времени',
        description: 'Указано 60 часов в неделю при нормативе 40 часов',
        confidenceScore: 0.95
      },
      {
        type: 'Расписание занятий',
        description: 'Расписание содержит 36 часов аудиторной нагрузки',
        confidenceScore: 0.97
      }
    ],
    aiConfidence: 0.85,
    resolutionNote: 'Сотрудник ведет дополнительные занятия в рамках проектной деятельности. Документы оформлены корректно, нагрузка согласована.'
  },
  {
    id: 'alert004',
    employeeId: '104',
    employeeName: 'Жумабаев Азамат Кайратович',
    position: 'Преподаватель химии',
    department: 'Кафедра естественных наук',
    riskLevel: 'high',
    anomalyType: 'qualification_mismatch',
    description: 'Сотрудник ведет занятия по химии, но имеет диплом по экономике.',
    detectedDate: '2024-02-28',
    status: 'new',
    evidences: [
      {
        type: 'Документы об образовании',
        description: 'В личном деле находится диплом о высшем образовании по специальности "Экономика"',
        confidenceScore: 0.99
      },
      {
        type: 'Должностная инструкция',
        description: 'Требуется специализированное образование в области химии или смежных наук',
        confidenceScore: 0.90
      }
    ],
    aiConfidence: 0.95
  },
  {
    id: 'alert005',
    employeeId: '105',
    employeeName: 'Тулегенова Динара Аскаровна',
    position: 'Преподаватель литературы',
    department: 'Кафедра филологии',
    riskLevel: 'medium',
    anomalyType: 'document_inconsistency',
    description: 'Обнаружены несоответствия в документах о стаже работы.',
    detectedDate: '2024-03-12',
    status: 'dismissed',
    evidences: [
      {
        type: 'Трудовая книжка',
        description: 'Указан стаж работы 15 лет',
        confidenceScore: 0.85
      },
      {
        type: 'Данные пенсионного фонда',
        description: 'В базе данных ПФР числится 8 лет стажа',
        confidenceScore: 0.90
      }
    ],
    aiConfidence: 0.75,
    resolutionNote: 'После проверки выяснилось, что часть стажа была получена в частных образовательных учреждениях и не отражена в ПФР. Предоставлены подтверждающие документы.'
  }
];

const initialPresenceData: Presence[] = [
  {
    id: '1',
    employeeId: '101',
    employeeName: 'Сатпаев Арман',
    date: new Date().toISOString().split('T')[0],
    time: '08:45',
    photo: 'https://placehold.co/200x200',
    location: 'Главный корпус, 203 кабинет',
    terminalLog: {
      entryTime: '08:30',
      exitTime: '17:15'
    },
    status: 'confirmed'
  },
  {
    id: '2',
    employeeId: '102',
    employeeName: 'Алиева Динара',
    date: new Date().toISOString().split('T')[0],
    time: '08:55',
    photo: 'https://placehold.co/200x200',
    location: 'Главный корпус, 305 кабинет',
    terminalLog: {
      entryTime: '08:45'
    },
    status: 'confirmed'
  },
  {
    id: '3',
    employeeId: '103',
    employeeName: 'Нурланов Азамат',
    date: new Date().toISOString().split('T')[0],
    time: '09:15',
    photo: 'https://placehold.co/200x200',
    location: 'Главный корпус, 401 кабинет',
    status: 'pending'
  }
];

interface IconComponentProps {
  icon: IconType;
  className?: string;
}

const IconComponent = ({ icon: Icon, className }: IconComponentProps) => {
  const Component = Icon as React.ComponentType<{ className?: string }>;
  return <Component className={className} />;
};

// Компонент
const FakePositionsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<FakePositionAlert[]>(initialAlerts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<FakePositionAlert['status'] | 'all'>('all');
  const [selectedAlert, setSelectedAlert] = useState<FakePositionAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [presenceData, setPresenceData] = useState<Presence[]>(initialPresenceData);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Фильтрация данных
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = selectedRiskLevel === 'all' || alert.riskLevel === selectedRiskLevel;
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus;
    
    return matchesSearch && matchesRisk && matchesStatus;
  });

  // Вспомогательные функции
  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'none': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status: FakePositionAlert['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnomalyLabel = (type: AnomalyType) => {
    return anomalyTypes.find(t => t.value === type)?.label || type;
  };

  const getStatusLabel = (status: FakePositionAlert['status']) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'investigating': return 'Расследуется';
      case 'resolved': return 'Решен';
      case 'dismissed': return 'Отклонен';
    }
  };

  const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE'];

  // Обработчики событий
  const handleAlertClick = (alert: FakePositionAlert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  // Обработка выбора фото
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Подтверждение присутствия
  const confirmPresence = () => {
    if (selectedImage) {
      const newPresence: Presence = {
        id: Date.now().toString(),
        employeeId: '101', // В реальном приложении брать из контекста авторизации
        employeeName: 'Текущий пользователь',
        date: selectedDate.toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        photo: previewUrl,
        location: 'Определено автоматически',
        terminalLog: {
          entryTime: new Date().toLocaleTimeString()
        },
        status: 'confirmed'
      };

      setPresenceData([...presenceData, newPresence]);
      setShowPhotoModal(false);
      setSelectedImage(null);
      setPreviewUrl('');
    }
  };

  // Форматирование даты
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Контроль фиктивных ставок (AI)</h1>
          <p className="text-sm text-gray-500">Система обнаружения потенциальных нарушений с помощью искусственного интеллекта</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center">
            <IconComponent icon={FaRobot} className="mr-2" />
            Запустить проверку
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md flex items-center">
            <IconComponent icon={FaFileExport} className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Календарь */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Календарь присутствия</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-7 gap-1">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="text-center text-sm text-gray-600 font-medium p-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date(2025, 3, i - 5); // Апрель 2025
                return (
                  <div
                    key={i}
                    className={`text-center p-2 rounded-lg cursor-pointer hover:bg-blue-50 
                      ${date.getMonth() === 3 ? 'text-gray-900' : 'text-gray-400'}
                      ${date.toDateString() === selectedDate.toDateString() ? 'bg-blue-100' : ''}`}
                    onClick={() => setSelectedDate(new Date(date))}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowPhotoModal(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center gap-2"
            >
              <IconComponent icon={FaCamera} className="w-4 h-4" />
              Подтвердить присутствие
            </button>
          </div>
        </div>

        {/* Статистика за день */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">
            Статистика за {new Date(selectedDate).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IconComponent icon={FaUserCheck} className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Присутствуют</div>
                  <div className="text-2xl font-bold text-green-600">24</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">85%</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <IconComponent icon={FaClock} className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Опоздали</div>
                  <div className="text-2xl font-bold text-yellow-600">3</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">10%</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <IconComponent icon={FaHistory} className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Отсутствуют</div>
                  <div className="text-2xl font-bold text-red-600">2</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">5%</div>
            </div>
          </div>
        </div>

        {/* Журнал присутствия */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Журнал присутствия</h2>
          <div className="space-y-4">
            {presenceData
              .filter(p => p.date === selectedDate.toISOString().split('T')[0])
              .map(presence => (
                <div key={presence.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={presence.photo}
                      alt="Фото присутствия"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{presence.employeeName}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <IconComponent icon={FaClock} className="w-4 h-4" />
                      {presence.time}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <IconComponent icon={FaMapMarkerAlt} className="w-4 h-4" />
                      {presence.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium
                      ${presence.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        presence.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {presence.status === 'confirmed' ? 'Подтверждено' :
                        presence.status === 'pending' ? 'Ожидает' : 'Отсутствует'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск сотрудника..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <IconComponent icon={FaSearch} className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="relative">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md appearance-none"
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value as RiskLevel | 'all')}
            >
              <option value="all">Все уровни риска</option>
              <option value="high">Высокий риск</option>
              <option value="medium">Средний риск</option>
              <option value="low">Низкий риск</option>
              <option value="none">Без риска</option>
            </select>
            <IconComponent icon={FaFilter} className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="relative">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md appearance-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as FakePositionAlert['status'] | 'all')}
            >
              <option value="all">Все статусы</option>
              <option value="new">Новые</option>
              <option value="investigating">Расследуются</option>
              <option value="resolved">Решены</option>
              <option value="dismissed">Отклонены</option>
            </select>
            <IconComponent icon={FaFilter} className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Сотрудник
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип аномалии
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Уровень риска
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата обнаружения
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Достоверность AI
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAlerts.map((alert) => (
              <tr 
                key={alert.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleAlertClick(alert)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{alert.employeeName}</div>
                  <div className="text-xs text-gray-500">{alert.position}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getAnomalyLabel(alert.anomalyType)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskLevelColor(alert.riskLevel)}`}>
                    {alert.riskLevel === 'high' ? 'Высокий' : 
                     alert.riskLevel === 'medium' ? 'Средний' : 
                     alert.riskLevel === 'low' ? 'Низкий' : 'Нет'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(alert.detectedDate).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      alert.aiConfidence >= 0.9 ? 'text-green-600' : 
                      alert.aiConfidence >= 0.7 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {Math.round(alert.aiConfidence * 100)}%
                    </span>
                    <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          alert.aiConfidence >= 0.9 ? 'bg-green-500' : 
                          alert.aiConfidence >= 0.7 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`} 
                        style={{ width: `${alert.aiConfidence * 100}%` }}>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                    {getStatusLabel(alert.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    className="text-blue-600 hover:text-blue-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertClick(alert);
                    }}
                  >
                    <IconComponent icon={FaEye} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно с детальной информацией об уведомлении */}
      {isModalOpen && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start">
                  <div className={`p-3 rounded-lg mr-4 ${
                    selectedAlert.riskLevel === 'high' ? 'bg-red-100 text-red-800' : 
                    selectedAlert.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                    selectedAlert.riskLevel === 'low' ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    <IconComponent icon={FaExclamationTriangle} className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full mr-2 ${getRiskLevelColor(selectedAlert.riskLevel)}`}>
                        {selectedAlert.riskLevel === 'high' ? 'Высокий риск' : 
                        selectedAlert.riskLevel === 'medium' ? 'Средний риск' : 
                        selectedAlert.riskLevel === 'low' ? 'Низкий риск' : 'Нет риска'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAlert.status)}`}>
                        {getStatusLabel(selectedAlert.status)}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">
                      {getAnomalyLabel(selectedAlert.anomalyType)}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Обнаружено {new Date(selectedAlert.detectedDate).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Сотрудник</div>
                  <div className="text-base font-medium text-gray-900">{selectedAlert.employeeName}</div>
                  <div className="text-sm text-gray-500 mt-1">{selectedAlert.position}</div>
                  <div className="text-sm text-gray-500">{selectedAlert.department}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">ID сотрудника</div>
                  <div className="flex items-center">
                    <IconComponent icon={FaFingerprint} className="text-blue-500 mr-2" />
                    <span className="text-base font-medium text-gray-900">{selectedAlert.employeeId}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Достоверность AI</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(selectedAlert.aiConfidence * 100)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        selectedAlert.aiConfidence >= 0.9 ? 'bg-green-500' : 
                        selectedAlert.aiConfidence >= 0.7 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`} 
                      style={{ width: `${selectedAlert.aiConfidence * 100}%` }}>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Описание</h3>
                <p className="text-gray-700">
                  {selectedAlert.description}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Доказательства</h3>
                <div className="space-y-4">
                  {selectedAlert.evidences.map((evidence, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-gray-900">{evidence.type}</div>
                        <div className="flex items-center">
                          <div className="text-sm text-gray-500 mr-2">Достоверность:</div>
                          <span className={`text-sm font-medium ${
                            evidence.confidenceScore >= 0.9 ? 'text-green-600' : 
                            evidence.confidenceScore >= 0.7 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {Math.round(evidence.confidenceScore * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{evidence.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedAlert.assignedTo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Назначено</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <IconComponent icon={FaUserCheck} className="text-blue-500 mr-2" />
                      <span className="font-medium">{selectedAlert.assignedTo}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedAlert.resolutionNote && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Примечание по разрешению</h3>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-start">
                      <IconComponent icon={FaInfoCircle} className="text-green-500 mr-2 mt-0.5" />
                      <p className="text-green-800">{selectedAlert.resolutionNote}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                {selectedAlert.status === 'new' && (
                  <>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md mr-2 flex items-center">
                      <IconComponent icon={FaThumbsDown} className="mr-2" />
                      Отклонить
                    </button>
                    <button className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md mr-2 flex items-center">
                      <IconComponent icon={FaInfoCircle} className="mr-2" />
                      Начать расследование
                    </button>
                  </>
                )}
                {selectedAlert.status === 'investigating' && (
                  <>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md mr-2 flex items-center">
                      <IconComponent icon={FaThumbsDown} className="mr-2" />
                      Отклонить как ложное
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center">
                      <IconComponent icon={FaThumbsUp} className="mr-2" />
                      Подтвердить нарушение
                    </button>
                  </>
                )}
                {(selectedAlert.status === 'resolved' || selectedAlert.status === 'dismissed') && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center">
                    <IconComponent icon={FaFileExport} className="mr-2" />
                    Экспорт отчета
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для загрузки фото */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Подтверждение присутствия</h3>
            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="space-y-2">
                    <IconComponent icon={FaImage} className="w-12 h-12 mx-auto text-gray-400" />
                    <div className="text-sm text-gray-500">
                      Нажмите для выбора фото или перетащите файл
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md"
              >
                Отмена
              </button>
              <button
                onClick={confirmPresence}
                disabled={!selectedImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50"
              >
                <IconComponent icon={FaCheck} className="w-4 h-4" />
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FakePositionsPage; 