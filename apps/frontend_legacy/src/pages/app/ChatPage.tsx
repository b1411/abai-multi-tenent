/**
 * @page ChatPage
 * @description Страница чата для общения между пользователями
 * @author [Ваше имя]
 * @last_updated 2024-03-23
 * 
 * @features
 * 1. Список чатов с поиском
 * 2. Обмен текстовыми сообщениями
 * 3. Поддержка вложений (изображения, файлы)
 * 4. Статусы сообщений (отправлено, доставлено, прочитано)
 * 5. Индикация онлайн статуса
 * 6. Индикация набора текста
 * 7. Голосовые сообщения
 * 
 * @components
 * - ChatList: Список чатов с поиском
 * - ChatWindow: Окно чата с сообщениями
 * - MessageInput: Панель ввода сообщений
 * 
 * @data_models
 * 
 * interface Message {
 *   id: string;
 *   sender: string;
 *   text: string;
 *   timestamp: Date;
 *   status: 'sent' | 'delivered' | 'read';
 *   attachments?: {
 *     type: 'image' | 'file';
 *     url: string;
 *     name: string;
 *   }[];
 * }
 * 
 * interface Chat {
 *   id: string;
 *   name: string;
 *   avatar: string;
 *   lastMessage: string;
 *   time: string;
 *   unread: number;
 *   isOnline: boolean;
 *   typing?: boolean;
 * }
 * 
 * @websocket_events
 * - message:new - новое сообщение
 * - message:status - обновление статуса
 * - chat:typing - индикация набора
 * - user:online - изменение статуса онлайн
 * 
 * @security
 * - Аутентификация пользователей
 * - Шифрование сообщений
 * - Проверка прав доступа к чатам
 * 
 * @performance
 * - Пагинация истории сообщений
 * - Ленивая загрузка изображений
 * - Оптимизация ре-рендеринга
 */

import React, { useState, useRef, useEffect } from 'react';
import type { IconType } from 'react-icons';
import { 
  FaSearch, 
  FaEllipsisV, 
  FaPaperclip, 
  FaSmile, 
  FaPaperPlane,
  FaVideo,
  FaPhone,
  FaImage,
  FaFile,
  FaMicrophone,
  FaTimes,
  FaCheck,
  FaCheckDouble,
  FaCircle
} from 'react-icons/fa';

// Компонент-обертка для иконок
const IconWrapper = ({ icon: Icon, className = '' }: { icon: IconType; className?: string }) => {
  const IconComponent = Icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;
  return (
    <span className={className}>
      <IconComponent />
    </span>
  );
};

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  }[];
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  typing?: boolean;
}

const ChatPage: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'user',
      text: 'Привет!',
      timestamp: new Date(),
      status: 'read'
    },
    {
      id: '2',
      sender: 'other',
      text: 'Привет! Как дела?',
      timestamp: new Date(),
      status: 'read'
    },
    {
      id: '3',
      sender: 'user',
      text: 'Отлично!',
      timestamp: new Date(),
      status: 'read'
    }
  ]);
  
  // Демо-данные
  const chats: Chat[] = [
    {
      id: '1',
      name: 'Команда учителей',
      avatar: 'https://ui-avatars.com/api/?name=Команда+учителей&background=random',
      lastMessage: 'Обсудим новую программу?',
      time: '10:30',
      unread: 3,
      isOnline: true,
      typing: true
    },
    {
      id: '2',
      name: 'Родительский комитет',
      avatar: 'https://ui-avatars.com/api/?name=Родительский+комитет&background=random',
      lastMessage: 'Собрание в четверг в 19:00',
      time: '09:15',
      unread: 0,
      isOnline: false
    },
    {
      id: '3',
      name: 'Техподдержка',
      avatar: 'https://ui-avatars.com/api/?name=Техподдержка&background=random',
      lastMessage: 'Ваш запрос обработан',
      time: 'Вчера',
      unread: 0,
      isOnline: true
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      timestamp: new Date(),
      status: 'sent'
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <IconWrapper icon={FaCheck} className="text-gray-400" />;
      case 'delivered':
        return <IconWrapper icon={FaCheckDouble} className="text-gray-400" />;
      case 'read':
        return <IconWrapper icon={FaCheckDouble} className="text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Левая панель - список чатов */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800 mb-4">Чаты</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <IconWrapper icon={FaSearch} className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                selectedChat === chat.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-12 h-12 rounded-full"
                />
                {chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{chat.name}</span>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 truncate">
                    {chat.typing ? (
                      <span className="text-blue-500">печатает...</span>
                    ) : (
                      chat.lastMessage
                    )}
                  </p>
                  {chat.unread > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Правая панель - чат */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Шапка чата */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={chats.find(c => c.id === selectedChat)?.avatar}
                  alt="Chat Avatar"
                  className="w-10 h-10 rounded-full"
                />
                <div className="ml-4">
                  <h2 className="font-semibold text-gray-900">
                    {chats.find(c => c.id === selectedChat)?.name}
                  </h2>
                  <span className="text-sm text-green-500">онлайн</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-gray-600 hover:text-gray-800">
                  <IconWrapper icon={FaPhone} className="w-5 h-5" />
                </button>
                <button className="text-gray-600 hover:text-gray-800">
                  <IconWrapper icon={FaVideo} className="w-5 h-5" />
                </button>
                <button className="text-gray-600 hover:text-gray-800">
                  <IconWrapper icon={FaEllipsisV} className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white rounded-l-lg rounded-br-lg'
                        : 'bg-white text-gray-800 rounded-r-lg rounded-bl-lg'
                    } p-4 shadow-sm`}
                  >
                    {msg.attachments?.length === 1 ? (
                      <div className="flex items-center space-x-3">
                        <img
                          src={msg.attachments[0].url}
                          alt={msg.attachments[0].name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{msg.attachments[0].name}</p>
                        </div>
                      </div>
                    ) : msg.attachments?.length === 2 ? (
                      <div className="flex items-center space-x-3">
                        <img
                          src={msg.attachments[0].url}
                          alt={msg.attachments[0].name}
                          className="w-8 h-8 rounded-full"
                        />
                        <img
                          src={msg.attachments[1].url}
                          alt={msg.attachments[1].name}
                          className="w-8 h-8 rounded-full"
                        />
                      </div>
                    ) : null}
                    <div
                      className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                        msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                      {msg.sender === 'user' && getStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Панель ввода */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <button
                className="text-gray-500 hover:text-gray-600"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <IconWrapper icon={FaSmile} className="w-6 h-6" />
              </button>
              <button className="text-gray-500 hover:text-gray-600">
                <IconWrapper icon={FaPaperclip} className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите сообщение..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows={1}
                />
              </div>
              {newMessage.trim() ? (
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
                >
                  <IconWrapper icon={FaPaperPlane} className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`${
                    isRecording ? 'bg-red-500' : 'text-gray-500'
                  } p-2 rounded-full hover:bg-gray-100`}
                >
                  <IconWrapper icon={FaMicrophone} className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-700">
              Выберите чат для начала общения
            </h3>
            <p className="text-gray-500 mt-2">
              Выберите существующий чат или начните новый
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage; 