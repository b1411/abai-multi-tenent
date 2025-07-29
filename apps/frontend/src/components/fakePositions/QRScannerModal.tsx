import React, { useState, useEffect } from 'react';
import { FaTimes, FaQrcode, FaCheckCircle, FaSpinner, FaCamera } from 'react-icons/fa';
import { AttendanceRecord } from '../../types/fakePositions';
import { useFakePositionsActions } from '../../hooks/useFakePositionsActions';

interface QRScannerModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({
  record,
  onClose,
  onSuccess
}) => {
  const { checkInWithQR, generateQRCode, getCheckInStatus, loading, error } = useFakePositionsActions();
  const [scanStep, setScanStep] = useState<'ready' | 'scanning' | 'success'>('ready');
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!record) return;
    
    // Обновляем время каждую секунду
    const interval = setInterval(() => {
      const status = getCheckInStatus(record.time);
      setTimeLeft(status.timeLeft || 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [record?.time, getCheckInStatus]);

  if (!record) return null;

  const checkInStatus = getCheckInStatus(record.time);

  const handleScan = async () => {
    setScanStep('scanning');
    
    // Имитация процесса сканирования
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Генерируем QR-данные для демо
    const qrData = generateQRCode(record.room, record.id.toString());
    
    const success = await checkInWithQR(record.id, qrData);
    
    if (success) {
      setScanStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } else {
      setScanStep('ready');
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} мин`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}мин`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                QR-отметка
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Отметьтесь на занятии
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              disabled={scanStep === 'scanning'}
            >
              <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Lesson Info */}
        <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-gray-500">Урок:</span>
              <span className="ml-2 font-medium">{record.lesson} урок</span>
            </div>
            <div>
              <span className="text-gray-500">Время:</span>
              <span className="ml-2 font-medium">{record.time}</span>
            </div>
            <div>
              <span className="text-gray-500">Предмет:</span>
              <span className="ml-2 font-medium">{record.subject}</span>
            </div>
            <div>
              <span className="text-gray-500">Аудитория:</span>
              <span className="ml-2 font-medium">{record.room}</span>
            </div>
          </div>
        </div>

        {/* Scanner Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Time Status */}
          <div className={`mb-4 p-3 rounded-lg ${
            checkInStatus.canCheckIn 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                checkInStatus.canCheckIn ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <p className={`text-sm font-medium ${
                checkInStatus.canCheckIn ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {checkInStatus.message}
              </p>
            </div>
          </div>

          {/* Scanner Area */}
          <div className="text-center">
            {scanStep === 'ready' && (
              <div>
                <div className="w-32 h-32 mx-auto mb-6 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <FaQrcode className="w-16 h-16 text-gray-400" />
                </div>
                
                <p className="text-sm text-gray-600 mb-6">
                  Нажмите кнопку ниже, чтобы включить камеру и отсканировать QR-код в аудитории {record.room}
                </p>

                {checkInStatus.canCheckIn ? (
                  <button
                    onClick={handleScan}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <FaCamera className="w-5 h-5" />
                    <span>Включить камеру</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg cursor-not-allowed"
                  >
                    Отметка недоступна
                  </button>
                )}
              </div>
            )}

            {scanStep === 'scanning' && (
              <div>
                <div className="w-32 h-32 mx-auto mb-6 border-4 border-blue-500 rounded-lg flex items-center justify-center bg-blue-50 animate-pulse">
                  <FaSpinner className="w-16 h-16 text-blue-600 animate-spin" />
                </div>
                
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Сканируем QR-код...
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Направьте камеру на QR-код в аудитории
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-800">
                    💡 QR-код должен находиться на двери или стене аудитории
                  </p>
                </div>
              </div>
            )}

            {scanStep === 'success' && (
              <div>
                <div className="w-32 h-32 mx-auto mb-6 border-4 border-green-500 rounded-lg flex items-center justify-center bg-green-50">
                  <FaCheckCircle className="w-16 h-16 text-green-600" />
                </div>
                
                <p className="text-lg font-medium text-green-900 mb-2">
                  Успешно отмечены!
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Ваша отметка зафиксирована в системе
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-green-700">Время отметки:</span>
                      <div className="font-medium text-green-900">
                        {new Date().toLocaleTimeString('ru-RU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-700">Статус:</span>
                      <div className="font-medium text-green-900">Подтверждено</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        {scanStep === 'ready' && (
          <div className="px-6 pb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Инструкция по отметке:
              </h4>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Убедитесь, что находитесь в указанной аудитории</li>
                <li>Нажмите кнопку "Включить камеру"</li>
                <li>Направьте камеру на QR-код аудитории</li>
                <li>Дождитесь подтверждения сканирования</li>
              </ol>
              <p className="text-xs text-blue-700 mt-3">
                <strong>Важно:</strong> Отметка возможна только за 10 минут до начала урока и в течение 5 минут после.
              </p>
            </div>
          </div>
        )}

        {/* Mock QR Code Display (for demo) */}
        {scanStep === 'ready' && (
          <div className="px-6 pb-6">
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 text-center mb-3">
                Для демонстрации - QR-код аудитории {record.room}:
              </p>
              <div className="w-24 h-24 mx-auto bg-gray-900 rounded flex items-center justify-center">
                <div className="text-white text-xs font-mono text-center leading-tight">
                  QR<br/>{record.room}<br/>
                  {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScannerModal;
