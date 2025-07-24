import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, Search, Loader, Plus } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import NewChatModal from '../components/NewChatModal';

const Chat: React.FC = () => {
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

      // Обновляем список чатов после отправки сообщения
      // Делаем это с небольшой задержкой, чтобы сервер успел обработать
      setTimeout(() => {
        loadChats();
      }, 500);
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
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar with chats */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">Сообщения</h1>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Chats list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет чатов</h3>
              <p className="text-gray-500">Начните новый чат, чтобы общаться с коллегами</p>
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
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${currentChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {getInitials(displayName)}
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {displayName}
                        </p>
                        {chat.lastMessage && (
                          <p className="text-xs text-gray-500">
                            {formatMessageTime(chat.lastMessage.createdAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        {chat.lastMessage && (
                          <p className="text-sm text-gray-600 truncate">
                            {chat.lastMessage.content}
                          </p>
                        )}
                        {(chat.unreadCount ?? 0) > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                            {chat.unreadCount}
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
      <div className="flex-1 flex flex-col h-screen">
        {currentChat ? (
          <>
            {/* Chat header - Sticky */}
            <div className="sticky top-0 z-10 p-4 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {getChatAvatar(currentChat) ? (
                      <img
                        src={getChatAvatar(currentChat)}
                        alt={getChatDisplayName(currentChat)}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {getInitials(getChatDisplayName(currentChat))}
                      </div>
                    )}
                    {getOnlineStatus(currentChat) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-medium text-gray-900">
                        {getChatDisplayName(currentChat)}
                      </h2>
                      {/* HTTP статус */}
                      <div className="w-2 h-2 rounded-full bg-blue-500"
                        title="HTTP подключение" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {typingUsers.size > 0 ? (
                        <span className="text-blue-600 italic flex items-center space-x-1">
                          <span className="inline-flex space-x-1">
                            <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          </span>
                          <span>Печатает...</span>
                        </span>
                      ) : currentChat.isGroup ? (
                        `${currentChat.participants?.length || 0} участников`
                      ) : (
                        getOnlineStatus(currentChat) ? 'В сети' : 'Не в сети'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 pb-20 overflow-y-auto bg-gray-50">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Загрузка сообщений...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = isMyMessage(message);
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                          {!isOwn && (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                              {getInitials(message.sender?.name + ' ' + message.sender?.surname || 'U')}
                            </div>
                          )}
                          <div
                            className={`px-4 py-2 rounded-lg ${isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'
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
                    <div className="flex justify-end">
                      <div className="flex items-center space-x-2 max-w-xs lg:max-w-md px-4 py-2 bg-blue-600 text-white rounded-lg opacity-60">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Отправка...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input - Fixed */}
            <div className="fixed bottom-0 right-0 left-1/3 z-10 p-4 border-t border-gray-200 bg-white shadow-lg">
              <div className="flex items-end space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={1}
                    disabled={sendingMessage}
                  />
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите чат</h3>
              <p className="text-gray-500">Выберите чат из списка, чтобы начать общение</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
      />
    </div>
  );
};

export default Chat;
