// Контроль фиктивных ставок (AI)
import React, { useState } from 'react';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { UserX, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';

type Status = 'confirmed' | 'absent' | 'mismatch';

interface AttendanceRecord {
  id: number;
  teacher: string;
  date: string;
  lesson: string;
  time: string;
  qr: boolean;
  face: boolean;
  status: Status;
  comment?: string;
  disputeStatus?: 'none' | 'pending';
}

const MOCK_DATA: AttendanceRecord[] = [
  {
    id: 1,
    teacher: 'Ержан Нурланұлы',
    date: '2025-07-25',
    lesson: '1',
    time: '08:00–08:45',
    qr: true,
    face: true,
    status: 'confirmed',
    comment: ''
  },
  {
    id: 2,
    teacher: 'Айгүл Сейітқызы',
    date: '2025-07-25',
    lesson: '2',
    time: '09:00–09:45',
    qr: false,
    face: true,
    status: 'mismatch',
    comment: 'QR жоқ'
  },
  {
    id: 3,
    teacher: 'Данияр Қуанышбек',
    date: '2025-07-25',
    lesson: '3',
    time: '10:00–10:45',
    qr: false,
    face: false,
    status: 'absent',
    comment: 'Неявка'
  },
  {
    id: 4,
    teacher: 'Гүлнар Ермекқызы',
    date: '2025-07-25',
    lesson: '4',
    time: '11:00–11:45',
    qr: true,
    face: false,
    status: 'mismatch',
    comment: 'Face ID жоқ'
  },
  {
    id: 5,
    teacher: 'Мұрат Бекенұлы',
    date: '2025-07-25',
    lesson: '5',
    time: '12:00–12:45',
    qr: true,
    face: true,
    status: 'confirmed',
    comment: ''
  },
  {
    id: 6,
    teacher: 'Салтанат Жанарбекқызы',
    date: '2025-07-25',
    lesson: '6',
    time: '13:00–13:45',
    qr: false,
    face: false,
    status: 'absent',
    comment: 'Неявка'
  },
  {
    id: 7,
    teacher: 'Арман Талғатұлы',
    date: '2025-07-25',
    lesson: '7',
    time: '14:00–14:45',
    qr: true,
    face: true,
    status: 'confirmed',
    comment: ''
  },
  {
    id: 8,
    teacher: 'Жанна Қайратқызы',
    date: '2025-07-25',
    lesson: '8',
    time: '15:00–15:45',
    qr: false,
    face: true,
    status: 'mismatch',
    comment: 'QR жоқ'
  },
  {
    id: 9,
    teacher: 'Бауыржан Ерболұлы',
    date: '2025-07-25',
    lesson: '9',
    time: '16:00–16:45',
    qr: true,
    face: false,
    status: 'mismatch',
    comment: 'Face ID жоқ'
  },
  {
    id: 10,
    teacher: 'Айдана Серікқызы',
    date: '2025-07-25',
    lesson: '10',
    time: '17:00–17:45',
    qr: true,
    face: true,
    status: 'confirmed',
    comment: ''
  }
];

const STATUS_LABELS: Record<Status, string> = {
  confirmed: 'Подтверждено',
  absent: 'Неявка',
  mismatch: 'Несовпадение'
};

const STATUS_ICONS: Record<Status, JSX.Element> = {
  confirmed: <CheckCircle className="text-green-500 w-5 h-5" />,
  absent: <XCircle className="text-red-500 w-5 h-5" />,
  mismatch: <AlertTriangle className="text-yellow-500 w-5 h-5" />
};

const FakePositions: React.FC = () => {
  const [filters, setFilters] = useState({
    period: 'day',
    search: '',
    subject: '',
    status: 'all'
  });
  const [data, setData] = useState(MOCK_DATA);
  const [disputeId, setDisputeId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePending, setDisputePending] = useState<{ [id: number]: boolean }>({});

  // Фильтрация данных
  const filteredData = data.filter(rec => {
    const matchesSearch = !filters.search || rec.teacher.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || rec.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  // Метрики
  const total = data.length;
  const confirmed = data.filter(r => r.status === 'confirmed').length;
  const mismatch = data.filter(r => r.status === 'mismatch').length;
  const absent = data.filter(r => r.status === 'absent').length;

  // Оспорить
  const openDispute = (id: number) => {
    setDisputeId(id);
    setDisputeReason('');
  };
  const submitDispute = () => {
    if (disputeId !== null) {
      setDisputePending(prev => ({ ...prev, [disputeId]: true }));
      setDisputeId(null);
    }
  };

  // Адаптивность: карточки на мобильных
  const isMobile = window.innerWidth < 768;
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <UserX className="w-7 h-7" />
        Контроль фиктивных ставок (AI)
      </h1>

      {/* Фильтры */}
      {!isMobile ? (
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <select
            className="px-3 py-2 border rounded"
            value={filters.period}
            onChange={e => setFilters(f => ({ ...f, period: e.target.value }))}
          >
            <option value="day">День</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
          </select>
          <input
            type="text"
            className="px-3 py-2 border rounded flex-1"
            placeholder="Поиск по ФИО"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
          <input
            type="text"
            className="px-3 py-2 border rounded"
            placeholder="Фильтр по предмету"
            value={filters.subject}
            onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}
          />
          <select
            className="px-3 py-2 border rounded"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="all">Все</option>
            <option value="confirmed">Подтверждено</option>
            <option value="absent">Неявка</option>
            <option value="mismatch">Несовпадение</option>
          </select>
          <button className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
            <Download className="w-4 h-4" />
            Выгрузить отчёт
          </button>
        </div>
      ) : (
        <>
          <button
            className="mb-4 px-3 py-2 bg-blue-600 text-white rounded w-full"
            onClick={() => setShowMobileFilters(true)}
          >
            Фильтры
          </button>
          {showMobileFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold mb-4">Фильтры</h2>
                <div className="flex flex-col gap-3 mb-4">
                  <select
                    className="px-3 py-2 border rounded"
                    value={filters.period}
                    onChange={e => setFilters(f => ({ ...f, period: e.target.value }))}
                  >
                    <option value="day">День</option>
                    <option value="week">Неделя</option>
                    <option value="month">Месяц</option>
                  </select>
                  <input
                    type="text"
                    className="px-3 py-2 border rounded"
                    placeholder="Поиск по ФИО"
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="px-3 py-2 border rounded"
                    placeholder="Фильтр по предмету"
                    value={filters.subject}
                    onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}
                  />
                  <select
                    className="px-3 py-2 border rounded"
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="all">Все</option>
                    <option value="confirmed">Подтверждено</option>
                    <option value="absent">Неявка</option>
                    <option value="mismatch">Несовпадение</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded"
                    onClick={() => setShowMobileFilters(false)}
                  >
                    Закрыть
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={() => setShowMobileFilters(false)}
                  >
                    Применить
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Аналитика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded shadow p-3 flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">Всего часов</span>
          <span className="text-lg font-bold">{total}</span>
        </div>
        <div className="bg-white rounded shadow p-3 flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">Подтверждено</span>
          <span className="text-lg font-bold text-green-600">{confirmed}</span>
        </div>
        <div className="bg-white rounded shadow p-3 flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">Несовпадений</span>
          <span className="text-lg font-bold text-yellow-600">{mismatch}</span>
        </div>
        <div className="bg-white rounded shadow p-3 flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">Неявок</span>
          <span className="text-lg font-bold text-red-600">{absent}</span>
        </div>
      </div>

      {/* Таблица/карточки */}
      {!isMobile ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">Преподаватель</th>
                <th className="px-3 py-2 text-left">Дата</th>
                <th className="px-3 py-2 text-left">Урок</th>
                <th className="px-3 py-2 text-left">Время</th>
                <th className="px-3 py-2 text-center">QR-отметка</th>
                <th className="px-3 py-2 text-center">Турникет (Face ID)</th>
                <th className="px-3 py-2 text-center">Статус</th>
                <th className="px-3 py-2 text-left">Комментарий</th>
                <th className="px-3 py-2 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(rec => (
                <tr key={rec.id} className="border-t">
                  <td className="px-3 py-2">{rec.teacher}</td>
                  <td className="px-3 py-2">{rec.date}</td>
                  <td className="px-3 py-2">{rec.lesson}</td>
                  <td className="px-3 py-2">{rec.time}</td>
                  <td className="px-3 py-2 text-center">{rec.qr ? <CheckCircle className="text-green-500 w-5 h-5 mx-auto" /> : <XCircle className="text-red-500 w-5 h-5 mx-auto" />}</td>
                  <td className="px-3 py-2 text-center">{rec.face ? <CheckCircle className="text-green-500 w-5 h-5 mx-auto" /> : <XCircle className="text-red-500 w-5 h-5 mx-auto" />}</td>
                  <td className="px-3 py-2 text-center flex items-center gap-1 justify-center">
                    {STATUS_ICONS[rec.status]}
                    <span className="text-xs">{STATUS_LABELS[rec.status]}</span>
                  </td>
                  <td className="px-3 py-2">{rec.comment}</td>
                  <td className="px-3 py-2 text-center">
                    {(rec.status === 'absent' || rec.status === 'mismatch') && (
                      disputePending[rec.id] ? (
                        <span className="text-xs text-orange-600">Ожидает проверки</span>
                      ) : (
                        <button
                          className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs"
                          onClick={() => openDispute(rec.id)}
                        >
                          Оспорить
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-gray-500">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredData.map(rec => (
            <div key={rec.id} className="bg-white rounded shadow p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">{rec.teacher}</span>
                <span className="text-xs text-gray-500">{rec.date}</span>
                <span className="text-xs text-gray-500">{rec.lesson}</span>
                <span className="text-xs text-gray-500">{rec.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>QR: {rec.qr ? <CheckCircle className="text-green-500 w-4 h-4" /> : <XCircle className="text-red-500 w-4 h-4" />}</span>
                <span>Face: {rec.face ? <CheckCircle className="text-green-500 w-4 h-4" /> : <XCircle className="text-red-500 w-4 h-4" />}</span>
              </div>
              <div className="flex items-center gap-2">
                {STATUS_ICONS[rec.status]}
                <span className="text-xs">{STATUS_LABELS[rec.status]}</span>
              </div>
              <div className="text-xs text-gray-500">{rec.comment}</div>
              {(rec.status === 'absent' || rec.status === 'mismatch') && (
                disputePending[rec.id] ? (
                  <span className="text-xs text-orange-600">Ожидает проверки</span>
                ) : (
                  <button
                    className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs"
                    onClick={() => openDispute(rec.id)}
                  >
                    Оспорить
                  </button>
                )
              )}
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="text-center py-6 text-gray-500">Нет данных</div>
          )}
        </div>
      )}

      {/* Модальное окно "Оспорить" */}
      {disputeId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Оспорить статус</h2>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded mb-4"
              placeholder="Причина"
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded"
                onClick={() => setDisputeId(null)}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={submitDispute}
                disabled={!disputeReason.trim()}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FakePositions;
