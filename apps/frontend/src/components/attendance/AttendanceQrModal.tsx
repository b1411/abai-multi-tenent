import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { AlertCircle, Calendar, Check, Clock, Copy, MapPin, RefreshCw, User } from 'lucide-react';

import { Modal, Button } from '../ui';
import { Spinner } from '../ui/Spinner';
import { AttendanceSession } from '../../types/attendance';
import { ScheduleItem } from '../../types/schedule';

interface AttendanceQrModalProps {
  isOpen: boolean;
  lesson: ScheduleItem | null;
  occursAtLocal: string;
  session: AttendanceSession | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onOccursAtChange: (value: string) => void;
  onGenerate: () => void;
}

const formatDateTime = (value: string) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('ru-RU', {
    dateStyle: 'long',
    timeStyle: 'short'
  });
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  const paddedSeconds = String(secs).padStart(2, '0');
  return `${minutes}:${paddedSeconds}`;
};

const AttendanceQrModal: React.FC<AttendanceQrModalProps> = ({
  isOpen,
  lesson,
  occursAtLocal,
  session,
  loading,
  error,
  onClose,
  onOccursAtChange,
  onGenerate
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'success'>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const qrValue = useMemo(() => session?.qrValue || session?.checkInUrl || '', [session]);

  useEffect(() => {
    setCopyState('idle');
  }, [session?.id, isOpen]);

  useEffect(() => {
    if (!session?.expiresAt || !isOpen) {
      setRemainingSeconds(null);
      return;
    }

    const target = new Date(session.expiresAt).getTime();
    if (Number.isNaN(target)) {
      setRemainingSeconds(null);
      return;
    }

    const tick = () => {
      const diffSeconds = Math.max(0, Math.round((target - Date.now()) / 1000));
      setRemainingSeconds(diffSeconds);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [session?.expiresAt, isOpen]);

  const handleCopy = async () => {
    if (!qrValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(qrValue);
      setCopyState('success');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('idle');
    }
  };

  const displayOccursAt = useMemo(() => formatDateTime(occursAtLocal), [occursAtLocal]);
  const displayExpiresAt = useMemo(() => formatDateTime(session?.expiresAt ?? ''), [session?.expiresAt]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR-код посещаемости"
      size="xl"
      className="max-w-4xl"
    >
      {!lesson ? (
        <div className="text-sm text-gray-600">
          Выберите урок в расписании, чтобы сформировать QR-код.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <div className="font-semibold text-gray-900 text-base mb-1">{lesson.subject}</div>
              <div className="flex items-center text-gray-600">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span>{lesson.teacherName}</span>
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>{displayOccursAt}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span>{lesson.roomId || 'Аудитория не указана'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span>
                  {lesson.startTime}–{lesson.endTime}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="qr-occurs-at">
              Дата и время занятия
            </label>
            <input
              id="qr-occurs-at"
              type="datetime-local"
              value={occursAtLocal}
              onChange={(event) => onOccursAtChange(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              Если нужно, скорректируйте дату и время конкретного занятия перед генерацией QR-кода.
            </p>
          </div>

          {error && (
            <div className="flex items-start space-x-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4 flex items-center justify-center min-h-[280px]">
                {loading ? (
                  <Spinner size="lg" className="text-blue-500" />
                ) : qrValue ? (
                  <div className="bg-white p-4 rounded-lg shadow-inner">
                    <QRCode value={qrValue} size={232} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center">
                    Укажите дату занятия и нажмите «Сгенерировать QR», чтобы получить код.
                  </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-72 space-y-4">
              <Button
                variant="primary"
                onClick={onGenerate}
                loading={loading}
                disabled={!occursAtLocal || loading}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Сгенерировать QR
              </Button>

              {qrValue && (
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 space-y-2">
                  <div className="text-xs uppercase text-gray-500">Ссылка для отметки</div>
                  <div className="break-words leading-relaxed text-gray-800">{qrValue}</div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    {copyState === 'success' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copyState === 'success' ? 'Скопировано' : 'Скопировать'}
                  </button>
                </div>
              )}

              {session?.expiresAt && (
                <div className="border border-amber-200 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Истекает: {displayExpiresAt}</span>
                  </div>
                  {remainingSeconds !== null && (
                    <div className="text-xs text-amber-700 mt-1">
                      Осталось времени: {formatDuration(remainingSeconds)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AttendanceQrModal;
