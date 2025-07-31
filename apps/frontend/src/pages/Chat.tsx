import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, Search, Loader, Plus, MessageCircle, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { parentService } from '../services/parentService';
import NewChatModal from '../components/NewChatModal';
import { Link } from 'react-router-dom';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const {
    chats,
    currentChat,
    messages,
    loading,
    error,
    messagesLoading,
    sendingMessage,
    typingUsers,
    openChat,
    sendMessage,
    sendTypingIndicator,
    getChatDisplayName,
    getChatAvatar,
    formatMessageTime,
    isMyMessage,
    isWebSocketConnected,
    loadChats,
  } = useChat();

  // Отладка состояния typingUsers
  useEffect(() => {
    console.log('🔍 typingUsers state changed:', {
      typingUsersSize: typingUsers.size,
      typingUsersArray: Array.from(typingUsers),
      currentChatId: currentChat?.id
    });
  }, [typingUsers, currentChat]);

  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [setupChatsLoading, setSetupChatsLoading] = useState(false);
  const [chatSetupSuccess, setChatSetupSuccess] = useState(false);
  const [chatSetupError, setChatSetupError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;

    try {
      await sendMessage({
        content: newMessage,
        chatId: currentChat.id,
      });
      setNewMessage('');

      // Реактивное обновление списка чатов после отправки сообщения
      await loadChats();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Обработка индикатора набора текста
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Отправляем индикатор "печатает"
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Сбрасываем предыдущий таймер
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Устанавливаем новый таймер для остановки индикатора
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);

    // Если поле пустое, сразу останавливаем индикатор
    if (!value.trim() && isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Обработка настройки чатов для родителей
  const handleSetupChats = async () => {
    try {
      setSetupChatsLoading(true);
      setChatSetupSuccess(false);
      setChatSetupError(null);

      const result = await parentService.setupMyChats();
      if (result && result.length > 0) {
        setChatSetupSuccess(true);
        // Обновляем список чатов
        await loadChats();
        setTimeout(() => setChatSetupSuccess(false), 5000);
      } else {
        setChatSetupError('Новые чаты не были созданы');
      }
    } catch (err: any) {
      setChatSetupError(err.response?.data?.message || 'Ошибка при настройке чатов');
    } finally {
      setSetupChatsLoading(false);
    }
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const filteredChats = chats.filter(chat =>
    getChatDisplayName(chat).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    const words = name.split(' ');
    return words.length >= 2
      ? `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase()
      : name.charAt(0).toUpperCase();
  };

  const getOnlineStatus = (chat: any) => {
    if (chat.isGroup) return null;

    // Для личного чата находим собеседника
    const otherParticipant = chat.participants?.find((p: any) => p.userId !== chat.createdById);
    return otherParticipant?.user?.isOnline || false;
  };

  if (loading && chats.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Загрузка чатов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar with chats */}
      <div className={`${currentChat ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 xl:w-1/4 bg-white border-r border-gray-200 flex-col h-full max-h-full overflow-hidden`}>
        {/* Header */}
        <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Сообщения</h1>
            <div className="flex items-center space-x-2">
              {user?.role === 'ADMIN' && (
                <Link
                  to="/app/admin-chats"
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                  title="Чаты сотрудников"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </Link>
              )}
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 lg:pl-12 pr-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base lg:text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex-shrink-0 p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {chatSetupSuccess && (
          <div className="flex-shrink-0 p-3 bg-green-50 border-b border-green-200">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-800 font-medium">Чаты настроены!</p>
                <p className="text-xs text-green-700">Созданы чаты с учителями и администрацией</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {chatSetupError && (
          <div className="flex-shrink-0 p-3 bg-red-50 border-b border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-red-800 font-medium">Ошибка</p>
                  <p className="text-xs text-red-700">{chatSetupError}</p>
                </div>
              </div>
              <button
                onClick={() => setChatSetupError(null)}
                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Chats list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredChats.length === 0 ? (
            <div className="p-4 sm:p-6 lg:p-8 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-gray-400" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2">Нет чатов</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-500 mb-4">
                {user?.role === 'PARENT' 
                  ? 'Настройте чаты с учителями и администрацией' 
                  : 'Начните новый чат, чтобы общаться с коллегами'
                }
              </p>
              
              {user?.role === 'PARENT' && (
                <button
                  onClick={handleSetupChats}
                  disabled={setupChatsLoading}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {setupChatsLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Настройка...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Настроить чаты
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const displayName = getChatDisplayName(chat);
              const avatar = getChatAvatar(chat);
              const isOnline = getOnlineStatus(chat);

              return (
                <div
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={`p-2 sm:p-3 lg:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${currentChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="relative flex-shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                          {getInitials(displayName)}
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 truncate pr-1 sm:pr-2">
                          {displayName}
                        </p>
                        {chat.lastMessage && (
                          <p className="text-xs text-gray-500 flex-shrink-0">
                            {formatMessageTime(chat.lastMessage.createdAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        {chat.lastMessage && (
                          <p className="text-xs sm:text-sm text-gray-600 truncate pr-1 sm:pr-2">
                            {chat.lastMessage.content.length > (window.innerWidth < 640 ? 25 : 40) 
                              ? `${chat.lastMessage.content.substring(0, window.innerWidth < 640 ? 25 : 40)}...` 
                              : chat.lastMessage.content}
                          </p>
                        )}
                        {(chat.unreadCount ?? 0) > 0 && (
                          <span className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full flex-shrink-0 min-w-[18px] sm:min-w-[20px]">
                            {(chat.unreadCount ?? 0) > 99 ? '99+' : (chat.unreadCount ?? 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${currentChat ? 'flex' : 'hidden lg:flex'} flex-1 flex-col h-full max-h-full overflow-hidden`}>
        {currentChat ? (
          <>
            {/* Chat header */}
            <div className="flex-shrink-0 px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-1 min-w-0">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => openChat(undefined as any)}
                    className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="relative flex-shrink-0">
                    {getChatAvatar(currentChat) ? (
                      <img
                        src={getChatAvatar(currentChat)}
                        alt={getChatDisplayName(currentChat)}
                        className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-gray-100"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs lg:text-sm shadow-md">
                        {getInitials(getChatDisplayName(currentChat))}
                      </div>
                    )}
                    {getOnlineStatus(currentChat) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <h2 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 truncate">
                        {getChatDisplayName(currentChat)}
                      </h2>
                      {/* Connection status */}
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 hidden sm:block flex-shrink-0"
                        title="Подключено" />
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {typingUsers.size > 0 ? (
                        <span className="text-blue-600 italic flex items-center space-x-1">
                          <span className="inline-flex space-x-0.5">
                            <span className="w-0.5 h-0.5 bg-blue-600 rounded-full animate-bounce"></span>
                            <span className="w-0.5 h-0.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-0.5 h-0.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          </span>
                          <span className="hidden sm:inline text-xs">Печатает...</span>
                          <span className="sm:hidden">...</span>
                        </span>
                      ) : currentChat.isGroup ? (
                        `${currentChat.participants?.length || 0} участников`
                      ) : (
                        getOnlineStatus(currentChat) ? 'В сети' : 'Был(а) недавно'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-0.5 flex-shrink-0">
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors hidden sm:block">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors hidden sm:block">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-2 sm:p-3 lg:p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 min-h-0">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-600" />
                    <span className="text-xs sm:text-sm text-gray-600">Загрузка сообщений...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Send className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-500">Нет сообщений</p>
                    <p className="text-xs sm:text-sm text-gray-400">Начните разговор!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 sm:space-y-2 lg:space-y-3">
                  {messages.map((message, index) => {
                    const isOwn = isMyMessage(message);
                    const prevMessage = messages[index - 1];
                    const showAvatar = !prevMessage || !isOwn || isMyMessage(prevMessage) !== isOwn;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-in px-1`}
                      >
                        <div className={`flex items-end space-x-1 sm:space-x-2 ${isOwn ? 'max-w-[80%]' : 'max-w-[85%]'} sm:max-w-[75%] md:max-w-sm lg:max-w-md xl:max-w-lg`}>
                          {!isOwn ? (
                            showAvatar ? (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm">
                                {getInitials(message.sender?.name + ' ' + message.sender?.surname || 'U')}
                              </div>
                            ) : (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 flex-shrink-0"></div>
                            )
                          ) : null}
                          
                          <div
                            className={`px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-3 rounded-2xl shadow-sm ${
                              isOwn
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm sm:rounded-br-md'
                                : 'bg-white text-gray-900 rounded-bl-sm sm:rounded-bl-md border border-gray-100'
                            }`}
                          >
                            <p className="text-xs max-w-[200px] sm:text-sm lg:text-base leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-blue-100' : 'text-gray-400'
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {sendingMessage && (
                    <div className="flex justify-end animate-slide-in px-1">
                      <div className="flex items-center space-x-1 sm:space-x-2 max-w-[80%] sm:max-w-[75%] md:max-w-sm px-2 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl rounded-br-sm sm:rounded-br-md opacity-70 shadow-sm">
                        <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        <span className="text-xs sm:text-sm">Отправка...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-2 sm:p-3 lg:p-4">
              <div className="flex items-end space-x-1 sm:space-x-2 w-full">
                <button className="hidden md:block p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <textarea
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors min-h-[36px] sm:min-h-[40px]"
                    rows={1}
                    disabled={sendingMessage}
                  />
                </div>
                <button className="hidden md:block p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                  <Smile className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-1.5 sm:p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-2 sm:p-4">
            <div className="text-center max-w-xs sm:max-w-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Send className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2">Выберите чат</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-500">Выберите чат из списка, чтобы начать общение</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={() => {
          setShowNewChatModal(false);
          loadChats(); // Принудительно обновляем чаты в родительском компоненте
        }}
      />
    </div>
  );
};

export default Chat;
