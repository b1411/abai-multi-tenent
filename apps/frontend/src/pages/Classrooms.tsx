import React, { useState, useMemo } from 'react';
import { FaSearch, FaBuilding, FaFilter, FaPlus, FaUsers, FaCog, FaEdit, FaTrash, FaMapMarkerAlt, FaChartBar, FaCalendarPlus } from 'react-icons/fa';
import { useClassrooms, useBuildings, useEquipmentTypes } from '../hooks/useClassrooms';
import { useAuth } from '../hooks/useAuth';
import { Classroom, ClassroomType, ClassroomFilter } from '../types/classroom';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import ClassroomForm from '../components/ClassroomForm';
import ClassroomBookingModal from '../components/ClassroomBookingModal';
import ClassroomDetailsModal from '../components/ClassroomDetailsModal';

const CLASSROOM_TYPE_LABELS: Record<ClassroomType, string> = {
  LECTURE: 'Лекционная',
  PRACTICE: 'Практическая',
  COMPUTER: 'Компьютерная',
  LABORATORY: 'Лаборатория',
  OTHER: 'Другое'
};

const CLASSROOM_TYPE_COLORS: Record<ClassroomType, string> = {
  LECTURE: 'bg-blue-100 text-blue-800',
  PRACTICE: 'bg-green-100 text-green-800',
  COMPUTER: 'bg-purple-100 text-purple-800',
  LABORATORY: 'bg-orange-100 text-orange-800',
  OTHER: 'bg-gray-100 text-gray-800'
};

const Classrooms: React.FC = () => {
  const { user } = useAuth();
const { classrooms, loading, error, deleteClassroom, createClassroom, updateClassroom, fetchClassrooms } = useClassrooms();
  const { buildings } = useBuildings();
  const { equipmentTypes } = useEquipmentTypes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ClassroomType | ''>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [minCapacity, setMinCapacity] = useState<string>('');
  const [maxCapacity, setMaxCapacity] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
const [showBookingModal, setShowBookingModal] = useState(false);
const [detailsClassroomId, setDetailsClassroomId] = useState<number | null>(null);

  // Фильтрация аудиторий
  const filteredClassrooms = useMemo(() => {
    const filter: ClassroomFilter = {
      building: selectedBuilding || undefined,
      type: selectedType || undefined,
      minCapacity: minCapacity ? parseInt(minCapacity) : undefined,
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
      equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
    };

    let filtered = classrooms.filter(classroom => {
      // Поиск по названию, зданию или описанию
      const matchesSearch = !searchQuery ||
        classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classroom.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (classroom.description && classroom.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });

    // Применяем фильтры
    if (filter.building) {
      filtered = filtered.filter(c => c.building === filter.building);
    }
    if (filter.type) {
      filtered = filtered.filter(c => c.type === filter.type);
    }
    if (filter.minCapacity) {
      filtered = filtered.filter(c => c.capacity >= filter.minCapacity!);
    }
    if (filter.maxCapacity) {
      filtered = filtered.filter(c => c.capacity <= filter.maxCapacity!);
    }
    if (filter.equipment && filter.equipment.length > 0) {
      filtered = filtered.filter(c =>
        filter.equipment!.every(eq => c.equipment.includes(eq))
      );
    }

    return filtered;
  }, [classrooms, searchQuery, selectedBuilding, selectedType, selectedEquipment, minCapacity, maxCapacity]);

  const handleEquipmentToggle = (equipment: string) => {
    setSelectedEquipment(prev =>
      prev.includes(equipment)
        ? prev.filter(eq => eq !== equipment)
        : [...prev, equipment]
    );
  };

  const handleDeleteClassroom = async (id: number) => {
    try {
      await deleteClassroom(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Ошибка при удалении аудитории:', error);
    }
  };

  const handleCreateClassroom = async (data: any) => {
    await createClassroom(data);
  };

  const handleUpdateClassroom = async (data: any) => {
    if (selectedClassroom) {
      await updateClassroom(selectedClassroom.id, data);
    }
  };

  const handleCloseForm = () => {
    setShowCreateModal(false);
    setSelectedClassroom(null);
  };

  const canManageClassrooms = user?.role === 'ADMIN' || user?.role === 'HR';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error" message={error} />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              Аудитории
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Управление аудиториями учебного заведения
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md order-3 sm:order-1">
              <FaBuilding className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Всего: {filteredClassrooms.length}</span>
            </div>
            
            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] touch-manipulation order-2 sm:order-2 shadow-sm"
            >
              <FaCalendarPlus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Бронирование аудитории</span>
              <span className="sm:hidden">Бронировать</span>
            </button>
            
            {canManageClassrooms && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] touch-manipulation order-1 sm:order-3 shadow-sm"
              >
                <FaPlus className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Добавить аудиторию</span>
                <span className="sm:hidden">Добавить</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 flex-shrink-0" />
              <input
                type="text"
                placeholder="Поиск по названию, зданию или описанию..."
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] touch-manipulation ${showFilters
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <FaFilter className="w-4 h-4 flex-shrink-0" />
            <span>Фильтры</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Первая строка фильтров */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Фильтр по зданию */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
                    Здание
                  </label>
                  <select
                    value={selectedBuilding}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] transition-colors"
                  >
                    <option value="">Все здания</option>
                    {buildings.map(building => (
                      <option key={building} value={building}>{building}</option>
                    ))}
                  </select>
                </div>

                {/* Фильтр по типу */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
                    Тип аудитории
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as ClassroomType | '')}
                    className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] transition-colors"
                  >
                    <option value="">Все типы</option>
                    {Object.entries(CLASSROOM_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Фильтр по вместимости */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
                    Мин. вместимость
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minCapacity}
                    onChange={(e) => setMinCapacity(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
                    Макс. вместимость
                  </label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] transition-colors"
                  />
                </div>
              </div>

              {/* Фильтр по оборудованию */}
              {equipmentTypes.length > 0 && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-2">
                    Оборудование
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {equipmentTypes.map(equipment => (
                      <button
                        key={equipment}
                        onClick={() => handleEquipmentToggle(equipment)}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors min-h-[36px] touch-manipulation ${selectedEquipment.includes(equipment)
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                          }`}
                      >
                        {equipment}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Сброс фильтров */}
              <div className="flex justify-center sm:justify-end pt-2 sm:pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedBuilding('');
                    setSelectedType('');
                    setSelectedEquipment([]);
                    setMinCapacity('');
                    setMaxCapacity('');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm sm:text-base px-4 py-2 rounded-md hover:bg-blue-50 transition-colors min-h-[40px] touch-manipulation"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Список аудиторий */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredClassrooms.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <FaBuilding className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              Аудитории не найдены
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              Попробуйте изменить фильтры поиска
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6">
            {filteredClassrooms.map((classroom) => (
<div
                key={classroom.id}
                onClick={() => setDetailsClassroomId(classroom.id)}
                className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="p-4 sm:p-5 md:p-6">
                  {/* Заголовок */}
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 leading-tight truncate">
                        {classroom.name}
                      </h3>
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <FaMapMarkerAlt className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {classroom.building}, {classroom.floor} этаж
                        </span>
                      </div>
                    </div>
                    {canManageClassrooms && (
                      <div className="flex gap-1 ml-2">
<button
                          onClick={(e) => { e.stopPropagation(); setSelectedClassroom(classroom); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] touch-manipulation flex items-center justify-center"
                        >
                          <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
<button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(classroom.id); }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] touch-manipulation flex items-center justify-center"
                        >
                          <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Тип и вместимость */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${CLASSROOM_TYPE_COLORS[classroom.type]
                      }`}>
                      {CLASSROOM_TYPE_LABELS[classroom.type]}
                    </span>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <FaUsers className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>{classroom.capacity} мест</span>
                    </div>
                  </div>

                  {/* Оборудование */}
                  {classroom.equipment.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2">
                        <FaCog className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span>Оборудование:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {classroom.equipment.slice(0, 3).map((eq, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {eq.length > 15 ? `${eq.substring(0, 15)}...` : eq}
                          </span>
                        ))}
                        {classroom.equipment.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                            +{classroom.equipment.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Описание */}
                  {classroom.description && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {classroom.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md animate-slide-up sm:animate-none">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Удалить аудиторию?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                Это действие нельзя отменить. Аудитория будет удалена навсегда.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation order-2 sm:order-1"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleDeleteClassroom(showDeleteConfirm)}
                  className="flex-1 px-4 py-2.5 sm:py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation order-1 sm:order-2"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Форма создания/редактирования аудитории */}
      <ClassroomForm
        classroom={selectedClassroom}
        isOpen={showCreateModal || selectedClassroom !== null}
        onClose={handleCloseForm}
        onSubmit={selectedClassroom ? handleUpdateClassroom : handleCreateClassroom}
      />

      {/* Модальное окно бронирования аудитории */}
<ClassroomBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        classrooms={classrooms}
      />
      <ClassroomDetailsModal
        isOpen={detailsClassroomId !== null}
        classroomId={detailsClassroomId}
        onClose={() => setDetailsClassroomId(null)}
        onUpdated={fetchClassrooms}
      />
    </div>
  );
};

export default Classrooms;
