import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Search, MessageCircle, Users, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import apiClient from '../services/apiClient';

interface User {
  id: number;
  name: string;
  surname: string;
  avatar?: string;
  role: string;
  roleDisplay?: string;
}

interface Participant {
  id: number;
  userId: number;
  user: User;
  isActive: boolean;
  lastRead?: string;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isEdited: boolean;
  sender: User;
  replyTo?: {
    id: number;
    content: string;
    sender: User;
  };
}

interface Chat {
  id: number;
  name?: string;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  lastMessage?: Message;
  messageCount: number;
}

interface ChatMessages {
  data: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessages | null>(null);
  const [isMessagesDialogOpen, setIsMessagesDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    fetchEmployeeChats();
  }, []);

  useEffect(() => {
    filterChats();
  }, [searchTerm, chats]);

  const fetchEmployeeChats = async () => {
    try {
      setIsLoading(true);
      try {
        const data = await apiClient.get<Chat[]>('/chat/admin/all');
        setChats(data);
      } catch (e: any) {
        console.error('Ошибка загрузки чатов:', e?.message || e);
      }
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatMessages = async (chatId: number) => {
    try {
      setMessagesLoading(true);
      try {
        const data = await apiClient.get<ChatMessages>(`/chat/admin/${chatId}/messages`);
        setChatMessages(data);
      } catch (e: any) {
        console.error('Ошибка загрузки сообщений:', e?.message || e);
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const filterChats = () => {
    if (!searchTerm) {
      setFilteredChats(chats);
      return;
    }

    const filtered = chats.filter(chat => {
      const participantNames = chat.participants
        .map(p => `${p.user.name} ${p.user.surname}`)
        .join(' ')
        .toLowerCase();
      
      const chatName = chat.name?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();

      return participantNames.includes(search) || chatName.includes(search);
    });

    setFilteredChats(filtered);
  };

  const handleViewMessages = (chat: Chat) => {
    setSelectedChat(chat);
    setIsMessagesDialogOpen(true);
    fetchChatMessages(chat.id);
  };

  const getChatDisplayName = (chat: Chat): string => {
    if (chat.name) return chat.name;
    
    if (chat.isGroup) {
      return `Групповой чат (${chat.participants.length} участников)`;
    }
    
    // Для личного чата показываем имена участников
    return chat.participants
      .map(p => `${p.user.name} ${p.user.surname}`)
      .join(', ');
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'TEACHER': return 'bg-blue-100 text-blue-800';
      case 'HR': return 'bg-green-100 text-green-800';
      case 'FINANCIST': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка чатов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-8">
      <div className="flex flex-col gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Чаты сотрудников</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Просмотр и мониторинг всех чатов сотрудников</p>
        </div>
      </div>

      {/* Поиск */}
      <Card>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              placeholder="Поиск по участникам или названию чата..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600 flex-shrink-0" />
              <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Всего чатов</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">{chats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-green-600 flex-shrink-0" />
              <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Групповые</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">
                  {chats.filter(chat => chat.isGroup).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-purple-600 flex-shrink-0" />
              <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Личные</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">
                  {chats.filter(chat => !chat.isGroup).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-orange-600 flex-shrink-0" />
              <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Сообщений</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">
                  {chats.reduce((sum, chat) => sum + chat.messageCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список чатов */}
      <Card>
        <CardHeader>
          <CardTitle>Список чатов ({filteredChats.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'Чаты не найдены' : 'Нет активных чатов'}
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 lg:p-6 border rounded-lg sm:rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors gap-3 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-3">
                      <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 truncate">
                        {getChatDisplayName(chat)}
                      </h3>
                      {chat.isGroup && (
                        <Badge variant="secondary" className="text-xs sm:text-sm self-start">
                          Группа
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                      {chat.participants.map((participant) => (
                        <Badge
                          key={participant.id}
                          className={`text-xs sm:text-sm ${getRoleBadgeColor(participant.user.role)}`}
                        >
                          {participant.user.roleDisplay || participant.user.role}
                        </Badge>
                      ))}
                    </div>

                    {chat.lastMessage && (
                      <p className="text-xs sm:text-sm lg:text-base text-gray-600 truncate mb-2 sm:mb-3">
                        <span className="font-medium">
                          {chat.lastMessage.sender.name}:
                        </span>{' '}
                        {chat.lastMessage.content}
                      </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 text-xs text-gray-500">
                      <span>
                        Сообщений: {chat.messageCount}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {format(new Date(chat.updatedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleViewMessages(chat)}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Просмотр
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Диалог просмотра сообщений */}
      <Dialog open={isMessagesDialogOpen} onOpenChange={setIsMessagesDialogOpen}>
        <DialogContent className="w-[98vw] sm:w-full max-w-5xl h-[85vh] flex flex-col m-2 sm:m-4 p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2 border-b">
            <DialogTitle className="text-base sm:text-lg lg:text-xl pr-4 leading-tight">
              {selectedChat && getChatDisplayName(selectedChat)}
            </DialogTitle>
          </DialogHeader>

          {selectedChat && (
            <div className="px-4 py-2 border-b bg-gray-50 flex flex-wrap gap-1 sm:gap-2">
              {selectedChat.participants.map(p => (
                <Badge
                  key={p.id}
                  className={`text-[10px] sm:text-xs ${getRoleBadgeColor(p.user.role)} font-normal`}
                >
                  {p.user.name} {p.user.surname}
                </Badge>
              ))}
            </div>
          )}
          
          <ScrollArea className="flex-1 px-3 sm:px-4 py-3">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chatMessages && chatMessages.data.length > 0 ? (
              <div className="space-y-4">
                {chatMessages.data.map((message) => (
                  <div key={message.id} className="flex items-start gap-3 group">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-gray-300 to-gray-200 rounded-full flex items-center justify-center text-gray-700 text-xs font-semibold">
                        {message.sender.name.charAt(0)}
                      </div>
                    </div>

                    <div className="max-w-[75%] sm:max-w-[80%]">
                      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm relative">
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          <span className="font-medium text-xs sm:text-sm text-gray-900">
                            {message.sender.name} {message.sender.surname}
                          </span>
                          <Badge className={`text-[10px] sm:text-xs ${getRoleBadgeColor(message.sender.role)} px-1.5 py-0.5`}>
                            {message.sender.role}
                          </Badge>
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </span>
                          {message.isEdited && (
                            <span className="text-[10px] text-gray-400">(изменено)</span>
                          )}
                        </div>

                        {message.replyTo && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 mb-2 text-[11px] sm:text-xs">
                            <span className="font-medium">{message.replyTo.sender.name}:</span>{' '}
                            <span className="text-gray-600 break-words">{message.replyTo.content}</span>
                          </div>
                        )}

                        <div className="text-xs sm:text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                Сообщений пока нет
              </div>
            )}
          </ScrollArea>

          {chatMessages && (
            <div className="text-[11px] sm:text-xs lg:text-sm text-gray-500 text-center px-4 py-2 border-t bg-white">
              Показано {chatMessages.data.length} из {chatMessages.pagination.total} сообщений
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
