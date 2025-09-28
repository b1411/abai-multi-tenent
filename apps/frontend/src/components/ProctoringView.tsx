import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useProctoringRealtimeChat } from '../hooks/useProctoringRealtimeChat';
import { proctoringService, ProctoringSession } from '../services/proctoringService';
import { Mic, MicOff, Trash2, Video, VideoOff, X, Volume2, VolumeX } from 'lucide-react';

interface ProctoringViewProps {
  onClose: () => void;
  lessonTopic: string;
  homeworkId: number;
  lessonId?: number;
}

const ProctoringView: React.FC<ProctoringViewProps> = ({ onClose, lessonTopic, homeworkId, lessonId }) => {
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isProctoring, setIsProctoring] = useState(false);
  const [proctoringSession, setProctoringSession] = useState<ProctoringSession | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>();

  const {
    messages,
    connectionState,
    isRecording,
    isPushToTalkActive,
    connect,
    disconnect,
    togglePushToTalk,
    clearMessages,
    isMuted,
    toggleMute,
    isMicrophoneMuted,
    toggleMicrophoneMute,
    sendSystemMessage,
    startAudioPlayback,
  } = useProctoringRealtimeChat(proctoringSession?.id || null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setIsModelsLoaded(true);
    };
    loadModels();
  }, []);

  const startProctoring = async () => {
    if (!isModelsLoaded) return;

    try {
      // Создаем сессию прокторинга
      const session = await proctoringService.createSession({
        homeworkId,
        lessonId,
        topic: lessonTopic
      });
      setProctoringSession(session);

      // Подключаемся к realtime чату
      await connect(session.id);
      setIsProctoring(true);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error starting proctoring:", err);
      setIsProctoring(false);
    }
  };

  const stopProctoring = async () => {
    try {
      // Завершаем сессию прокторинга, если она была создана
      if (proctoringSession) {
        await proctoringService.endSession(proctoringSession.id, {
          score: 0, // Пока заглушка, можно будет добавить оценку позже
          comment: 'Сессия завершена пользователем'
        });
      }
    } catch (err) {
      console.error("Error ending proctoring session:", err);
    }

    // Отключаемся от realtime чата
    disconnect();
    setIsProctoring(false);
    setProctoringSession(null);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isProctoring && videoRef.current && canvasRef.current) {
      const setupCanvas = () => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;

          // Получаем размеры контейнера
          const containerRect = video.getBoundingClientRect();

          // Получаем реальные размеры видео
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          if (videoWidth === 0 || videoHeight === 0) return;

          // Вычисляем соотношение сторон
          const videoAspect = videoWidth / videoHeight;
          const containerAspect = containerRect.width / containerRect.height;

          let visibleWidth, visibleHeight, offsetX = 0, offsetY = 0;

          // object-cover работает как background-size: cover
          if (containerAspect > videoAspect) {
            // Контейнер шире - видео растягивается по ширине, обрезается по высоте
            visibleWidth = containerRect.width;
            visibleHeight = containerRect.width / videoAspect;
            offsetY = (containerRect.height - visibleHeight) / 2;
          } else {
            // Контейнер выше - видео растягивается по высоте, обрезается по ширине  
            visibleHeight = containerRect.height;
            visibleWidth = containerRect.height * videoAspect;
            offsetX = (containerRect.width - visibleWidth) / 2;
          }

          canvas.width = containerRect.width;
          canvas.height = containerRect.height;
          canvas.style.width = `${containerRect.width}px`;
          canvas.style.height = `${containerRect.height}px`;
          canvas.style.left = '0px';
          canvas.style.top = '0px';

          // Сохраняем параметры масштабирования для use в детекции
          canvas.dataset.scaleX = String(visibleWidth / videoWidth);
          canvas.dataset.scaleY = String(visibleHeight / videoHeight);
          canvas.dataset.offsetX = String(offsetX);
          canvas.dataset.offsetY = String(offsetY);
        }
      };

      // Ждем загрузки метаданных видео
      const handleLoadedMetadata = () => {
        setupCanvas();
      };

      if (videoRef.current) {
        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        if (videoRef.current.readyState >= 1) {
          setupCanvas();
        }
      }

      window.addEventListener('resize', setupCanvas);

      intervalId = setInterval(async () => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
          const canvas = canvasRef.current;
          const video = videoRef.current;

          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detections.length > 0) {
              const scaleX = parseFloat(canvas.dataset.scaleX || '1');
              const scaleY = parseFloat(canvas.dataset.scaleY || '1');
              const offsetX = parseFloat(canvas.dataset.offsetX || '0');
              const offsetY = parseFloat(canvas.dataset.offsetY || '0');

              // Применяем трансформации для корректного позиционирования
              ctx.save();
              ctx.translate(offsetX, offsetY);
              ctx.scale(scaleX, scaleY);

              // Рисуем детекции с учетом размеров видео
              const videoDisplaySize = { width: video.videoWidth, height: video.videoHeight };
              faceapi.draw.drawDetections(canvas, detections);
              faceapi.draw.drawFaceLandmarks(canvas, detections);
              faceapi.draw.drawFaceExpressions(canvas, detections);

              ctx.restore();
            }
          }
        }
      }, 150);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('resize', setupCanvas);
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [isProctoring]);

  useEffect(() => {
    if (connectionState.status === "connected") {
      sendSystemMessage(`Ты AI-экзаменатор по предмету: ${lessonTopic}. Студент пришел сдавать домашнее задание по теме "${lessonTopic}". 

Твоя задача:
1. Проверить знания студента по теме "${lessonTopic}"
2. Задать 3-5 вопросов разной сложности
3. Оценить ответы по шкале от 1 до 10
4. Дать краткий комментарий к ответам

Правила:
- Веди диалог на русском языке
- Будь строгим, но справедливым преподавателем
- Если студент не знает ответ, дай подсказку и перефразируй вопрос
- В конце дай итоговую оценку и рекомендации

Начни с приветствия и первого вопроса.`);
      console.log('Системное сообщение отправлено для темы:', lessonTopic);
    }
  }, [connectionState.status, lessonTopic, sendSystemMessage]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Сдача работы</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Feed */}
          <div className="w-2/3 relative flex items-center justify-center bg-gray-900">
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="absolute top-0 left-0" />
            {!isProctoring && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <VideoOff className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-white">Прокторинг неактивен</p>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="w-1/3 flex flex-col border-l">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            {/* Controls */}
            <div className="p-4 border-t">
              <button
                onMouseDown={togglePushToTalk}
                onMouseUp={togglePushToTalk}
                onTouchStart={togglePushToTalk}
                onTouchEnd={togglePushToTalk}
                disabled={!isProctoring || connectionState.status !== 'connected'}
                className={`w-full py-3 rounded-lg flex items-center justify-center transition-colors ${isPushToTalkActive ? 'bg-red-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                  } disabled:bg-gray-400`}
              >
                <Mic className="h-6 w-6 mr-2" />
                {isPushToTalkActive ? 'Говорите...' : 'Нажмите и говорите'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t flex justify-between items-center">
          <div>
            <span className={`text-sm font-medium ${connectionState.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionState.status === 'connected' ? 'Подключено' : 'Отключено'}
            </span>
          </div>
          <div className="flex space-x-2">
            {isProctoring ? (
              <button onClick={stopProctoring} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center">
                <VideoOff className="h-5 w-5 mr-2" />
                Завершить
              </button>
            ) : (
              <button onClick={startProctoring} disabled={!isModelsLoaded} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center disabled:bg-gray-400">
                <Video className="h-5 w-5 mr-2" />
                {isModelsLoaded ? 'Начать прокторинг' : 'Загрузка моделей...'}
              </button>
            )}
            <button onClick={toggleMute} className="bg-gray-500 text-white p-2 rounded-lg" title={isMuted ? "Включить звук" : "Выключить звук"}>
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button onClick={startAudioPlayback} className="bg-blue-500 text-white p-2 rounded-lg" title="Запустить звук AI">
              <Volume2 className="h-5 w-5" />
            </button>
            <button onClick={toggleMicrophoneMute} className="bg-gray-500 text-white p-2 rounded-lg" title={isMicrophoneMuted ? "Включить микрофон" : "Выключить микрофон"}>
              {isMicrophoneMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button onClick={clearMessages} className="bg-gray-500 text-white p-2 rounded-lg" title="Очистить чат">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringView;
