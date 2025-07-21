import React, { useState, useMemo } from 'react';
import { FaSearch, FaBuilding, FaFilter, FaPlus, FaUsers, FaCog, FaEdit, FaTrash, FaMapMarkerAlt, FaChartBar } from 'react-icons/fa';
import { useClassrooms, useBuildings, useEquipmentTypes } from '../hooks/useClassrooms';
import { useAuth } from '../hooks/useAuth';
import { Classroom, ClassroomType, ClassroomFilter } from '../types/classroom';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import ClassroomForm from '../components/ClassroomForm';

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
  const { classrooms, loading, error, deleteClassroom, createClassroom, updateClassroom } = useClassrooms();
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Аудитории</h1>
          <p className="text-gray-600 mt-1">Управление аудиториями учебного заведения</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaBuilding className="w-4 h-4" />
            <span>Всего: {filteredClassrooms.length}</span>
          </div>
          {canManageClassrooms && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Добавить аудиторию
            </button>
          )}
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по названию, зданию или описанию..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaFilter className="w-4 h-4" />
            Фильтры
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Фильтр по зданию */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Здание</label>
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Все здания</option>
                  {buildings.map(building => (
                    <option key={building} value={building}>{building}</option>
                  ))}
                </select>
              </div>

              {/* Фильтр по типу */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип аудитории</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ClassroomType | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Все типы</option>
                  {Object.entries(CLASSROOM_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Фильтр по вместимости */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Мин. вместимость</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Макс. вместимость</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Фильтр по оборудованию */}
            {equipmentTypes.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Оборудование</label>
                <div className="flex flex-wrap gap-2">
                  {equipmentTypes.map(equipment => (
                    <button
                      key={equipment}
                      onClick={() => handleEquipmentToggle(equipment)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedEquipment.includes(equipment)
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
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedBuilding('');
                  setSelectedType('');
                  setSelectedEquipment([]);
                  setMinCapacity('');
                  setMaxCapacity('');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Список аудиторий */}
      <div className="bg-white rounded-lg shadow-md">
        {filteredClassrooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaBuilding className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Аудитории не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredClassrooms.map((classroom) => (
              <div
                key={classroom.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  {/* Заголовок */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {classroom.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaMapMarkerAlt className="w-3 h-3 mr-1" />
                        {classroom.building}, {classroom.floor} этаж
                      </div>
                    </div>
                    {canManageClassrooms && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedClassroom(classroom)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(classroom.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Тип и вместимость */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      CLASSROOM_TYPE_COLORS[classroom.type]
                    }`}>
                      {CLASSROOM_TYPE_LABELS[classroom.type]}
                    </span>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUsers className="w-3 h-3 mr-1" />
                      {classroom.capacity} мест
                    </div>
                  </div>

                  {/* Оборудование */}
                  {classroom.equipment.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <FaCog className="w-3 h-3 mr-1" />
                        Оборудование:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {classroom.equipment.slice(0, 3).map((eq, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {eq}
                          </span>
                        ))}
                        {classroom.equipment.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{classroom.equipment.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Описание */}
                  {classroom.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Удалить аудиторию?
              </h3>
              <p className="text-gray-600 mb-6">
                Это действие нельзя отменить. Аудитория будет удалена навсегда.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleDeleteClassroom(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
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
    </div>
  );
};

export default Classrooms;
