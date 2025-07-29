import React, { useState, useEffect } from 'react';
import { X, Search, User, Users, Loader } from 'lucide-react';
import { useChat } from '../hooks/useChat';

interface User {
  id: number;
  name: string;
  surname: string;
  avatar?: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated?: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onChatCreated }) => {
  const { createChat, searchUsers, openChat, openDirectChat, loadChats } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [chatName, setChatName] = useState('');
  const [isGroup, setIsGroup] = useState(false);

  // Поиск пользователей
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchTerm.trim()) {
        try {
          setLoading(true);
          const foundUsers = await searchUsers(searchTerm);
          setUsers(foundUsers);
        } catch (error) {
          console.error('Error searching users:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, searchUsers]);

  const handleUserToggle = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        const newSelected = prev.filter(u => u.id !== user.id);
        // Если остался только один пользователь, переключаемся на личный чат
        if (newSelected.length <= 1) {
          setIsGroup(false);
          setChatName('');
        }
        return newSelected;
      } else {
        const newSelected = [...prev, user];
        // Если выбрано больше одного пользователя, переключаемся на групповой чат
        if (newSelected.length > 1) {
          setIsGroup(true);
        }
        return newSelected;
      }
    });
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setCreating(true);
      
      if (selectedUsers.length === 1) {
        // Создаем или открываем личный чат с пользователем
        await openDirectChat(selectedUsers[0].id);
      } else {
        // Создаем групповой чат
        const chat = await createChat({
          participantIds: selectedUsers.map(u => u.id),
          name: chatName || `Групповой чат (${selectedUsers.length} участников)`,
          isGroup: true
        });
        
        if (chat) {
          await openChat(chat);
        }
      }

      // Принудительно обновляем список чатов после создания
      await loadChats();
      
      // Вызываем коллбэк из родительского компонента
      if (onChatCreated) {
        onChatCreated();
      }
      
      // Дополнительное обновление через 100ms для надежности
      setTimeout(async () => {
        await loadChats();
      }, 100);
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setUsers([]);
    setSelectedUsers([]);
    setChatName('');
    setIsGroup(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Новый чат</h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Выбрано: {selectedUsers.length}
              </span>
              {isGroup && (
                <div className="flex items-center text-xs text-blue-600">
                  <Users className="w-3 h-3 mr-1" />
                  Групповой чат
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                >
                  <span>{user.name} {user.surname}</span>
                  <button
                    onClick={() => handleUserToggle(user)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Group chat name */}
            {isGroup && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Название группы (необязательно)"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Users list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Поиск пользователей...</span>
            </div>
          ) : users.length === 0 && searchTerm ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Пользователи не найдены</p>
            </div>
          ) : searchTerm === '' ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Введите имя для поиска</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => {
                const isSelected = selectedUsers.some(u => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleUserToggle(user)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        isSelected ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.name} ${user.surname}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          getInitials(user.name, user.surname)
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name} {user.surname}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleCreateChat}
              disabled={selectedUsers.length === 0 || creating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {creating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Создание...
                </>
              ) : (
                `Создать ${isGroup ? 'группу' : 'чат'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
