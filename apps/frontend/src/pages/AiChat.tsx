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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Ассистент</h1>
            <p className="text-sm text-gray-500 mt-1">
              Голосовой помощник для образовательной платформы
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Статус подключения */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionState.status === 'connected' ? 'bg-green-500' : 
                connectionState.status === 'connecting' ? 'bg-yellow-500' : 
                connectionState.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </span>
            </div>

            {/* Кнопки управления */}
            <div className="flex space-x-2">
              {connectionState.status === 'connected' ? (
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <PhoneOff size={16} />
                  <span>Отключиться</span>
                </button>
              ) : (
                <button
                  onClick={connect}
                  disabled={connectionState.status === 'connecting'}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  <Phone size={16} />
                  <span>
                    {connectionState.status === 'connecting' ? 'Подключение...' : 'Подключиться'}
                  </span>
                </button>
              )}

              <button
                onClick={clearMessages}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                title="Очистить чат"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Добро пожаловать в AI чат!</h3>
            <p className="text-gray-400">
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
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'assistant'
                    ? 'bg-white text-gray-900 shadow-sm border'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.isAudio && (
                    <Volume2 size={16} className="mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
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
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <Mic size={16} className="animate-pulse" />
                <span className="text-sm">Идет запись...</span>
              </div>
            </div>
          </div>
        )}

        {isPlaying && (
          <div className="flex justify-start">
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg border border-green-200">
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
      <div className="bg-white border-t px-6 py-4">
        <div className="flex items-end space-x-4">
          {/* Push-to-talk кнопка */}
          <button
            onMouseDown={handlePushToTalkStart}
            onMouseUp={handlePushToTalkEnd}
            onMouseLeave={handlePushToTalkEnd}
            onTouchStart={handlePushToTalkStart}
            onTouchEnd={handlePushToTalkEnd}
            disabled={connectionState.status !== 'connected'}
            className={`p-3 rounded-full transition-all duration-200 ${
              isPushToTalkActive
                ? 'bg-red-500 text-white scale-110 shadow-lg'
                : connectionState.status === 'connected'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title="Удерживайте для записи голоса"
          >
            {isPushToTalkActive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Текстовый ввод */}
          <div className="flex-1 flex space-x-2">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                connectionState.status === 'connected'
                  ? 'Введите сообщение или удерживайте кнопку микрофона для записи...'
                  : 'Подключитесь к AI-ассистенту для отправки сообщений'
              }
              disabled={connectionState.status !== 'connected'}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!textInput.trim() || connectionState.status !== 'connected'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Подсказки */}
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <p>💡 Удерживайте кнопку микрофона для записи голосового сообщения</p>
          <p>⌨️ Нажмите Enter для отправки текстового сообщения</p>
          {connectionState.status === 'connected' && (
            <p>🔊 Ответы AI будут воспроизводиться автоматически</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiChat;
