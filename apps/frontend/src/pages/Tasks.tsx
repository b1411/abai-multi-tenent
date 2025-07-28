import React, { useState, useCallback } from 'react';
import { Plus, Search, Filter, Calendar, User, Tag, MoreVertical, Edit, Trash2, List, LayoutGrid, Grip } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useTasks, useTaskStats, useTaskCategories } from '../hooks/useTasks';
import { Task, TaskStatus, TaskPriority, CreateTaskData, UpdateTaskData } from '../types/task';
import { formatDate } from '../utils/formatters';
import TaskForm from '../components/TaskForm';
import { PermissionGuard } from '../components/PermissionGuard';
import { useAuth } from '../hooks/useAuth';

type ViewMode = 'list' | 'kanban';

const Tasks: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | ''>('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const {
    tasks,
    loading,
    error,
    pagination,
    createTask,
    updateTask,
    deleteTask,
    updateFilter,
    changePage,
  } = useTasks();

  const { stats, fetchStats } = useTaskStats();
  const { categories } = useTaskCategories();

  const handleSearch = () => {
    updateFilter({
      page: 1,
      search: searchTerm,
      status: selectedStatus || undefined,
      priority: selectedPriority || undefined,
    });
  };

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    const updateData: UpdateTaskData = { status };
    const result = await updateTask(taskId, updateData);
    
    // Ревалидируем статистику после успешного изменения статуса
    if (result) {
      fetchStats();
    }
  };

  const handleCreateTask = async (taskData: CreateTaskData) => {
    const result = await createTask(taskData);
    if (result) {
      fetchStats(); // Ревалидируем статистику после создания задачи
    }
    setShowCreateModal(false);
  };

  const handleUpdateTask = async (taskData: UpdateTaskData) => {
    if (editingTask) {
      const result = await updateTask(editingTask.id, taskData);
      if (result) {
        fetchStats(); // Ревалидируем статистику после обновления задачи
      }
      setEditingTask(null);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowDropdown(null);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      const result = await deleteTask(taskId);
      if (result) {
        fetchStats(); // Ревалидируем статистику после удаления задачи
      }
      setShowDropdown(null);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTask(null);
  };

  const handleTaskSubmit = async (taskData: CreateTaskData | UpdateTaskData) => {
    if (editingTask) {
      await handleUpdateTask(taskData as UpdateTaskData);
    } else {
      await handleCreateTask(taskData as CreateTaskData);
    }
  };

  const toggleDropdown = (taskId: number) => {
    setShowDropdown(showDropdown === taskId ? null : taskId);
  };

  // Kanban functionality
  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId as TaskStatus;
    
    handleStatusChange(taskId, newStatus);
  }, [handleStatusChange]);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const getColumnTitle = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'В ожидании';
      case TaskStatus.IN_PROGRESS:
        return 'В работе';
      case TaskStatus.COMPLETED:
        return 'Завершено';
      case TaskStatus.CANCELLED:
        return 'Отменено';
      default:
        return status;
    }
  };

  const getColumnColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'border-yellow-200 bg-yellow-50';
      case TaskStatus.IN_PROGRESS:
        return 'border-blue-200 bg-blue-50';
      case TaskStatus.COMPLETED:
        return 'border-green-200 bg-green-50';
      case TaskStatus.CANCELLED:
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-gray-100 text-gray-800';
      case TaskPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'В ожидании';
      case TaskStatus.IN_PROGRESS:
        return 'В работе';
      case TaskStatus.COMPLETED:
        return 'Завершена';
      case TaskStatus.CANCELLED:
        return 'Отменена';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'Низкий';
      case TaskPriority.MEDIUM:
        return 'Средний';
      case TaskPriority.HIGH:
        return 'Высокий';
      case TaskPriority.URGENT:
        return 'Срочный';
      default:
        return priority;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Список дел</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Управление задачами и планирование</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* View Mode Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Список</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Канбан</span>
            </button>
          </div>
          <PermissionGuard module="tasks" action="create">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Новая задача</span>
              <span className="sm:hidden">Создать</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs sm:text-sm text-gray-600">Всего задач</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs sm:text-sm text-gray-600">В ожидании</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs sm:text-sm text-gray-600">В работе</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs sm:text-sm text-gray-600">Завершены</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 col-span-2 sm:col-span-1">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs sm:text-sm text-gray-600">Просрочены</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:gap-4 lg:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Поиск
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Поиск по названию или описанию..."
                className="pl-8 sm:pl-10 w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {viewMode === 'list' && (
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | '')}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="">Все статусы</option>
                <option value={TaskStatus.PENDING}>В ожидании</option>
                <option value={TaskStatus.IN_PROGRESS}>В работе</option>
                <option value={TaskStatus.COMPLETED}>Завершена</option>
                <option value={TaskStatus.CANCELLED}>Отменена</option>
              </select>
            </div>
          )}

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Приоритет
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as TaskPriority | '')}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="">Все приоритеты</option>
              <option value={TaskPriority.LOW}>Низкий</option>
              <option value={TaskPriority.MEDIUM}>Средний</option>
              <option value={TaskPriority.HIGH}>Высокий</option>
              <option value={TaskPriority.URGENT}>Срочный</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Применить</span>
            <span className="sm:hidden">Поиск</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Загрузка задач...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && tasks.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-gray-600">Задачи не найдены</p>
        </div>
      )}

      {/* List View */}
      {!loading && tasks.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div key={task.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:gap-3 mb-2">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{task.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityText(task.priority)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex flex-col space-y-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                      {task.assignee && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{task.assignee.name} {task.assignee.surname}</span>
                        </div>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>До {formatDate(new Date(task.dueDate))}</span>
                        </div>
                      )}

                      {task.category && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{task.category.name}</span>
                        </div>
                      )}

                      <span className="hidden sm:inline">Создано {formatDate(new Date(task.createdAt))}</span>
                    </div>

                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs">
                            +{task.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-2 lg:ml-4">
                    {task.status !== TaskStatus.COMPLETED && (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 bg-white min-w-0 flex-1 lg:flex-none"
                      >
                        <option value={TaskStatus.PENDING}>В ожидании</option>
                        <option value={TaskStatus.IN_PROGRESS}>В работе</option>
                        <option value={TaskStatus.COMPLETED}>Завершена</option>
                        <option value={TaskStatus.CANCELLED}>Отменена</option>
                      </select>
                    )}

                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(task.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {showDropdown === task.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <PermissionGuard module="tasks" action="update">
                              <button
                                onClick={() => handleEditTask(task)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                                Редактировать
                              </button>
                            </PermissionGuard>
                            <PermissionGuard module="tasks" action="delete">
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Удалить
                              </button>
                            </PermissionGuard>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination for List View */}
          {pagination.totalPages > 1 && (
            <div className="px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Показано {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total}
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 transition-colors hover:bg-gray-50"
                >
                  Назад
                </button>
                <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                  {pagination.page} из {pagination.totalPages}
                </span>
                <button
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 transition-colors hover:bg-gray-50"
                >
                  Далее
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kanban View */}
      {!loading && tasks.length > 0 && viewMode === 'kanban' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
            {[TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED].map((status) => (
              <div key={status} className={`bg-white rounded-lg border-2 ${getColumnColor(status)} min-h-96`}>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                    {getColumnTitle(status)}
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {getTasksByStatus(status).length}
                    </span>
                  </h3>
                </div>
                
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`p-4 space-y-3 min-h-80 ${
                        snapshot.isDraggingOver ? 'bg-gray-50' : ''
                      }`}
                    >
                      {getTasksByStatus(status).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 pr-2">
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                    <Grip className="w-4 h-4" />
                                  </div>
                                  <div className="relative">
                                    <button
                                      onClick={() => toggleDropdown(task.id)}
                                      className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                                    >
                                      <MoreVertical className="w-3 h-3" />
                                    </button>
                                    {showDropdown === task.id && (
                                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                                        <div className="py-1">
                                          <PermissionGuard module="tasks" action="update">
                                            <button
                                              onClick={() => handleEditTask(task)}
                                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                              <Edit className="w-3 h-3" />
                                              Редактировать
                                            </button>
                                          </PermissionGuard>
                                          <PermissionGuard module="tasks" action="delete">
                                            <button
                                              onClick={() => handleDeleteTask(task.id)}
                                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              Удалить
                                            </button>
                                          </PermissionGuard>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-gray-600 text-xs mb-2 line-clamp-2">{task.description}</p>
                              )}

                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                  {getPriorityText(task.priority)}
                                </span>
                              </div>

                              <div className="space-y-1 text-xs text-gray-500">
                                {task.assignee && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{task.assignee.name} {task.assignee.surname}</span>
                                  </div>
                                )}
                                {task.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    <span>До {formatDate(new Date(task.dueDate))}</span>
                                  </div>
                                )}
                                {task.category && (
                                  <div className="flex items-center gap-1">
                                    <Tag className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{task.category.name}</span>
                                  </div>
                                )}
                              </div>

                              {task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {task.tags.slice(0, 2).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {task.tags.length > 2 && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                      +{task.tags.length - 2}
                                    </span>
                                  )}
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
        </DragDropContext>
      )}

      {/* Task Form Modal */}
      <TaskForm
        isOpen={showCreateModal || editingTask !== null}
        onClose={handleCloseModal}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        categories={categories}
      />

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(null)}
        />
      )}
    </div>
  );
};

export default Tasks;
