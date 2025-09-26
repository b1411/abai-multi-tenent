import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import attendanceSessionService from '../services/attendanceSessionService';
import { AttendanceCheckInResponse } from '../types/attendance';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui';
import { AxiosError } from 'axios';

const formatTime = (value: string) => {
  if (!value) {
    return '';
  }

  if (value.length === 5 && value.includes(':')) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const AttendanceCheckIn: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<AttendanceCheckInResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token');
  }, [location.search]);

  useEffect(() => {
    if (!token) {
      setError('Токен не найден. Отсканируйте QR-код ещё раз или обратитесь к преподавателю.');
      setStatus('error');
      return;
    }

    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      setStatus('idle');
      return;
    }

    const participantType = user.role === 'STUDENT' ? 'student' : 'teacher';

    setStatus('loading');
    setError(null);
    attendanceSessionService
      .checkIn({ token, participantType })
      .then((response) => {
        setResult(response);
        setStatus('success');
      })
      .catch((err: AxiosError<{ message?: string }>) => {
        const message = err.response?.data?.message || err.message || 'Не удалось отметить посещение.';
        setError(message);
        setStatus('error');
      });
  }, [token, user, isAuthenticated, isLoading]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const renderContent = () => {
    if (!token) {
      return (
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold">QR-код недействителен</h1>
          <p className="text-gray-600">Похоже, ссылка повреждена. Попробуйте отсканировать код ещё раз.</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" className="text-blue-500" />
          <div className="text-gray-600">Проверяем токен…</div>
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      return (
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Нужна авторизация</h1>
          <p className="text-gray-600">
            Чтобы отметиться, войдите в систему под своей учётной записью и повторно отсканируйте QR-код.
          </p>
          <Button onClick={handleLoginClick}>Войти</Button>
        </div>
      );
    }

    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" className="text-blue-500" />
          <div className="text-gray-600">Фиксируем посещаемость…</div>
        </div>
      );
    }

    if (status === 'error' && error) {
      return (
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-red-600">Не получилось отметиться</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500">Попробуйте обновить страницу или обратитесь к администратору.</p>
        </div>
      );
    }

    if (status === 'success' && result) {
      return (
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-green-600">Посещение отмечено</h1>
            <p className="text-gray-600">Спасибо! Мы записали вашу отметку.</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
            <div>
              <div className="text-sm text-gray-500">Занятие</div>
              <div className="text-lg font-semibold text-gray-900">{result.lesson.subject}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <div className="text-gray-500">Дата</div>
                <div className="font-medium">{formatDate(result.lesson.date)}</div>
              </div>
              <div>
                <div className="text-gray-500">Время</div>
                <div className="font-medium">
                  {formatTime(result.lesson.startTime)} — {formatTime(result.lesson.endTime)}
                </div>
              </div>
              {result.lesson.groupName && (
                <div>
                  <div className="text-gray-500">Группа</div>
                  <div className="font-medium">{result.lesson.groupName}</div>
                </div>
              )}
              {result.lesson.classroomName && (
                <div>
                  <div className="text-gray-500">Аудитория</div>
                  <div className="font-medium">{result.lesson.classroomName}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500">Преподаватель</div>
                <div className="font-medium">{result.lesson.teacherName}</div>
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
              <div className="font-medium">QR-токен зафиксирован</div>
              <div>
                Время отметки: {formatDate(result.session.consumedAt ?? result.session.occursAt)} — {formatTime(result.session.consumedAt ?? result.session.occursAt)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCheckIn;
