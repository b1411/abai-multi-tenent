import React, { useState } from 'react';
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrash,
  FaStar,
  FaRegStar,
  FaCalendarAlt,
  FaClock,
  FaTag,
  FaSort,
  FaList,
  FaColumns,
  FaUser,
  FaUsers
} from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { IconType } from 'react-icons';
import type { 
  DraggableProvided, 
  DroppableProvided, 
  DraggableStateSnapshot, 
  DroppableStateSnapshot,
  DraggableChildrenFn,
  DroppableChildrenFn
} from 'react-beautiful-dnd';

interface User {
  id: string;
  name: string;
  avatar?: string;
  role: 'teacher' | 'admin' | 'staff';
}

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  important: boolean;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assignee?: User;
  watchers: User[];
  priority: 'low' | 'medium' | 'high';
}

// Компонент для иконки с типизацией
const Icon: React.FC<{ icon: IconType } & React.HTMLAttributes<HTMLDivElement>> = ({ icon: IconComponent, ...props }) => {
  const IconElement = IconComponent as React.FC;
  return <div {...props}><IconElement /></div>;
};

// Типы для drag-and-drop компонентов
type DroppableComponent = React.ComponentType<{
  children: DroppableChildrenFn;
  droppableId: string;
}>;

type DraggableComponent = React.ComponentType<{
  children: DraggableChildrenFn;
  draggableId: string;
  index: number;
}>;

const StrictDraggable = Draggable as DraggableComponent;
const StrictDroppable = Droppable as DroppableComponent;
const StrictDragDropContext = DragDropContext as React.ComponentType<{
  onDragEnd: (result: DropResult) => void;
  children: React.ReactNode;
}>;

const TodoPage: React.FC = () => {
  // Пример пользователей
  const users: User[] = [
    { id: '1', name: 'Иванов А.П.', role: 'teacher' },
    { id: '2', name: 'Петрова Е.С.', role: 'teacher' },
    { id: '3', name: 'Сидоров И.М.', role: 'admin' },
    { id: '4', name: 'Козлова О.В.', role: 'staff' }
  ];

  const [todos, setTodos] = useState<Todo[]>([
    {
      id: '1',
      title: 'Проверить домашние задания',
      description: 'Проверить и оценить домашние работы учеников 9-го класса',
      completed: false,
      important: true,
      dueDate: '2025-04-15T10:00',
      tags: ['Проверка', 'Домашняя работа'],
      createdAt: '2025-04-10T08:30',
      status: 'todo',
      assignee: users[0],
      watchers: [users[1]],
      priority: 'high'
    },
    {
      id: '2',
      title: 'Подготовить материалы к уроку',
      description: 'Презентация и раздаточные материалы по теме "Квадратные уравнения"',
      completed: false,
      important: true,
      dueDate: '2025-04-15T10:00',
      tags: ['Математика', 'Урок'],
      createdAt: '2025-04-10T09:00',
      status: 'in_progress',
      assignee: users[1],
      watchers: [users[0], users[2]],
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Заполнить журнал успеваемости',
      description: 'Внести оценки за контрольную работу в электронный журнал',
      completed: false,
      important: false,
      dueDate: '2025-04-16T15:00',
      tags: ['Журнал', 'Оценки'],
      createdAt: '2025-04-10T10:00',
      status: 'review',
      assignee: users[0],
      watchers: [],
      priority: 'medium'
    }
  ]);

  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'importance'>('date');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Получаем все уникальные теги
  const allTags = Array.from(
    new Set(todos.flatMap((todo) => todo.tags))
  ).sort();

  // Фильтрация задач
  const filteredTodos = todos
    .filter(
      (todo) =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedTags.length === 0 ||
          selectedTags.every((tag) => todo.tags.includes(tag)))
    )
    .sort((a, b) => {
      if (sortBy === 'importance') {
        return b.important === a.important ? 0 : b.important ? 1 : -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Группировка задач по статусу для канбан-доски
  const groupedTodos = {
    todo: filteredTodos.filter(todo => todo.status === 'todo'),
    in_progress: filteredTodos.filter(todo => todo.status === 'in_progress'),
    review: filteredTodos.filter(todo => todo.status === 'review'),
    done: filteredTodos.filter(todo => todo.status === 'done')
  };

  const handleAddTodo = (todo: Omit<Todo, 'id' | 'createdAt' | 'status' | 'watchers'>) => {
    const newTodo: Todo = {
      ...todo,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      status: 'todo',
      watchers: [],
      priority: 'low'
    };
    setTodos([...todos, newTodo]);
    setShowAddTodo(false);
  };

  const handleUpdateTodo = (updatedTodo: Todo) => {
    setTodos(
      todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
    );
    setEditingTodo(null);
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleStatusChange = (todoId: string, newStatus: Todo['status']) => {
    setTodos(
      todos.map((todo) =>
        todo.id === todoId ? { ...todo, status: newStatus } : todo
      )
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const updatedTodos = Array.from(todos);
    const [movedTodo] = updatedTodos.filter(todo => todo.id === result.draggableId);
    
    if (movedTodo) {
      // Обновляем статус задачи
      movedTodo.status = destination.droppableId as Todo['status'];
      
      // Обновляем состояние
      setTodos(updatedTodos.map(todo => 
        todo.id === movedTodo.id ? movedTodo : todo
      ));
    }
  };

  const getFilteredTodos = (status: Todo['status']) => {
    return filteredTodos.filter(todo => todo.status === status);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Верхняя панель */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-corporate-primary">Список задач</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'list'
                    ? 'bg-white text-corporate-primary shadow-sm'
                    : 'text-gray-500 hover:text-corporate-primary'
                }`}
              >
                <Icon icon={FaList} className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'kanban'
                    ? 'bg-white text-corporate-primary shadow-sm'
                    : 'text-gray-500 hover:text-corporate-primary'
                }`}
              >
                <Icon icon={FaColumns} className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setShowAddTodo(true)}
              className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-lg hover:bg-corporate-primary/90 transition-colors"
            >
              <Icon icon={FaPlus} className="w-5 h-5 mr-2" />
              Добавить задачу
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск задач..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary"
              />
              <Icon icon={FaSearch} className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-corporate-primary/10 text-corporate-primary' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon icon={FaFilter} className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSortBy(sortBy === 'date' ? 'importance' : 'date')}
              className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Icon icon={FaSort} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Панель фильтров */}
        {showFilters && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTags(
                      selectedTags.includes(tag)
                        ? selectedTags.filter((t) => t !== tag)
                        : [...selectedTags, tag]
                    )
                  }
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-corporate-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button
                onClick={() => setSelectedTags([])}
                className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Основная область */}
      <div className="flex-1 p-4 overflow-auto">
        {view === 'list' ? (
          <div className="space-y-4">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white rounded-lg border ${
                  todo.completed ? 'border-gray-200' : 'border-corporate-primary/20'
                } p-4 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() =>
                        handleUpdateTodo({ ...todo, completed: !todo.completed })
                      }
                      className={`p-2 rounded-full transition-colors ${
                        todo.completed
                          ? 'bg-green-100 text-green-500'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <Icon icon={FaCheck} className="w-5 h-5" />
                    </button>
                    <div>
                      <h3
                        className={`text-lg font-medium ${
                          todo.completed
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="mt-1 text-gray-600">{todo.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {todo.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        {todo.dueDate && (
                          <div className="flex items-center">
                            <Icon icon={FaCalendarAlt} className="w-5 h-5 mr-2" />
                            {new Date(todo.dueDate).toLocaleString('ru', {
                              day: 'numeric',
                              month: 'long',
                              hour: 'numeric',
                              minute: 'numeric'
                            })}
                          </div>
                        )}
                        {todo.assignee && (
                          <div className="flex items-center">
                            <Icon icon={FaUser} className="w-5 h-5 mr-2" />
                            {todo.assignee.name}
                          </div>
                        )}
                        {todo.watchers.length > 0 && (
                          <div className="flex items-center">
                            <Icon icon={FaUsers} className="w-5 h-5 mr-2" />
                            {todo.watchers.length} наблюдателей
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleUpdateTodo({ ...todo, important: !todo.important })
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        todo.important
                          ? 'text-yellow-500'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {todo.important ? <Icon icon={FaStar} className="w-5 h-5" /> : <Icon icon={FaRegStar} className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setEditingTodo(todo)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    >
                      <Icon icon={FaEdit} className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Icon icon={FaTrash} className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 p-4 overflow-x-auto">
              <div className="flex gap-6 min-h-full">
                {Object.entries(groupedTodos).map(([status, todos]) => (
                  <div key={status} className="flex-1 min-w-[300px] max-w-[400px]">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      {status === 'todo' && 'К выполнению'}
                      {status === 'in_progress' && 'В работе'}
                      {status === 'review' && 'На проверке'}
                      {status === 'done' && 'Выполнено'}
                    </h3>
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`bg-gray-100 rounded-lg p-3 min-h-[200px] transition-colors ${
                            snapshot.isDraggingOver ? 'bg-corporate-primary/5' : ''
                          }`}
                        >
                          {todos.map((todo, index) => (
                            <Draggable key={todo.id} draggableId={todo.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={provided.draggableProps.style}
                                  className={`bg-white rounded-lg p-4 mb-2 ${
                                    snapshot.isDragging
                                      ? 'shadow-lg ring-2 ring-corporate-primary/20'
                                      : 'shadow-sm hover:shadow-md'
                                  } transition-all`}
                                >
                                  <h4 className="font-semibold text-gray-800 mb-2">{todo.title}</h4>
                                  {todo.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{todo.description}</p>
                                  )}
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                      <Icon icon={FaUser} className="w-5 h-5 text-gray-400" />
                                      <span>{todo.assignee?.name}</span>
                                    </div>
                                    {todo.dueDate && (
                                      <div className="flex items-center gap-2">
                                        <Icon icon={FaClock} className="w-5 h-5 text-gray-400" />
                                        <span>{new Date(todo.dueDate).toLocaleDateString('ru')}</span>
                                      </div>
                                    )}
                                  </div>
                                  {todo.tags && todo.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {todo.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="px-2 py-1 bg-corporate-primary/10 text-corporate-primary text-xs rounded-full"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Модальное окно создания/редактирования задачи */}
      {(showAddTodo || editingTodo) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-corporate-primary">
                {editingTodo ? 'Редактировать задачу' : 'Новая задача'}
              </h2>
              <button
                onClick={() => {
                  setShowAddTodo(false);
                  setEditingTodo(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <Icon icon={FaTimes} className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-corporate-primary mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={editingTodo?.title || ''}
                  onChange={(e) =>
                    editingTodo
                      ? setEditingTodo({ ...editingTodo, title: e.target.value })
                      : null
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary"
                  placeholder="Введите название задачи"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-corporate-primary mb-2">
                  Описание
                </label>
                <textarea
                  value={editingTodo?.description || ''}
                  onChange={(e) =>
                    editingTodo
                      ? setEditingTodo({
                          ...editingTodo,
                          description: e.target.value
                        })
                      : null
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary resize-none"
                  placeholder="Добавьте описание задачи"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-corporate-primary mb-2">
                    Срок выполнения
                  </label>
                  <input
                    type="datetime-local"
                    value={editingTodo?.dueDate?.slice(0, 16) || ''}
                    onChange={(e) =>
                      editingTodo
                        ? setEditingTodo({
                            ...editingTodo,
                            dueDate: e.target.value
                          })
                        : null
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-corporate-primary mb-2">
                    Ответственный
                  </label>
                  <select
                    value={editingTodo?.assignee?.id || ''}
                    onChange={(e) =>
                      editingTodo
                        ? setEditingTodo({
                            ...editingTodo,
                            assignee: users.find(u => u.id === e.target.value)
                          })
                        : null
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary"
                  >
                    <option value="">Выберите ответственного</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-corporate-primary mb-2">
                  Наблюдатели
                </label>
                <div className="space-y-2">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingTodo?.watchers.some(w => w.id === user.id)}
                        onChange={(e) => {
                          if (!editingTodo) return;
                          const watchers = e.target.checked
                            ? [...editingTodo.watchers, user]
                            : editingTodo.watchers.filter(w => w.id !== user.id);
                          setEditingTodo({ ...editingTodo, watchers });
                        }}
                        className="mr-2 h-4 w-4 rounded border-gray-300 text-corporate-primary focus:ring-corporate-primary"
                      />
                      <span className="text-sm text-gray-700">{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-corporate-primary mb-2">
                  Теги
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (!editingTodo) return;
                        const tags = editingTodo.tags.includes(tag)
                          ? editingTodo.tags.filter((t) => t !== tag)
                          : [...editingTodo.tags, tag];
                        setEditingTodo({ ...editingTodo, tags });
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        editingTodo?.tags.includes(tag)
                          ? 'bg-corporate-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const newTag = prompt('Введите новый тег');
                      if (newTag && editingTodo) {
                        setEditingTodo({
                          ...editingTodo,
                          tags: [...editingTodo.tags, newTag]
                        });
                      }
                    }}
                    className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm transition-colors"
                  >
                    <Icon icon={FaPlus} className="inline-block mr-1" />
                    Добавить тег
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                {editingTodo?.id && (
                  <button
                    onClick={() => {
                      handleDeleteTodo(editingTodo.id);
                      setEditingTodo(null);
                    }}
                    className="flex items-center px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Icon icon={FaTrash} className="mr-2" />
                    Удалить
                  </button>
                )}
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setShowAddTodo(false);
                      setEditingTodo(null);
                    }}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => {
                      if (editingTodo?.id) {
                        handleUpdateTodo(editingTodo);
                      } else if (editingTodo) {
                        handleAddTodo(editingTodo);
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-lg hover:bg-corporate-primary/90 transition-colors"
                  >
                    <Icon icon={FaCheck} className="mr-2" />
                    {editingTodo?.id ? 'Сохранить' : 'Добавить'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoPage; 