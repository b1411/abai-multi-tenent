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
      const response = await fetch('/api/chat/admin/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data);
      } else {
        console.error('Ошибка загрузки чатов:', response.statusText);
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
      const response = await fetch(`/api/chat/admin/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      } else {
        console.error('Ошибка загрузки сообщений:', response.statusText);
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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Чаты сотрудников</h1>
          <p className="text-gray-600">Просмотр и мониторинг всех чатов сотрудников</p>
        </div>
      </div>

      {/* Поиск */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск по участникам или названию чата..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего чатов</p>
                <p className="text-2xl font-bold text-gray-900">{chats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Групповые чаты</p>
                <p className="text-2xl font-bold text-gray-900">
                  {chats.filter(chat => chat.isGroup).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Личные чаты</p>
                <p className="text-2xl font-bold text-gray-900">
                  {chats.filter(chat => !chat.isGroup).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего сообщений</p>
                <p className="text-2xl font-bold text-gray-900">
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getChatDisplayName(chat)}
                      </h3>
                      {chat.isGroup && (
                        <Badge variant="secondary" className="text-xs">
                          Группа
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {chat.participants.map((participant) => (
                        <Badge
                          key={participant.id}
                          className={`text-xs ${getRoleBadgeColor(participant.user.role)}`}
                        >
                          {participant.user.roleDisplay || participant.user.role}
                        </Badge>
                      ))}
                    </div>

                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        <span className="font-medium">
                          {chat.lastMessage.sender.name}:
                        </span>{' '}
                        {chat.lastMessage.content}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        Сообщений: {chat.messageCount}
                      </span>
                      <span>
                        Обновлен: {format(new Date(chat.updatedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleViewMessages(chat)}
                    variant="outline"
                    size="sm"
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
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
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedChat && getChatDisplayName(selectedChat)}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-96 w-full p-4 border rounded">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : chatMessages && chatMessages.data.length > 0 ? (
              <div className="space-y-4">
                {chatMessages.data.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
                          {message.sender.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.sender.name} {message.sender.surname}
                        </span>
                        <Badge className={`text-xs ${getRoleBadgeColor(message.sender.role)}`}>
                          {message.sender.role}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </span>
                        {message.isEdited && (
                          <span className="text-xs text-gray-400">(изменено)</span>
                        )}
                      </div>
                      
                      {message.replyTo && (
                        <div className="bg-gray-100 border-l-4 border-gray-300 pl-3 py-2 mb-2 text-sm">
                          <span className="font-medium">{message.replyTo.sender.name}:</span>
                          <p className="text-gray-600">{message.replyTo.content}</p>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Сообщений пока нет</p>
              </div>
            )}
          </ScrollArea>

          {chatMessages && (
            <div className="text-sm text-gray-500 text-center">
              Показано {chatMessages.data.length} из {chatMessages.pagination.total} сообщений
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
