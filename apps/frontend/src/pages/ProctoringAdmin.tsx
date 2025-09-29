import React, { useState } from 'react';
import ProctoringSessionsAdmin from '../components/ProctoringSessionsAdmin';
import ProctoringView from '../components/ProctoringView';
import { ProctoringSession } from '../services/proctoringService';
import { ArrowLeft, X } from 'lucide-react';

interface Violation {
  type: string;
  description: string;
  screenshot: string;
  timestamp: string;
}

const ProctoringAdminPage: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<ProctoringSession | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const handleViewSession = (session: ProctoringSession) => {
    setSelectedSession(session);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedSession(null);
    setViewMode('list');
  };

  const handleViewScreenshot = (screenshot: string) => {
    setSelectedScreenshot(screenshot);
  };

  const handleCloseScreenshot = () => {
    setSelectedScreenshot(null);
  };

  if (viewMode === 'detail' && selectedSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Детали сессии прокторинга #{selectedSession.id}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Информация о сессии</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Статус</dt>
                    <dd className="text-sm text-gray-900">{selectedSession.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Студент ID</dt>
                    <dd className="text-sm text-gray-900">{selectedSession.studentId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Домашнее задание ID</dt>
                    <dd className="text-sm text-gray-900">{selectedSession.homeworkId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Тема</dt>
                    <dd className="text-sm text-gray-900">{selectedSession.topic}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Начало</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(selectedSession.createdAt).toLocaleString('ru-RU')}
                    </dd>
                  </div>
                  {selectedSession.endedAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Окончание</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedSession.endedAt).toLocaleString('ru-RU')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {selectedSession.results && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Результаты</h3>
                  <dl className="space-y-2">
                    {selectedSession.results.score && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Оценка</dt>
                        <dd className="text-sm text-gray-900">{selectedSession.results.score}</dd>
                      </div>
                    )}
                    {selectedSession.results.feedback && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Отзыв</dt>
                        <dd className="text-sm text-gray-900">{selectedSession.results.feedback}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>

            {/* Транскрипция разговора */}
            {selectedSession.transcript && selectedSession.transcript.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Транскрипция разговора</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {selectedSession.transcript.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.type === 'assistant'
                              ? 'bg-gray-200 text-gray-900'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          <div className="text-xs font-medium mb-1">
                            {message.type === 'user' ? 'Студент' :
                             message.type === 'assistant' ? 'AI Ассистент' : 'Система'}
                            {message.isAudio && ' (аудио)'}
                          </div>
                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Нарушения */}
            {selectedSession.analysisResults && Array.isArray(selectedSession.analysisResults) && selectedSession.analysisResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Обнаруженные нарушения</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSession.analysisResults.map((violation: Violation, index: number) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {violation.screenshot && (
                            <img
                              src={violation.screenshot}
                              alt={`Нарушение ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-red-300 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleViewScreenshot(violation.screenshot)}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-800">
                            {violation.type === 'no_face' && 'Отсутствие лица'}
                            {violation.type === 'multiple_faces' && 'Несколько лиц'}
                            {violation.type === 'face_not_centered' && 'Лицо не в центре'}
                            {violation.type === 'eyes_closed' && 'Глаза закрыты'}
                            {violation.type === 'suspicious_expression' && 'Подозрительное выражение'}
                            {violation.type === 'head_movement' && 'Движение головы'}
                            {violation.type === 'mouth_open' && 'Рот открыт'}
                            {!['no_face', 'multiple_faces', 'face_not_centered', 'eyes_closed', 'suspicious_expression', 'head_movement', 'mouth_open'].includes(violation.type) && violation.type}
                          </p>
                          <p className="text-sm text-red-700 mt-1">{violation.description}</p>
                          <p className="text-xs text-red-600 mt-2">
                            {new Date(violation.timestamp).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Дополнительная информация</h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  {selectedSession.transcript && selectedSession.transcript.length > 0
                    ? `Всего сообщений в разговоре: ${selectedSession.transcript.length}`
                    : 'Транскрипция разговора недоступна'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  {selectedSession.analysisResults && Array.isArray(selectedSession.analysisResults)
                    ? `Обнаруженных нарушений: ${selectedSession.analysisResults.length}`
                    : 'Нарушений не обнаружено'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProctoringSessionsAdmin onViewSession={handleViewSession} />
      </div>

      {/* Модальное окно для просмотра скриншота */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={handleCloseScreenshot}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedScreenshot}
              alt="Скриншот нарушения"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={handleCloseScreenshot}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctoringAdminPage;