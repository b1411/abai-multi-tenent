import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheck, FaTimes, FaClock, FaCalendar, FaComment } from 'react-icons/fa';

interface BookingRequest {
  id: string;
  roomNumber: string;
  teacherName: string;
  purpose: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  approvals: {
    director: boolean;
    supervisor: boolean;
  };
  comments: Array<{
    author: string;
    text: string;
    timestamp: string;
  }>;
}

const BookingRequestsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roomNumber = searchParams.get('room');
  const navigate = useNavigate();
  
  // Временные данные для примера
  const [requests, setRequests] = useState<BookingRequest[]>([
    {
      id: '1',
      roomNumber: '301',
      teacherName: 'Иванов И.И.',
      purpose: 'Дополнительное занятие по физике',
      startTime: '14:00',
      endTime: '15:30',
      date: '2024-03-25',
      status: 'pending',
      approvals: {
        director: true,
        supervisor: false
      },
      comments: [
        {
          author: 'Директор',
          text: 'Одобряю проведение дополнительного занятия',
          timestamp: '2024-03-24 15:30'
        }
      ]
    },
    {
      id: '2',
      roomNumber: '405',
      teacherName: 'Петрова М.С.',
      purpose: 'Подготовка к олимпиаде по информатике',
      startTime: '16:00',
      endTime: '18:00',
      date: '2024-03-26',
      status: 'approved',
      approvals: {
        director: true,
        supervisor: true
      },
      comments: [
        {
          author: 'Директор',
          text: 'Одобрено',
          timestamp: '2024-03-23 12:45'
        },
        {
          author: 'Контролирующий',
          text: 'Подтверждаю',
          timestamp: '2024-03-23 14:20'
        }
      ]
    },
    {
      id: '3',
      roomNumber: '201',
      teacherName: 'Сидоров А.В.',
      purpose: 'Консультация по химии',
      startTime: '13:30',
      endTime: '14:30',
      date: '2024-03-27',
      status: 'rejected',
      approvals: {
        director: false,
        supervisor: false
      },
      comments: [
        {
          author: 'Директор',
          text: 'В это время запланирован ремонт аудитории',
          timestamp: '2024-03-24 09:15'
        }
      ]
    },
    {
      id: '4',
      roomNumber: '302',
      teacherName: 'Кузнецова М.В.',
      purpose: 'Родительское собрание',
      startTime: '18:00',
      endTime: '19:30',
      date: '2024-03-28',
      status: 'pending',
      approvals: {
        director: false,
        supervisor: true
      },
      comments: [
        {
          author: 'Контролирующий',
          text: 'Техническое оснащение подготовлено',
          timestamp: '2024-03-24 16:40'
        }
      ]
    },
    {
      id: '5',
      roomNumber: '401',
      teacherName: 'Морозов Д.И.',
      purpose: 'Кружок робототехники',
      startTime: '15:00',
      endTime: '17:00',
      date: '2024-03-29',
      status: 'approved',
      approvals: {
        director: true,
        supervisor: true
      },
      comments: []
    },
    {
      id: '6',
      roomNumber: '304',
      teacherName: 'Волкова Е.А.',
      purpose: 'Мастер-класс по биологии',
      startTime: '14:00',
      endTime: '16:00',
      date: '2024-03-30',
      status: 'rejected',
      approvals: {
        director: false,
        supervisor: false
      },
      comments: [
        {
          author: 'Контролирующий',
          text: 'Аудитория занята другим мероприятием',
          timestamp: '2024-03-25 11:20'
        }
      ]
    },
    {
      id: '7',
      roomNumber: '405',
      teacherName: 'Иванова Лариса',
      purpose: 'Подготовка к ЕНТ по информатике',
      startTime: '15:00',
      endTime: '17:00',
      date: '2024-03-31',
      status: 'pending',
      approvals: {
        director: true,
        supervisor: false
      },
      comments: [
        {
          author: 'Директор',
          text: 'Согласовано при условии наличия списка участников',
          timestamp: '2024-03-25 14:30'
        }
      ]
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    purpose: '',
    date: '',
    startTime: '',
    endTime: '',
    additionalInfo: ''
  });
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [newComment, setNewComment] = useState('');

  const handleSubmitRequest = () => {
    // Здесь будет логика отправки запроса
    setIsModalOpen(false);
  };

  const handleApprove = (request: BookingRequest) => {
    // Здесь будет логика одобрения запроса
    setRequests(requests.map(r => {
      if (r.id === request.id) {
        return {
          ...r,
          status: 'approved',
          approvals: {
            ...r.approvals,
            director: true
          }
        };
      }
      return r;
    }));
    setSelectedRequest(null);
  };

  const handleReject = (request: BookingRequest) => {
    // Здесь будет логика отклонения запроса
    if (!newComment.trim()) {
      alert('Пожалуйста, укажите причину отклонения');
      return;
    }
    setRequests(requests.map(r => {
      if (r.id === request.id) {
        return {
          ...r,
          status: 'rejected',
          approvals: {
            director: false,
            supervisor: false
          },
          comments: [
            ...r.comments,
            {
              author: 'Директор',
              text: newComment,
              timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
            }
          ]
        };
      }
      return r;
    }));
    setSelectedRequest(null);
    setNewComment('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Запросы на бронирование аудиторий</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Создать запрос
        </button>
      </div>

      {/* Таблица запросов */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Аудитория</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Преподаватель</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цель</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата и время</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Согласования</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.roomNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.teacherName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {request.purpose}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{request.date}</span>
                    <span className="text-blue-600">{request.startTime}-{request.endTime}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status === 'approved' ? 'Одобрено' :
                     request.status === 'rejected' ? 'Отклонено' : 'На рассмотрении'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <span className={`flex items-center ${
                      request.approvals.director ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <FaCheck className="mr-1" />
                      Директор
                    </span>
                    <span className={`flex items-center ${
                      request.approvals.supervisor ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <FaCheck className="mr-1" />
                      Контролирующий
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Подробнее
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно создания запроса */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs sm:max-w-md md:max-w-lg">
            <h2 className="text-xl font-bold mb-4">Новый запрос на бронирование</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Аудитория
                </label>
                <input
                  type="text"
                  value={roomNumber || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цель бронирования
                </label>
                <input
                  type="text"
                  value={newRequest.purpose}
                  onChange={(e) => setNewRequest({...newRequest, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Укажите цель использования аудитории"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата
                </label>
                <input
                  type="date"
                  value={newRequest.date}
                  onChange={(e) => setNewRequest({...newRequest, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время начала
                  </label>
                  <input
                    type="time"
                    value={newRequest.startTime}
                    onChange={(e) => setNewRequest({...newRequest, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время окончания
                  </label>
                  <input
                    type="time"
                    value={newRequest.endTime}
                    onChange={(e) => setNewRequest({...newRequest, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дополнительная информация
                </label>
                <textarea
                  value={newRequest.additionalInfo}
                  onChange={(e) => setNewRequest({...newRequest, additionalInfo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Укажите дополнительные требования или примечания"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Отправить запрос
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подробной информации */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs sm:max-w-2xl md:max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Подробная информация о запросе</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Аудитория:</p>
                  <p className="font-medium">{selectedRequest.roomNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Преподаватель:</p>
                  <p className="font-medium">{selectedRequest.teacherName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Цель:</p>
                  <p className="font-medium">{selectedRequest.purpose}</p>
                </div>
                <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-600">Дата:</p>
                      <p className="font-medium text-lg text-gray-900">{selectedRequest.date}</p>
                    </div>
                    <div className="border-l border-gray-300 pl-4">
                      <p className="text-sm text-gray-600">Время:</p>
                      <p className="font-medium text-lg text-blue-600">
                        {selectedRequest.startTime} - {selectedRequest.endTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Статус согласования:</p>
                <div className="flex space-x-4">
                  <span className={`flex items-center ${
                    selectedRequest.approvals.director ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <FaCheck className="mr-1" />
                    Директор
                  </span>
                  <span className={`flex items-center ${
                    selectedRequest.approvals.supervisor ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <FaCheck className="mr-1" />
                    Контролирующий
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Комментарии:</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 max-h-40 overflow-y-auto">
                  {selectedRequest.comments.map((comment, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Добавить комментарий:
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Введите ваш комментарий..."
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => handleReject(selectedRequest)}
                  className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                >
                  Отклонить
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest)}
                  className="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
                >
                  Одобрить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingRequestsPage;
