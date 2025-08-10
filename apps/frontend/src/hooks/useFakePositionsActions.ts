import { useState } from 'react';
import { DisputeFormData } from '../types/fakePositions';

export const useFakePositionsActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Подача спора
  const submitDispute = async (disputeData: DisputeFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Имитация успешной отправки
      console.log('Спор отправлен:', disputeData);
      
      // Здесь будет реальный API вызов:
      // const response = await fetch('/api/fake-positions/dispute', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(disputeData)
      // });
      
      setLoading(false);
      return true;
    } catch (err) {
      setError('Ошибка при отправке спора');
      setLoading(false);
      return false;
    }
  };

  // Отметка через QR
  const checkInWithQR = async (recordId: number, qrData: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Имитация проверки времени
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Простая проверка времени (для демо)
      if (currentHour < 8 || currentHour > 13) {
        throw new Error('Отметка доступна только во время учебных часов (8:00-13:20)');
      }

      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('QR отметка успешна:', { recordId, qrData });
      
      // Здесь будет реальный API вызов:
      // const response = await fetch('/api/fake-positions/check-in', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ recordId, qrData })
      // });
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отметке');
      setLoading(false);
      return false;
    }
  };

  // Экспорт отчета
  const exportReport = async (format: 'xlsx' | 'pdf' = 'xlsx'): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const date = new Date().toISOString().split('T')[0];
      const baseName = `attendance_report_${date}`;
      if (format === 'xlsx') {
        const XLSX = (await import('xlsx')).default || (await import('xlsx'));
        const ws = XLSX.utils.aoa_to_sheet([
          ['Отчет посещаемости (демо)'],
          ['Дата', date],
          [],
          ['Преподаватель', 'Группа', 'Дата', 'Статус'],
          // Демо-строки; в реальном API сюда подставляем реальные данные
          ['—', '—', date, '—']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Отчет');
        XLSX.writeFile(wb, `${baseName}.xlsx`);
      } else if (format === 'pdf') {
        // Простая CSV-выгрузка вместо PDF как временное решение
        const csv = ['Преподаватель,Группа,Дата,Статус', `—,—,${date},—`].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
      setLoading(false);
      return true;
    } catch (err) {
      setError('Ошибка при экспорте отчета');
      setLoading(false);
      return false;
    }
  };

  // Генерация QR-кода для аудитории
  const generateQRCode = (roomId: string, lessonId: string): string => {
    const qrData = {
      room_id: roomId,
      lesson_id: lessonId,
      datetime: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    return JSON.stringify(qrData);
  };

  // Проверка возможности отметки по времени
  const canCheckIn = (lessonTime: string): boolean => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Парсим время урока (например, "08:00-08:45")
    const [startTime] = lessonTime.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    const lessonStartTime = hours * 60 + minutes;
    
    // Доступно за 10 минут до и 5 минут после начала урока
    const checkInStart = lessonStartTime - 10;
    const checkInEnd = lessonStartTime + 5;
    
    return currentTime >= checkInStart && currentTime <= checkInEnd;
  };

  // Получение статуса времени для отметки
  const getCheckInStatus = (lessonTime: string): {
    canCheckIn: boolean;
    message: string;
    timeLeft?: number;
  } => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startTime] = lessonTime.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    const lessonStartTime = hours * 60 + minutes;
    
    const checkInStart = lessonStartTime - 10;
    const checkInEnd = lessonStartTime + 5;
    
    if (currentTime < checkInStart) {
      const timeLeft = checkInStart - currentTime;
      return {
        canCheckIn: false,
        message: `Отметка будет доступна через ${timeLeft} мин`,
        timeLeft
      };
    } else if (currentTime > checkInEnd) {
      return {
        canCheckIn: false,
        message: 'Время для отметки истекло'
      };
    } else {
      const timeLeft = checkInEnd - currentTime;
      return {
        canCheckIn: true,
        message: `Отметка доступна (осталось ${timeLeft} мин)`,
        timeLeft
      };
    }
  };

  return {
    submitDispute,
    checkInWithQR,
    exportReport,
    generateQRCode,
    canCheckIn,
    getCheckInStatus,
    loading,
    error,
    clearError: () => setError(null)
  };
};
