import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { Mic, MicOff, Trash2, Video, VideoOff, X, Volume2, VolumeX } from 'lucide-react';

interface ProctoringViewProps {
  onClose: () => void;
  lessonTopic: string;
}

const ProctoringView: React.FC<ProctoringViewProps> = ({ onClose, lessonTopic }) => {
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isProctoring, setIsProctoring] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>();

  const {
    messages,
    connectionState,
    isRecording,
    connect,
    disconnect,
    togglePushToTalk,
    clearMessages,
    isMuted,
    toggleMute,
    isMicrophoneMuted,
    toggleMicrophoneMute,
    sendSystemMessage,
  } = useRealtimeChat();

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
      await connect();
      setIsProctoring(true);

      const stream = await navigator.mediaDevices.getUserMedia({ video: {}, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error starting proctoring:", err);
      setIsProctoring(false);
    }
  };

  const stopProctoring = () => {
    disconnect();
    setIsProctoring(false);
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
      sendSystemMessage(`Текущая тема урока: ${lessonTopic} и поздоровайся с пользователем типа чем могу помочь по теме ${lessonTopic}`);
      console.log('Тема урока отправлена в чат:', lessonTopic);
    }
  }, [connectionState.status, lessonTopic, sendSystemMessage]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">ИИ Прокторинг</h2>
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
                onMouseDown={() => togglePushToTalk(true)}
                onMouseUp={() => togglePushToTalk(false)}
                onTouchStart={() => togglePushToTalk(true)}
                onTouchEnd={() => togglePushToTalk(false)}
                disabled={!isProctoring || connectionState.status !== 'connected'}
                className={`w-full py-3 rounded-lg flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                  } disabled:bg-gray-400`}
              >
                <Mic className="h-6 w-6 mr-2" />
                {isRecording ? 'Запись...' : 'Удерживайте для разговора'}
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
