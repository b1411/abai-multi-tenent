import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatService, ChatRoom, ChatMessage, CreateChatDto, CreateMessageDto, UpdateMessageDto, User } from '../services/chatService';
import { useAuth } from './useAuth';

export const useChat = () => {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const { user } = useAuth();
  
  const socketRef = useRef<Socket | null>(null);

  // Подключение к Socket.IO
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const cleanUrl = baseUrl.replace(/\/+$/, '');

    console.log('🔗 Connecting to Socket.IO...');
    
    const socket = io(`${cleanUrl}/chat`, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      setIsSocketConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setIsSocketConnected(false);
    });

    socket.on('error', (error: any) => {
      console.error('❌ Socket.IO error:', error);
      setError('Ошибка подключения');
    });

    // Обработчики событий чата
    socket.on('newMessage', (data: { message: ChatMessage; chatId: number }) => {
      console.log('📨 New message received:', data);
      
      // Добавляем сообщение если это текущий чат
      if (currentChat && data.chatId === currentChat.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
      
      // Обновляем последнее сообщение в списке чатов
      setChats(prev => prev.map(chat => {
        if (chat.id === data.chatId) {
          // Если это сообщение от текущего пользователя, не увеличиваем счетчик
          const isMyMessage = user && data.message.senderId === user.id;
          // Если чат открыт или это мое сообщение, счетчик = 0, иначе увеличиваем
          const shouldIncrement = !isMyMessage && chat.id !== currentChat?.id;
          
          return { 
            ...chat, 
            lastMessage: data.message, 
            unreadCount: shouldIncrement ? (chat.unreadCount || 0) + 1 : 0
          };
        }
        return chat;
      }));
    });

    socket.on('messageSent', (data: { message: ChatMessage }) => {
      console.log('✅ Message sent confirmation:', data);
      
      // Заменяем временное сообщение на реальное (если есть) или добавляем новое
      if (currentChat && data.message.chatId === currentChat.id) {
        setMessages(prev => {
          // Ищем временное сообщение с тем же содержимым
          const tempMessageIndex = prev.findIndex(m => 
            m.content === data.message.content && 
            m.senderId === data.message.senderId &&
            m.id > 1000000000000 // Временные ID больше этого значения
          );
          
          if (tempMessageIndex !== -1) {
            // Заменяем временное сообщение на реальное
            const newMessages = [...prev];
            newMessages[tempMessageIndex] = data.message;
            return newMessages;
          } else {
            // Проверяем, нет ли уже этого сообщения
            const exists = prev.some(m => m.id === data.message.id);
            if (exists) return prev;
            return [...prev, data.message];
          }
        });
      }
      
      // Обновляем последнее сообщение в списке чатов
      setChats(prev => prev.map(chat => 
        chat.id === data.message.chatId 
          ? { ...chat, lastMessage: data.message }
          : chat
      ));
    });

    socket.on('userTyping', (data: { userId: number; chatId: number; isTyping: boolean }) => {
      console.log('👀 userTyping event received:', data, {
        currentChatId: currentChat?.id,
        myUserId: user?.id,
        isForCurrentChat: currentChat && data.chatId === currentChat.id,
        isNotMyself: data.userId !== user?.id
      });
      
      if (currentChat && data.chatId === currentChat.id && data.userId !== user.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
            console.log('✍️ Added user to typing:', data.userId, 'Total typing users:', newSet.size);
          } else {
            newSet.delete(data.userId);
            console.log('🛑 Removed user from typing:', data.userId, 'Total typing users:', newSet.size);
          }
          return newSet;
        });
        
        // Автоматически убираем индикатор через 3 секунды
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              console.log('⏰ Auto-removed user from typing after timeout:', data.userId);
              return newSet;
            });
          }, 3000);
        }
      } else {
        console.log('🚫 userTyping event ignored because:', {
          noCurrentChat: !currentChat,
          wrongChat: currentChat && data.chatId !== currentChat.id,
          isMyself: data.userId === user?.id
        });
      }
    });

    socket.on('userJoined', (data: { userId: number; chatId: number }) => {
      console.log(`👋 User ${data.userId} joined chat ${data.chatId}`);
    });

    socket.on('userLeft', (data: { userId: number; chatId: number }) => {
      console.log(`👋 User ${data.userId} left chat ${data.chatId}`);
    });

    socket.on('newChat', (data: { chatId: number }) => {
      console.log(`🆕 New chat created: ${data.chatId}`);
      loadChats(); // Перезагружаем список чатов
    });

    socket.on('joinedChat', (data: { chatId: number }) => {
      console.log(`✅ Joined chat ${data.chatId}`);
    });

    socket.on('leftChat', (data: { chatId: number }) => {
      console.log(`✅ Left chat ${data.chatId}`);
    });

    socket.on('connected', (data: { userId: number }) => {
      console.log(`✅ User ${data.userId} connected`);
    });

    return () => {
      console.log('🔌 Disconnecting Socket.IO...');
      socket.disconnect();
      socketRef.current = null;
      setIsSocketConnected(false);
    };
  }, [user, currentChat]);

  // Загрузка списка чатов
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const chatsData = await chatService.getRecentChats();
      console.log('📊 Loaded chats with unreadCount:', chatsData.map(chat => ({
        id: chat.id,
        name: chat.name || 'No name',
        unreadCount: chat.unreadCount
      })));
      setChats(chatsData);
    } catch (err) {
      setError('Ошибка загрузки чатов');
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка сообщений чата
  const loadMessages = useCallback(async (chatId: number, page: number = 1) => {
    try {
      setMessagesLoading(true);
      setError(null);
      const response = await chatService.getChatMessages(chatId, page);
      
      // Проверяем структуру ответа - может быть { messages: [...] } или { data: [...] }
      const messages = (response as any)?.data || (response as any)?.messages || [];
      if (!Array.isArray(messages)) {
        console.warn('Messages data is not an array:', response);
        setMessages([]);
        return;
      }
      
      console.log('📥 Loaded messages:', messages);
      
      if (page === 1) {
        // Для первой страницы - сортируем по времени создания (старые вверху, новые внизу)
        const sortedMessages = [...messages].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
      } else {
        // Для пагинации - добавляем старые сообщения в начало
        const sortedMessages = [...messages].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(prev => [...sortedMessages, ...prev]);
      }
    } catch (err) {
      setError('Ошибка загрузки сообщений');
      console.error('Error loading messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Отправка сообщения через Socket.IO
  const sendMessage = useCallback(async (messageData: CreateMessageDto) => {
    if (!currentChat || !user) return;
    
    try {
      setSendingMessage(true);
      setError(null);
      
      // Создаем временное сообщение для оптимистичного обновления
      const tempMessage: ChatMessage = {
        id: Date.now(), // Временный ID
        content: messageData.content,
        senderId: user.id,
        chatId: messageData.chatId || currentChat.id,
        isRead: false,
        isEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replyToId: messageData.replyToId || undefined,
        sender: {
          id: user.id,
          name: user.name || 'Вы',
          surname: user.surname || '',
          avatar: user.avatar
        },
        replyTo: undefined
      };
      
      // Добавляем временное сообщение сразу в UI (оптимистичное обновление)
      setMessages(prev => [...prev, tempMessage]);
      
      // Отправляем через Socket.IO если подключен
      if (socketRef.current && isSocketConnected) {
        console.log('📤 Sending message via Socket.IO (optimistic update added)');
        
        socketRef.current.emit('sendMessage', messageData);
        
        // Удаляем временное сообщение через 10 секунд, если не получили подтверждение
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        }, 10000);
        
        return Promise.resolve(null);
      } else {
        // Fallback на HTTP API
        console.log('📤 Sending message via HTTP (Socket.IO not connected)');
        
        const newMessage = await chatService.sendMessage(messageData);
        
        // Заменяем временное сообщение на реальное
        setMessages(prev => 
          prev.map(msg => msg.id === tempMessage.id ? newMessage : msg)
        );
        
        if (messageData.chatId) {
          setChats(prev => prev.map(chat => 
            chat.id === messageData.chatId 
              ? { ...chat, lastMessage: newMessage }
              : chat
          ));
        }
        
        return newMessage;
      }
    } catch (err) {
      setError('Ошибка отправки сообщения');
      console.error('Error sending message:', err);
      
      // Удаляем временное сообщение при ошибке
      setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
      
      throw err;
    } finally {
      setSendingMessage(false);
    }
  }, [isSocketConnected, currentChat, user]);

  // Редактирование сообщения
  const updateMessage = useCallback(async (messageId: number, messageData: UpdateMessageDto) => {
    try {
      setError(null);
      const updatedMessage = await chatService.updateMessage(messageId, messageData);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
      
      return updatedMessage;
    } catch (err) {
      setError('Ошибка редактирования сообщения');
      console.error('Error updating message:', err);
      throw err;
    }
  }, []);

  // Удаление сообщения
  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      setError(null);
      await chatService.deleteMessage(messageId);
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      setError('Ошибка удаления сообщения');
      console.error('Error deleting message:', err);
      throw err;
    }
  }, []);

  // Создание нового чата
  const createChat = useCallback(async (chatData: CreateChatDto) => {
    try {
      setLoading(true);
      setError(null);
      const newChat = await chatService.createChat(chatData);
      
      // Добавляем новый чат в начало списка
      setChats(prev => [newChat, ...prev]);
      
      // Принудительно обновляем список чатов
      await loadChats();
      
      return newChat;
    } catch (err) {
      setError('Ошибка создания чата');
      console.error('Error creating chat:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadChats]);

  // Открытие чата
  const openChat = useCallback(async (chat: ChatRoom) => {
    setCurrentChat(chat);
    setMessages([]);
    setTypingUsers(new Set());
    await loadMessages(chat.id);
    
    // Присоединяемся к чату через Socket.IO
    if (socketRef.current && isSocketConnected) {
      socketRef.current.emit('joinChat', { chatId: chat.id });
    }
    
    // Отмечаем сообщения как прочитанные
    try {
      await chatService.markChatAsRead(chat.id);
      setChats(prev => prev.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      console.error('Error marking chat as read:', err);
    }
  }, [loadMessages, isSocketConnected]);

  // Покидание чата
  const leaveChat = useCallback((chatId: number) => {
    if (socketRef.current && isSocketConnected) {
      socketRef.current.emit('leaveChat', { chatId });
    }
  }, [isSocketConnected]);

  // Создание или открытие личного чата
  const openDirectChat = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      const chat = await chatService.getOrCreateDirectChat(userId);
      await openChat(chat);
      return chat;
    } catch (err) {
      setError('Ошибка открытия чата');
      console.error('Error opening direct chat:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [openChat]);

  // Поиск пользователей
  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    try {
      return await chatService.searchUsers(query);
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }, []);

  // Отправка индикатора печати
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    console.log('📝 sendTypingIndicator called:', {
      isTyping,
      currentChatId: currentChat?.id,
      socketConnected: isSocketConnected,
      hasSocket: !!socketRef.current
    });
    
    if (currentChat && socketRef.current && isSocketConnected) {
      console.log('📤 Emitting typing event:', { 
        chatId: currentChat.id, 
        isTyping 
      });
      socketRef.current.emit('typing', { 
        chatId: currentChat.id, 
        isTyping 
      });
    } else {
      console.log('🚫 Cannot send typing indicator because:', {
        noCurrentChat: !currentChat,
        noSocket: !socketRef.current,
        notConnected: !isSocketConnected
      });
    }
  }, [currentChat, isSocketConnected]);

  // Получение отображаемого имени чата
  const getChatDisplayName = useCallback((chat: ChatRoom) => {
    if (!user) return 'Неизвестный чат';
    return chatService.getChatDisplayName(chat, user.id);
  }, [user]);

  // Получение аватара чата
  const getChatAvatar = useCallback((chat: ChatRoom) => {
    if (!user) return undefined;
    return chatService.getChatAvatar(chat, user.id);
  }, [user]);

  // Форматирование времени сообщения
  const formatMessageTime = useCallback((timestamp: string) => {
    return chatService.formatMessageTime(timestamp);
  }, []);

  // Проверка, является ли сообщение от текущего пользователя
  const isMyMessage = useCallback((message: ChatMessage) => {
    return user?.id === message.senderId;
  }, [user]);

  // Загрузка чатов при монтировании
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  // Покидание текущего чата при размонтировании
  useEffect(() => {
    return () => {
      if (currentChat) {
        leaveChat(currentChat.id);
      }
    };
  }, [currentChat, leaveChat]);

  return {
    // Состояние
    chats,
    currentChat,
    messages,
    loading,
    error,
    messagesLoading,
    sendingMessage,
    typingUsers,
    
    // Методы
    loadChats,
    loadMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    createChat,
    openChat,
    openDirectChat,
    searchUsers,
    sendTypingIndicator,
    
    // Утилиты
    getChatDisplayName,
    getChatAvatar,
    formatMessageTime,
    isMyMessage,
    
    // Socket.IO статус
    isWebSocketConnected: () => isSocketConnected,
  };
};
