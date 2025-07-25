import React, { useState } from 'react';
import { FaQrcode, FaUserCheck, FaExclamationCircle, FaEye } from 'react-icons/fa';
import { AttendanceRecord } from '../../types/fakePositions';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from './StatusBadge';

interface AttendanceTableProps {
  data: AttendanceRecord[];
  onDisputeClick: (record: AttendanceRecord) => void;
  loading?: boolean;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  data,
  onDisputeClick,
  loading = false
}) => {
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getQRIcon = (qrScanned: boolean) => {
    return qrScanned ? (
      <FaQrcode className="w-4 h-4 text-green-600" title="QR отсканирован" />
    ) : (
      <FaQrcode className="w-4 h-4 text-red-600" title="QR не отсканирован" />
    );
  };

  const getFaceIdIcon = (faceIdConfirmed: boolean) => {
    return faceIdConfirmed ? (
      <FaUserCheck className="w-4 h-4 text-green-600" title="Face ID подтверждён" />
    ) : (
      <FaUserCheck className="w-4 h-4 text-red-600" title="Face ID не подтверждён" />
    );
  };

  const canDispute = (record: AttendanceRecord) => {
    if (user?.role === 'TEACHER') {
      // Учитель может оспаривать только свои записи
      return record.teacherId === 1 && record.canDispute; // Для демо предполагаем ID = 1
    }
    return record.canDispute;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <FaExclamationCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных</h3>
        <p className="text-gray-500">По выбранным фильтрам записи не найдены</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Преподаватель
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Урок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Предмет
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Аудитория
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Face ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Комментарий
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.teacherName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.lesson} урок</div>
                    <div className="text-xs text-gray-500">{record.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.room}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getQRIcon(record.qrScanned)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getFaceIdIcon(record.faceIdConfirmed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.status} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {record.comment || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      {record.disputeSubmitted ? (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          На рассмотрении
                        </span>
                      ) : canDispute(record) ? (
                        <button
                          onClick={() => onDisputeClick(record)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
                        >
                          Оспорить
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {data.map((record) => (
          <div key={record.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm truncate">{record.teacherName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(record.date)} • {record.lesson} урок
                </p>
              </div>
              <StatusBadge status={record.status} size="sm" />
            </div>

            {/* Time and Subject */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                <span className="font-medium">{record.time}</span>
                <span>•</span>
                <span>{record.subject}</span>
                <span>•</span>
                <span>{record.room}</span>
              </div>
            </div>

            {/* QR and Face ID indicators */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {getQRIcon(record.qrScanned)}
                  <span className="text-xs text-gray-600">QR</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getFaceIdIcon(record.faceIdConfirmed)}
                  <span className="text-xs text-gray-600">Face ID</span>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedRecord(record)}
                className="text-blue-600 text-xs flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded"
              >
                <FaEye className="w-3 h-3" />
                <span>Подробнее</span>
              </button>
            </div>

            {/* Comment - collapsed */}
            {record.comment && (
              <div className="mb-3">
                <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded line-clamp-2">
                  {record.comment}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex-1">
                {record.disputeSubmitted ? (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    На рассмотрении
                  </span>
                ) : canDispute(record) ? (
                  <button
                    onClick={() => onDisputeClick(record)}
                    className="text-blue-600 hover:text-blue-900 text-xs font-medium transition-colors bg-blue-50 px-2 py-1 rounded"
                  >
                    Оспорить
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900">
                  Детали записи
                </h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Преподаватель</p>
                <p className="font-medium">{selectedRecord.teacherName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Дата</p>
                  <p className="font-medium">{formatDate(selectedRecord.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Урок</p>
                  <p className="font-medium">{selectedRecord.lesson} урок</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Время</p>
                <p className="font-medium">{selectedRecord.time}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Предмет</p>
                  <p className="font-medium">{selectedRecord.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Аудитория</p>
                  <p className="font-medium">{selectedRecord.room}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Статус верификации</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">QR-код</span>
                    {getQRIcon(selectedRecord.qrScanned)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Face ID</span>
                    {getFaceIdIcon(selectedRecord.faceIdConfirmed)}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Итоговый статус</p>
                <div className="mt-1">
                  <StatusBadge status={selectedRecord.status} />
                </div>
              </div>

              {selectedRecord.comment && (
                <div>
                  <p className="text-sm text-gray-500">Комментарий</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-1">
                    {selectedRecord.comment}
                  </p>
                </div>
              )}

              {canDispute(selectedRecord) && !selectedRecord.disputeSubmitted && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedRecord(null);
                      onDisputeClick(selectedRecord);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Оспорить запись
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceTable;
