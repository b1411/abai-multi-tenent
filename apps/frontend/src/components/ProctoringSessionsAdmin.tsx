import React, { useState, useEffect, useCallback } from 'react';
import { proctoringService, ProctoringSession } from '../services/proctoringService';
import { Eye, Calendar, User, BookOpen, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TranscriptMessage {
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isAudio?: boolean;
}

interface ProctoringSessionsAdminProps {
  onViewSession?: (session: ProctoringSession) => void;
}

const ProctoringSessionsAdmin: React.FC<ProctoringSessionsAdminProps> = ({ onViewSession }) => {
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    studentId: '',
    homeworkId: '',
    page: 1,
    limit: 10
  });

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const apiFilters = {
        status: filters.status || undefined,
        studentId: filters.studentId ? parseInt(filters.studentId) : undefined,
        homeworkId: filters.homeworkId ? parseInt(filters.homeworkId) : undefined,
        page: filters.page,
        limit: filters.limit
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await proctoringService.getAllSessions(apiFilters) as any;
      setSessions(Array.isArray(data) ? data : data.sessions || []);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке сессий прокторинга');
      console.error('Error loading proctoring sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Завершена';
      case 'IN_PROGRESS':
        return 'В процессе';
      case 'FAILED':
        return 'Неудача';
      default:
        return 'Неизвестно';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Загрузка сессий...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadSessions}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Сессии прокторинга</h2>

        {/* Фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все статусы</option>
            <option value="IN_PROGRESS">В процессе</option>
            <option value="COMPLETED">Завершена</option>
            <option value="FAILED">Неудача</option>
          </select>

          <input
            type="number"
            placeholder="ID студента"
            value={filters.studentId}
            onChange={(e) => setFilters(prev => ({ ...prev, studentId: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="ID домашнего задания"
            value={filters.homeworkId}
            onChange={(e) => setFilters(prev => ({ ...prev, homeworkId: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Применить фильтры
          </button>
        </div>
      </div>

      {/* Таблица сессий */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {sessions.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              Сессии прокторинга не найдены
            </li>
          ) : (
            sessions.map((session) => (
              <li key={session.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(session.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          Студент ID: {session.studentId}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Домашнее задание ID: {session.homeworkId}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      session.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      session.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(session.status)}
                    </span>

                    {onViewSession && (
                      <button
                        onClick={() => onViewSession(session)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Просмотр
                      </button>
                    )}
                  </div>
                </div>

                {session.endedAt && (
                  <div className="mt-2 text-sm text-gray-500">
                    Завершена: {formatDate(session.endedAt)}
                  </div>
                )}

                {session.results && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div>Оценка: {session.results.score || 'Не указана'}</div>
                    {session.results.feedback && (
                      <div>Отзыв: {session.results.feedback}</div>
                    )}
                  </div>
                )}

                {session.transcript && Array.isArray(session.transcript) && session.transcript.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Транскрипт разговора:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {session.transcript.map((message: TranscriptMessage, index: number) => (
                        <div key={index} className={`p-2 rounded text-sm ${
                          message.type === 'user' ? 'bg-white border-l-4 border-blue-400' :
                          message.type === 'assistant' ? 'bg-green-50 border-l-4 border-green-400' :
                          'bg-gray-50 border-l-4 border-gray-400'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium text-xs ${
                              message.type === 'user' ? 'text-blue-700' :
                              message.type === 'assistant' ? 'text-green-700' :
                              'text-gray-700'
                            }`}>
                              {message.type === 'user' ? '🎤 Ученик' :
                               message.type === 'assistant' ? '🤖 AI' :
                               '📝 Система'}
                              {message.isAudio && ' (аудио)'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="text-gray-800">{message.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Пагинация */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={filters.page === 1}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Предыдущая
        </button>

        <span className="text-sm text-gray-700">
          Страница {filters.page}
        </span>

        <button
          onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Следующая
        </button>
      </div>
    </div>
  );
};

export default ProctoringSessionsAdmin;