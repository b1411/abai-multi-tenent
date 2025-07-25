import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import AlertsFeed from '../components/security/AlertsFeed';
import CameraStream from '../components/security/CameraStream';
import EmergencyButtons from '../components/security/EmergencyButtons';
import FaceIDLog from '../components/security/FaceIDLog';
import SecurityShift from '../components/security/SecurityShift';
import SecurityMetricsComponent from '../components/security/SecurityMetrics';
import {
  mockAlerts,
  mockCameras,
  mockFaceIDEntries,
  mockGuards,
  mockEmergencyCalls,
  mockMetrics,
  generateRandomAlert,
  generateRandomFaceIDEntry,
  updateMetrics
} from '../data/mockSecurityData';
import {
  SecurityAlert,
  Camera,
  FaceIDEntry,
  SecurityGuard,
  EmergencyCall,
  SecurityMetrics,
  AIDetection
} from '../types/security';

const Security: React.FC = () => {
  // Состояние компонентов
  const [alerts, setAlerts] = useState<SecurityAlert[]>(mockAlerts);
  const [cameras, setCameras] = useState<Camera[]>(mockCameras);
  const [faceIDEntries, setFaceIDEntries] = useState<FaceIDEntry[]>(mockFaceIDEntries);
  const [guards, setGuards] = useState<SecurityGuard[]>(mockGuards);
  const [emergencyCalls, setEmergencyCalls] = useState<EmergencyCall[]>(mockEmergencyCalls);
  const [metrics, setMetrics] = useState<SecurityMetrics>(mockMetrics);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  // Интервалы для обновления данных
  useEffect(() => {
    // Обновление метрик каждые 30 секунд
    const metricsInterval = setInterval(() => {
      setMetrics(current => updateMetrics(current));
    }, 30000);

    // Генерация новых событий Face ID каждые 2 минуты
    const faceIDInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        const newEntry = generateRandomFaceIDEntry();
        setFaceIDEntries(current => [newEntry, ...current].slice(0, 50));
      }
    }, 120000);

    // Генерация новых тревог каждые 5 минут (с вероятностью 30%)
    const alertsInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newAlert = generateRandomAlert();
        setAlerts(current => [newAlert, ...current]);
        
        // Обновляем метрики при новой тревоге
        setMetrics(current => ({
          ...current,
          activeAlerts: current.activeAlerts + (newAlert.resolved ? 0 : 1)
        }));
      }
    }, 300000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(faceIDInterval);
      clearInterval(alertsInterval);
    };
  }, []);

  // Обработчики событий
  const handleAlertClick = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    // Здесь можно открыть модальное окно с деталями
    console.log('Просмотр деталей тревоги:', alert);
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(current =>
      current.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
    
    // Обновляем метрики
    setMetrics(current => ({
      ...current,
      activeAlerts: Math.max(0, current.activeAlerts - 1)
    }));
  };

  const handleCameraDetection = (detection: AIDetection) => {
    console.log('ИИ детекция:', detection);
    
    // При обнаружении критических объектов создаем тревогу
    if (detection.type === 'weapon' || detection.type === 'fire') {
      const newAlert: SecurityAlert = {
        id: Math.random().toString(36).substr(2, 9),
        type: detection.type === 'weapon' ? 'weapon' : 'fire',
        timestamp: new Date().toISOString(),
        camera: 'Камера устройства',
        location: 'Текущее местоположение',
        description: `ИИ обнаружил ${detection.type === 'weapon' ? 'оружие' : 'огонь'} с вероятностью ${Math.round(detection.confidence * 100)}%`,
        severity: 'critical',
        screenshot: '/screenshots/ai-detection.jpg',
        resolved: false
      };
      
      setAlerts(current => [newAlert, ...current]);
      setMetrics(current => ({
        ...current,
        activeAlerts: current.activeAlerts + 1
      }));
    }
  };

  const handleEmergencyCall = (type: EmergencyCall['type']) => {
    const newCall: EmergencyCall = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      timestamp: new Date().toISOString(),
      initiatedBy: 'Текущий пользователь',
      status: 'initiated'
    };
    
    setEmergencyCalls(current => [newCall, ...current]);
    
    // Имитация подтверждения вызова через 2 секунды
    setTimeout(() => {
      setEmergencyCalls(current =>
        current.map(call =>
          call.id === newCall.id ? { ...call, status: 'confirmed' } : call
        )
      );
    }, 2000);
  };

  const handleUpdateGuardStatus = (guardId: string, status: SecurityGuard['status'], comments?: string) => {
    setGuards(current =>
      current.map(guard =>
        guard.id === guardId
          ? {
              ...guard,
              status,
              lastSeen: new Date().toISOString(),
              comments: comments || guard.comments
            }
          : guard
      )
    );
    
    // Обновляем метрики охраны
    const updatedGuards = guards.map(guard =>
      guard.id === guardId ? { ...guard, status } : guard
    );
    
    setMetrics(current => ({
      ...current,
      guardsPresent: updatedGuards.filter(g => g.status === 'present').length
    }));
  };

  const handleExportFaceIDData = () => {
    // Имитация экспорта данных
    console.log('Экспорт данных Face ID...');
    const csvData = faceIDEntries.map(entry => 
      `${entry.timestamp},${entry.userName},${entry.userRole},${entry.type},${entry.turnstileName}`
    ).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `face-id-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      // Имитация загрузки данных с сервера
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // В реальном приложении здесь были бы API вызовы
      setMetrics(updateMetrics(metrics));
      
      console.log('Данные обновлены');
    } catch (error) {
      console.error('Ошибка обновления данных:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Система физической безопасности
            </h1>
            <p className="text-gray-600 mt-2">
              Централизованный дашборд управления безопасностью школы
            </p>
          </div>
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {/* Основная сетка компонентов */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Левая колонка - Тревоги и видеопоток */}
        <div className="lg:col-span-4 space-y-6">
          {/* Лента тревог */}
          <AlertsFeed
            alerts={alerts}
            onAlertClick={handleAlertClick}
            onResolveAlert={handleResolveAlert}
          />
        </div>

        {/* Центральная колонка - Видеопоток и метрики */}
        <div className="lg:col-span-4 space-y-6">
          {/* Видеопоток с ИИ */}
          <CameraStream
            camera={cameras[0]}
            onDetection={handleCameraDetection}
            onFullscreen={() => console.log('Полноэкранный режим')}
            aiAnalysisEnabled={true}
          />
          
          {/* Метрики безопасности */}
          <SecurityMetricsComponent metrics={metrics} />
        </div>

        {/* Правая колонка - Экстренные кнопки */}
        <div className="lg:col-span-4 space-y-6">
          {/* Экстренные кнопки */}
          <EmergencyButtons
            onEmergencyCall={handleEmergencyCall}
            recentCalls={emergencyCalls}
          />
        </div>
      </div>

      {/* Нижний ряд - Журналы и управление */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Журнал Face ID */}
        <FaceIDLog
          entries={faceIDEntries}
          onExportData={handleExportFaceIDData}
        />

        {/* Управление сменой охраны */}
        <SecurityShift
          guards={guards}
          onUpdateGuardStatus={handleUpdateGuardStatus}
        />
      </div>

      {/* Модальное окно деталей тревоги */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Детали тревоги
              </h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Тип события</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAlert.type}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Описание</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAlert.description}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Местоположение</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAlert.location}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Время</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedAlert.timestamp).toLocaleString('ru-RU')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Скриншот</label>
                <div className="mt-1 w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Скриншот недоступен</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Закрыть
              </button>
              {!selectedAlert.resolved && (
                <button
                  onClick={() => {
                    handleResolveAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Решить тревогу
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Мобильная адаптивность */}
      <style>{`
        @media (max-width: 1024px) {
          .grid.lg\\:grid-cols-12 {
            grid-template-columns: 1fr;
          }
          
          .lg\\:col-span-4 {
            grid-column: span 1;
          }
        }
        
        @media (max-width: 768px) {
          .grid.lg\\:grid-cols-2 {
            grid-template-columns: 1fr;
          }
          
          .p-6 {
            padding: 1rem;
          }
          
          .text-3xl {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Security;
