import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { CreateClassroomDto, UpdateClassroomDto, ClassroomType, Classroom } from '../types/classroom';
import { useBuildings, useEquipmentTypes } from '../hooks/useClassrooms';
import { Spinner } from './ui/Spinner';

interface ClassroomFormProps {
  classroom?: Classroom | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClassroomDto | UpdateClassroomDto) => Promise<void>;
}

const CLASSROOM_TYPE_LABELS: Record<ClassroomType, string> = {
  LECTURE: 'Лекционная',
  PRACTICE: 'Практическая',
  COMPUTER: 'Компьютерная',
  LABORATORY: 'Лаборатория',
  OTHER: 'Другое'
};

const ClassroomForm: React.FC<ClassroomFormProps> = ({
  classroom,
  isOpen,
  onClose,
  onSubmit
}) => {
  const { buildings } = useBuildings();
  const { equipmentTypes } = useEquipmentTypes();
  
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: 1,
    capacity: 1,
    type: 'LECTURE' as ClassroomType,
    equipment: [] as string[],
    description: ''
  });
  
  const [newBuilding, setNewBuilding] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Заполнение формы при редактировании
  useEffect(() => {
    if (classroom) {
      setFormData({
        name: classroom.name,
        building: classroom.building,
        floor: classroom.floor,
        capacity: classroom.capacity,
        type: classroom.type,
        equipment: [...classroom.equipment],
        description: classroom.description || ''
      });
    } else {
      // Сброс формы при создании новой аудитории
      setFormData({
        name: '',
        building: '',
        floor: 1,
        capacity: 1,
        type: ClassroomType.LECTURE,
        equipment: [],
        description: ''
      });
    }
    setErrors({});
  }, [classroom, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (!formData.building.trim()) {
      newErrors.building = 'Здание обязательно';
    }

    if (formData.floor < 1) {
      newErrors.floor = 'Этаж должен быть больше 0';
    }

    if (formData.capacity < 1) {
      newErrors.capacity = 'Вместимость должна быть больше 0';
    }

    if (formData.capacity > 1000) {
      newErrors.capacity = 'Вместимость не может превышать 1000 мест';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        building: formData.building.trim(),
        description: formData.description.trim() || undefined
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении аудитории:', error);
      setErrors({ submit: 'Произошла ошибка при сохранении' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBuilding = () => {
    if (newBuilding.trim() && !buildings.includes(newBuilding.trim())) {
      setFormData(prev => ({ ...prev, building: newBuilding.trim() }));
      setNewBuilding('');
    }
  };

  const handleAddEquipment = () => {
    if (newEquipment.trim() && !formData.equipment.includes(newEquipment.trim())) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, newEquipment.trim()]
      }));
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  const handleEquipmentSelect = (equipment: string) => {
    if (!formData.equipment.includes(equipment)) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, equipment]
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              {classroom ? 'Редактировать аудиторию' : 'Создать аудиторию'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
              disabled={isSubmitting}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название аудитории *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Например: Аудитория 101"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Здание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Здание *
            </label>
            <div className="flex gap-2">
              <select
                value={formData.building}
                onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.building ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Выберите здание</option>
                {buildings.map(building => (
                  <option key={building} value={building}>{building}</option>
                ))}
              </select>
            </div>
            
            {/* Добавление нового здания */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newBuilding}
                onChange={(e) => setNewBuilding(e.target.value)}
                placeholder="Новое здание"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handleAddBuilding}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                disabled={!newBuilding.trim() || isSubmitting}
              >
                <FaPlus className="w-3 h-3" />
              </button>
            </div>
            
            {errors.building && (
              <p className="text-red-500 text-sm mt-1">{errors.building}</p>
            )}
          </div>

          {/* Этаж и вместимость */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Этаж *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.floor}
                onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.floor ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.floor && (
                <p className="text-red-500 text-sm mt-1">{errors.floor}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Вместимость (мест) *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.capacity ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.capacity && (
                <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
              )}
            </div>
          </div>

          {/* Тип аудитории */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип аудитории *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ClassroomType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              {Object.entries(CLASSROOM_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Оборудование */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Оборудование
            </label>
            
            {/* Существующее оборудование */}
            {equipmentTypes.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Выберите из существующего:</p>
                <div className="flex flex-wrap gap-2">
                  {equipmentTypes.map(equipment => (
                    <button
                      key={equipment}
                      type="button"
                      onClick={() => handleEquipmentSelect(equipment)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.equipment.includes(equipment)
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                      disabled={formData.equipment.includes(equipment) || isSubmitting}
                    >
                      {equipment}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Добавление нового оборудования */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                placeholder="Добавить оборудование"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handleAddEquipment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!newEquipment.trim() || isSubmitting}
              >
                <FaPlus className="w-3 h-3" />
              </button>
            </div>

            {/* Выбранное оборудование */}
            {formData.equipment.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Выбранное оборудование:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.equipment.map((equipment, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {equipment}
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(index)}
                        className="text-green-600 hover:text-green-800"
                        disabled={isSubmitting}
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Дополнительная информация об аудитории..."
              disabled={isSubmitting}
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Spinner size="sm" />}
              {classroom ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassroomForm;
