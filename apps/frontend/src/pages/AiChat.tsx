import React, { useState, useRef, useEffect } from 'react';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { Mic, MicOff, Send, Phone, PhoneOff, Trash2, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const AiChat: React.FC = () => {
  const [textInput, setTextInput] = useState('');
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    connectionState,
    isRecording,
    isPlaying,
    connect,
    disconnect,
    sendTextMessage,
    togglePushToTalk,
    clearMessages
  } = useRealtimeChat();

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (textInput.trim() && connectionState.status === 'connected') {
      sendTextMessage(textInput.trim());
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePushToTalkStart = () => {
    if (connectionState.status === 'connected') {
      setIsPushToTalkActive(true);
      togglePushToTalk(true);
    }
  };

  const handlePushToTalkEnd = () => {
    if (connectionState.status === 'connected') {
      setIsPushToTalkActive(false);
      togglePushToTalk(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState.status) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState.status) {
      case 'connected':
        return 'Подключено';
      case 'connecting':
        return 'Подключение...';
      case 'error':
        return `Ошибка: ${connectionState.error}`;
      default:
        return 'Отключено';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Ассистент</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Голосовой помощник для образовательной платформы
            </p>
          </div>
          
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            {/* Статус подключения */}
            <div className="flex items-center justify-center sm:justify-start space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionState.status === 'connected' ? 'bg-green-500' : 
                connectionState.status === 'connecting' ? 'bg-yellow-500' : 
                connectionState.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <span className={`text-sm sm:text-base font-medium ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </span>
            </div>

            {/* Кнопки управления */}
            <div className="flex space-x-3">
              {connectionState.status === 'connected' ? (
                <button
                  onClick={disconnect}
                  className="flex-1 sm:flex-none px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-base shadow-sm"
                >
                  <PhoneOff size={16} />
                  <span className="hidden sm:inline">Отключиться</span>
                  <span className="sm:hidden">Отключить</span>
                </button>
              ) : (
                <button
                  onClick={connect}
                  disabled={connectionState.status === 'connecting'}
                  className="flex-1 sm:flex-none px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 text-base shadow-sm"
                >
                  <Phone size={16} />
                  <span className="hidden sm:inline">
                    {connectionState.status === 'connecting' ? 'Подключение...' : 'Подключиться'}
                  </span>
                  <span className="sm:hidden">
                    {connectionState.status === 'connecting' ? 'Подключение...' : 'Подключить'}
                  </span>
                </button>
              )}

              <button
                onClick={clearMessages}
                className="px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2 text-base shadow-sm"
                title="Очистить чат"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Очистить</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-16 sm:mt-24">
            <div className="text-6xl sm:text-8xl mb-6">🤖</div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3">Добро пожаловать в AI чат!</h3>
            <p className="text-base sm:text-lg text-gray-400 px-4 max-w-md mx-auto">
              Подключитесь к AI-ассистенту, чтобы начать общение голосом или текстом
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-sm lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : message.type === 'assistant'
                    ? 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    : 'bg-gray-100 text-gray-600 rounded-bl-md'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {message.isAudio && (
                    <Volume2 size={16} className="mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base break-words leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {format(message.timestamp, 'HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Индикаторы активности */}
        {isRecording && (
          <div className="flex justify-start">
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-2xl border border-red-200 shadow-sm">
              <div className="flex items-center space-x-2">
                <Mic size={16} className="animate-pulse" />
                <span className="text-sm">Идет запись...</span>
              </div>
            </div>
          </div>
        )}

        {isPlaying && (
          <div className="flex justify-start">
            <div className="bg-green-100 text-green-700 px-4 py-3 rounded-2xl border border-green-200 shadow-sm">
              <div className="flex items-center space-x-2">
                <Volume2 size={16} className="animate-pulse" />
                <span className="text-sm">Воспроизведение...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Область ввода */}
      <div className="bg-white border-t px-4 sm:px-6 lg:px-8 py-4 sm:py-6 safe-area-inset-bottom">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:space-y-0 sm:space-x-4">
          {/* Push-to-talk кнопка */}
          <button
            onMouseDown={handlePushToTalkStart}
            onMouseUp={handlePushToTalkEnd}
            onMouseLeave={handlePushToTalkEnd}
            onTouchStart={handlePushToTalkStart}
            onTouchEnd={handlePushToTalkEnd}
            disabled={connectionState.status !== 'connected'}
            className={`w-14 h-14 sm:w-12 sm:h-12 rounded-full transition-all duration-200 flex items-center justify-center self-center shadow-lg ${
              isPushToTalkActive
                ? 'bg-red-500 text-white scale-110 shadow-xl'
                : connectionState.status === 'connected'
                ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title="Удерживайте для записи голоса"
          >
            {isPushToTalkActive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Текстовый ввод */}
          <div className="flex-1 flex space-x-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                connectionState.status === 'connected'
                  ? 'Введите сообщение или удерживайте микрофон...'
                  : 'Подключитесь к AI-ассистенту'
              }
              disabled={connectionState.status !== 'connected'}
              className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all bg-gray-50 focus:bg-white"
              rows={1}
              style={{ minHeight: '48px' }}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!textInput.trim() || connectionState.status !== 'connected'}
              className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm min-w-[48px]"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Подсказки */}
        <div className="mt-4 text-sm text-gray-500 space-y-2">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <p className="flex items-center">💡 Удерживайте микрофон для записи</p>
            <p className="flex items-center">⌨️ Enter для отправки</p>
            {connectionState.status === 'connected' && (
              <p className="flex items-center">🔊 Автовоспроизведение ответов</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
