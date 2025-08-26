import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, Users, User, FileText } from 'lucide-react';
import { StudyPlan, Group, Teacher } from '../types/studyPlan';
import { useAvailableData } from '../hooks/useStudyPlans';

export interface StudyPlanFormData {
  name: string;
  description?: string;
  teacherId?: number;
  groupIds: number[];
  normativeWorkload?: number;
}

interface StudyPlanFormProps {
  studyPlan?: StudyPlan;
  onSubmit: (data: StudyPlanFormData) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const StudyPlanForm: React.FC<StudyPlanFormProps> = ({
  studyPlan,
  onSubmit,
  onClose,
  loading = false
}) => {
  const [formData, setFormData] = useState<StudyPlanFormData>({
    name: studyPlan?.name || '',
    description: studyPlan?.description || '',
    teacherId: studyPlan?.teacherId || undefined,
    groupIds: studyPlan?.group?.map(g => g.id) || [],
    normativeWorkload: undefined
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const { groups, teachers, loading: dataLoading } = useAvailableData();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название учебного плана обязательно';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Название не может быть длиннее 255 символов';
    }

    if (!formData.teacherId) {
      newErrors.teacherId = 'Выберите преподавателя';
    }

    if (formData.groupIds.length === 0) {
      newErrors.groupIds = 'Выберите хотя бы одну группу';
    }

    if (formData.normativeWorkload && formData.normativeWorkload <= 0) {
      newErrors.normativeWorkload = 'Нормативная нагрузка должна быть положительным числом';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Ошибка сохранения учебного плана:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof StudyPlanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Очищаем ошибку для этого поля при изменении
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleGroupToggle = (groupId: number) => {
    setFormData(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId]
    }));
    
    if (errors.groupIds) {
      setErrors(prev => ({ ...prev, groupIds: '' }));
    }
  };

  const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
  const selectedGroups = groups.filter(g => formData.groupIds.includes(g.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {studyPlan ? 'Редактировать учебный план' : 'Создать учебный план'}
          </h3>
          <button
            onClick={onClose}
            disabled={loading || submitting}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {dataLoading && (
          <div className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Загрузка данных...</span>
            </div>
          </div>
        )}

        {!dataLoading && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Название учебного плана */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название учебного плана *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Введите название учебного плана"
                  className={`w-full border rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  disabled={loading || submitting}
                  maxLength={255}
                />
                <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Например: "Математика - 10 класс", "Физика углубленная"
              </p>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Краткое описание учебного плана"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || submitting}
                />
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Опишите цели и особенности данного учебного плана
              </p>
            </div>

            {/* Преподаватель */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Преподаватель *
              </label>
              <div className="relative">
                <select
                  value={formData.teacherId || ''}
                  onChange={(e) => handleChange('teacherId', e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full border rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.teacherId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  disabled={loading || submitting}
                >
                  <option value="">Выберите преподавателя</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.surname} {teacher.middlename && `${teacher.middlename}`}
                      {teacher.email && ` (${teacher.email})`}
                    </option>
                  ))}
                </select>
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              {errors.teacherId && (
                <p className="text-red-500 text-xs mt-1">{errors.teacherId}</p>
              )}
              {selectedTeacher && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <span className="text-blue-800 font-medium">Выбран:</span> {selectedTeacher.name} {selectedTeacher.surname}
                  {selectedTeacher.email && <span className="text-blue-600 ml-2">({selectedTeacher.email})</span>}
                </div>
              )}
            </div>

            {/* Группы */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Группы *
              </label>
              <div className={`border rounded-md p-3 ${errors.groupIds ? 'border-red-500' : 'border-gray-300'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {groups.length === 0 ? (
                    <p className="text-gray-500 text-sm">Группы не найдены</p>
                  ) : (
                    groups.map(group => (
                      <label
                        key={group.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.groupIds.includes(group.id)}
                          onChange={() => handleGroupToggle(group.id)}
                          disabled={loading || submitting}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {group.name}
                            {group.courseNumber !== undefined && (
                              <span className="ml-1 text-gray-500">({group.courseNumber} курс)</span>
                            )}
                          </div>
                          {group.description && (
                            <div className="text-xs text-gray-500">{group.description}</div>
                          )}
                          {group.studentsCount !== undefined && (
                            <div className="text-xs text-gray-500">
                              Студентов: {group.studentsCount}
                            </div>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
              {errors.groupIds && (
                <p className="text-red-500 text-xs mt-1">{errors.groupIds}</p>
              )}
              {selectedGroups.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <span className="text-green-800 font-medium">Выбрано групп: {selectedGroups.length}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                        {selectedGroups.map(group => (
                          <span
                            key={group.id}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            {group.name}{group.courseNumber !== undefined && ` (${group.courseNumber} курс)`}
                          </span>
                        ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Выберите группы, для которых предназначен этот учебный план
              </p>
            </div>

            {/* Нормативная нагрузка */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Нормативная нагрузка (часы)
              </label>
              <input
                type="number"
                value={formData.normativeWorkload || ''}
                onChange={(e) => handleChange('normativeWorkload', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Введите количество часов"
                min="1"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.normativeWorkload ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading || submitting}
              />
              {errors.normativeWorkload && (
                <p className="text-red-500 text-xs mt-1">{errors.normativeWorkload}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Общее количество учебных часов по плану (необязательно)
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || submitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || submitting || !formData.name || !formData.teacherId || formData.groupIds.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {studyPlan ? 'Обновить' : 'Создать'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudyPlanForm;
