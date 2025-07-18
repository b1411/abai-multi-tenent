/**
 * @page ChatPage
 * @description Страница чата для общения между пользователями системы
 * @author Бурабай Диас
 * @last_updated 2024-03-23
 * 
 * @backend_requirements
 * 
 * 1. API Endpoints:
 * 
 * GET /api/v1/chat/conversations
 * - Получение списка чатов пользователя
 * - Параметры запроса:
 *   - type?: 'private' | 'group'
 *   - limit?: number
 *   - offset?: number
 * 
 * GET /api/v1/chat/messages/{conversationId}
 * - Получение сообщений чата
 * - Параметры запроса:
 *   - before?: string (timestamp)
 *   - limit?: number
 * 
 * POST /api/v1/chat/messages
 * - Отправка нового сообщения
 * - Body:
 *   - conversationId: string
 *   - content: string
 *   - type: 'text' | 'file' | 'image'
 *   - attachments?: Array<{
 *       type: string;
 *       url: string;
 *       name: string;
 *       size: number;
 *     }>
 * 
 * POST /api/v1/chat/conversations
 * - Создание нового чата
 * - Body:
 *   - type: 'private' | 'group'
 *   - name?: string (для групповых чатов)
 *   - participants: string[]
 * 
 * PUT /api/v1/chat/messages/{messageId}
 * - Редактирование сообщения
 * - Body:
 *   - content: string
 * 
 * DELETE /api/v1/chat/messages/{messageId}
 * - Удаление сообщения
 * 
 * 2. Модели данных:
 * 
 * interface Conversation {
 *   id: string;
 *   type: 'private' | 'group';
 *   name?: string;
 *   participants: Array<{
 *     id: string;
 *     name: string;
 *     avatar?: string;
 *     status: 'online' | 'offline' | 'away';
 *     lastSeen?: string;
 *   }>;
 *   lastMessage?: Message;
 *   unreadCount: number;
 *   createdAt: string;
 *   updatedAt: string;
 * }
 * 
 * interface Message {
 *   id: string;
 *   conversationId: string;
 *   senderId: string;
 *   content: string;
 *   type: 'text' | 'file' | 'image';
 *   attachments?: Array<{
 *     type: string;
 *     url: string;
 *     name: string;
 *     size: number;
 *   }>;
 *   status: 'sent' | 'delivered' | 'read';
 *   createdAt: string;
 *   updatedAt: string;
 *   editedAt?: string;
 * }
 * 
 * 3. WebSocket события:
 * - chat:message:new - новое сообщение
 * - chat:message:update - обновление сообщения
 * - chat:message:delete - удаление сообщения
 * - chat:typing - индикатор печати
 * - chat:status - изменение статуса пользователя
 * - chat:read - прочтение сообщений
 * 
 * 4. Требования к безопасности:
 * - Шифрование сообщений
 * - Проверка прав доступа к чатам
 * - Защита от спама
 * - Фильтрация контента
 * - Ограничение размера файлов
 * - Rate limiting для сообщений
 * 
 * 5. Кэширование:
 * - Кэширование списка чатов на 1 минуту
 * - Кэширование сообщений на 5 минут
 * - Кэширование информации о пользователях на 10 минут
 * 
 * 6. Дополнительные требования:
 * - Поддержка форматирования текста (markdown)
 * - Поддержка эмодзи
 * - Поиск по сообщениям
 * - Экспорт истории чата
 * - Автоматическое удаление старых сообщений
 * - Модерация контента
 * - Push-уведомления
 * - Поддержка офлайн-режима
 */

import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaEllipsisH, FaPaperclip, FaSmile, FaMicrophone, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
  attachments?: { type: string; url: string; name: string }[];
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  avatar: string;
}

const ChatPage: React.FC = () => {
  const location = useLocation();
  const recipientId = location.state?.recipientId;
  
  const [selectedChat, setSelectedChat] = useState<string | null>(recipientId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'Буробай Диас',
      content: 'Привет @Рахмат! Как прошла презентация?',
      timestamp: '8:16 PM',
      isMe: false
    },
    {
      id: '2',
      sender: 'Рахмат Кенжибаев',
      content: 'Привет! Все прошло отлично, спасибо за помощь!',
      timestamp: '8:18 PM',
      isMe: true,
      status: 'read'
    }
  ]);

  // Пример данных чатов
  const chats: Chat[] = [
    {
      id: '1',
      name: 'Буробай Диас',
      lastMessage: 'Как прошла презентация?',
      timestamp: '8:16 PM',
      unread: 0,
      online: true,
      avatar: 'https://placekitten.com/40/40'
    },
    {
      id: '2',
      name: 'Сайлекова Балга',
      lastMessage: 'Пытается...',
      timestamp: 'Вчера',
      unread: 0,
      online: false,
      avatar: 'https://placekitten.com/41/41'
    },
    {
      id: '3',
      name: 'Цой Дмитрий',
      lastMessage: 'Спасибо',
      timestamp: '10:20 PM',
      unread: 0,
      online: true,
      avatar: 'https://placekitten.com/42/42'
    }
  ];

  useEffect(() => {
    if (recipientId) {
      setSelectedChat(recipientId);
    }
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (message.trim() || selectedFiles.length > 0) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'Рахмат Кенжибаев',
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        status: 'sent',
        attachments: selectedFiles.map(file => ({
          type: file.type,
          url: URL.createObjectURL(file),
          name: file.name
        }))
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      setSelectedFiles([]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      // Здесь будет логика начала записи
      setIsRecording(true);
    } else {
      // Здесь будет логика окончания записи
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#FFFFFF]">
      {/* Левая панель со списком чатов */}
      <div className="w-full md:w-[300px] border-r border-[#E5E5E5] bg-[#FAFAFA] md:block" style={{ display: selectedChat ? 'none' : 'block' }}>
        <div className="p-5">
          <h1 className="text-xl font-medium text-[#37352F] mb-4">Все Чаты</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск..."
              className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded-md pl-9 text-sm focus:outline-none focus:ring-1 focus:ring-[#E5E5E5] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-[11px] text-[#9B9B9B] w-4 h-4" />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`px-5 py-3 cursor-pointer transition-all hover:bg-[#EBEAEA] ${
                selectedChat === chat.id ? 'bg-[#EBEAEA]' : ''
              }`}
              onClick={() => setSelectedChat(chat.id)}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E5E5]"
                  />
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2ECC71] rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#37352F] truncate text-sm">
                      {chat.name}
                    </h3>
                    <span className="text-xs text-[#9B9B9B]">{chat.timestamp}</span>
                  </div>
                  <p className="text-sm text-[#9B9B9B] truncate mt-0.5">{chat.lastMessage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Правая панель с чатом */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-[#FFFFFF]">
          {/* Шапка чата */}
          <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA]">
            <div className="flex items-center gap-3">
              <img
                src={chats.find(c => c.id === selectedChat)?.avatar}
                alt="Chat avatar"
                className="w-10 h-10 rounded-full object-cover border border-[#E5E5E5]"
              />
              <div>
                <h2 className="font-medium text-[#37352F] text-sm">
                  {chats.find(c => c.id === selectedChat)?.name}
                </h2>
                <p className="text-xs text-[#9B9B9B]">В сети</p>
              </div>
            </div>
            <button className="text-[#9B9B9B] hover:text-[#37352F] transition-colors">
              <FaEllipsisH className="w-4 h-4" />
            </button>
          </div>

          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.isMe
                      ? 'bg-[#2E69FF] text-white'
                      : 'bg-[#F7F7F7] text-[#37352F]'
                  }`}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <FaPaperclip className={message.isMe ? 'text-white opacity-80' : 'text-[#9B9B9B]'} />
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm ${
                              message.isMe ? 'text-white hover:underline' : 'text-[#2E69FF] hover:underline'
                            }`}
                          >
                            {attachment.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <div className={`text-xs mt-1.5 flex items-center gap-1 ${
                    message.isMe ? 'text-white opacity-80' : 'text-[#9B9B9B]'
                  }`}>
                    {message.timestamp}
                    {message.isMe && message.status && (
                      <span className="ml-1">✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Область прикрепленных файлов */}
          {selectedFiles.length > 0 && (
            <div className="px-5 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA]">
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-[#E5E5E5]"
                  >
                    <span className="text-sm text-[#37352F] truncate max-w-xs">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-[#9B9B9B] hover:text-[#37352F] transition-colors"
                    >
                      <FaTimes className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Поле ввода сообщения */}
          <div className="p-5 border-t border-[#E5E5E5] bg-[#FAFAFA]">
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileSelect}
              />
              <button
                className="text-[#9B9B9B] hover:text-[#37352F] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaPaperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder={isRecording ? `Запись: ${formatRecordingTime(recordingTime)}` : "Введите сообщение..."}
                className="flex-1 px-4 py-2 bg-white border border-[#E5E5E5] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#E5E5E5] transition-all placeholder-[#9B9B9B]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isRecording}
              />
              <button
                className={`text-[#9B9B9B] hover:text-[#37352F] transition-colors ${
                  isRecording ? 'text-red-500' : ''
                }`}
                onClick={handleVoiceRecord}
              >
                <FaMicrophone className="w-4 h-4" />
              </button>
              <button
                className="text-[#2E69FF] hover:text-[#1E4BB8] transition-colors disabled:opacity-50"
                onClick={handleSendMessage}
                disabled={isRecording}
              >
                <FaPaperPlane className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
          <p className="text-[#9B9B9B] text-sm">Выберите чат для начала общения</p>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
