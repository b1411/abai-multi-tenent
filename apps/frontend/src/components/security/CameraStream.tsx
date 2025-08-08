import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, AIDetection } from '../../types/security';
import { Video, VideoOff, Maximize, RotateCcw, AlertTriangle, Users, Eye } from 'lucide-react';

interface CameraStreamProps {
  camera: Camera;
  onDetection: (detection: AIDetection) => void;
  onFullscreen: () => void;
  aiAnalysisEnabled?: boolean;
}

const CameraStream: React.FC<CameraStreamProps> = ({ 
  camera, 
  onDetection, 
  onFullscreen, 
  aiAnalysisEnabled = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [detections, setDetections] = useState<AIDetection[]>([]);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Запуск видеопотока
  const startStream = async () => {
    try {
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setStream(mediaStream);
        setIsStreaming(true);
        
        // Запуск ИИ-анализа
        if (aiAnalysisEnabled && !analysisIntervalRef.current) {
          analysisIntervalRef.current = setInterval(() => {
            if (!videoRef.current || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            const video = videoRef.current;

            if (!context || video.videoWidth === 0) return;

            // Генерируем моковые детекции (в реальности здесь был бы ИИ-анализ)
            const mockDetections: AIDetection[] = [];
            
            // Случайно генерируем детекции
            if (Math.random() > 0.8) {
              const detectionTypes: AIDetection['type'][] = ['person', 'weapon', 'fire', 'suspicious_object'];
              const randomType = detectionTypes[Math.floor(Math.random() * detectionTypes.length)];
              
              mockDetections.push({
                type: randomType,
                confidence: 0.7 + Math.random() * 0.3,
                bbox: {
                  x: Math.random() * 200 + 50,
                  y: Math.random() * 200 + 50,
                  width: 80 + Math.random() * 80,
                  height: 80 + Math.random() * 80
                },
                timestamp: new Date().toISOString()
              });

              setDetections(mockDetections);
              
              // Передаем детекции родительскому компоненту
              mockDetections.forEach(detection => {
                onDetection(detection);
              });
            } else {
              setDetections([]);
            }
          }, 5000); // Анализ каждые 5 секунд
        }
      }
    } catch (err) {
      console.error('Ошибка доступа к камере:', err);
      setError('Не удалось получить доступ к камере. Проверьте разрешения.');
      setIsStreaming(false);
    }
  };

  // Остановка видеопотока
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  };

  // Переключение камеры
  const switchCamera = () => {
    stopStream();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Рисование детекций на канвасе
  const drawDetections = () => {
    if (!canvasRef.current || !videoRef.current || detections.length === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    if (!context || video.videoWidth === 0) return;

    // Устанавливаем размеры canvas под видео
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Очищаем предыдущие детекции
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем детекции
    detections.forEach(detection => {
      const { bbox, type, confidence } = detection;
      
      // Цвет рамки в зависимости от типа
      let color = '#22c55e';
      switch (type) {
        case 'weapon':
          color = '#ef4444';
          break;
        case 'fire':
          color = '#f97316';
          break;
        case 'suspicious_object':
          color = '#eab308';
          break;
        case 'person':
          color = '#3b82f6';
          break;
      }

      // Рисуем рамку
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

      // Рисуем подпись
      context.fillStyle = color;
      context.fillRect(bbox.x, bbox.y - 25, Math.min(bbox.width, 150), 25);
      
      context.fillStyle = 'white';
      context.font = '12px Arial';
      context.fillText(
        `${type} (${Math.round(confidence * 100)}%)`,
        bbox.x + 5,
        bbox.y - 8
      );
    });
  };

  // Эффекты
  useEffect(() => {
    startStream();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [facingMode]); // Только при изменении камеры

  useEffect(() => {
    drawDetections();
  }, [detections]); // Только при изменении детекций

  const getStatusColor = () => {
    switch (camera.status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDetectionIcon = (type: AIDetection['type']) => {
    switch (type) {
      case 'person':
        return <Users className="h-4 w-4" />;
      case 'weapon':
        return <AlertTriangle className="h-4 w-4" />;
      case 'fire':
        return <AlertTriangle className="h-4 w-4" />;
      case 'suspicious_object':
        return <Eye className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Заголовок камеры */}
      <div className="p-2 sm:p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${getStatusColor()}`}></div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{camera.name}</h3>
            <span className="hidden sm:inline text-xs text-gray-500 truncate">{camera.location}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={switchCamera}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Переключить камеру"
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={onFullscreen}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Полный экран"
            >
              <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Видеопоток */}
      <div className="relative bg-black aspect-video">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <VideoOff className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">{error}</p>
              <button
                onClick={startStream}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Повторить
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Canvas для детекций */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ mixBlendMode: 'normal' }}
            />
            {/* Индикатор записи */}
            {isStreaming && (
              <div className="absolute top-2 left-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  ПРЯМОЙ ЭФИР
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ИИ-детекции */}
      {detections.length > 0 && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-900 mb-2">ИИ-детекции:</h4>
          <div className="flex flex-wrap gap-2">
            {detections.map((detection, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {getDetectionIcon(detection.type)}
                <span>
                  {detection.type} ({Math.round(detection.confidence * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Статус камеры */}
      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>ИИ-анализ: {aiAnalysisEnabled ? 'Включен' : 'Отключен'}</span>
          <span>
            {isStreaming ? (
              <Video className="h-3 w-3 inline mr-1" />
            ) : (
              <VideoOff className="h-3 w-3 inline mr-1" />
            )}
            {isStreaming ? 'Активен' : 'Неактивен'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CameraStream;
