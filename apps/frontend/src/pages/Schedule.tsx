import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter as FilterIcon,
  Plus,
  X,
  Calendar,
  Table,
  FileSpreadsheet,
  Bot,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  RefreshCw,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { useAuth } from '../hooks/useAuth';
import { NavLink, useSearchParams } from 'react-router-dom';
import { Button, Loading, Modal, Autocomplete, TimePicker } from '../components/ui';
// Удалены модалки AI (перенос функционала на отдельную страницу)

// import WeekGrid from '../components/WeekGrid';
import scheduleService, { ScheduleService } from '../services/scheduleService';
import {
  ScheduleItem,
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto,
  GroupOption,
  TeacherOption,
  StudyPlanOption,
  ClassroomOption,
  ScheduleFilters
} from '../types/schedule';
import * as XLSX from 'xlsx';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleItem: Partial<ScheduleItem>, id?: string) => void;
  initialData?: Partial<ScheduleItem>;
  isEdit?: boolean;
}

interface ScheduleModalInternalProps extends ScheduleModalProps {
  groups: GroupOption[];
  teachers: TeacherOption[];
  studyPlans: StudyPlanOption[];
  classrooms: ClassroomOption[];
}

import { useTenantConfig } from '../hooks/useTenantConfig';

const ScheduleModal: React.FC<ScheduleModalInternalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isEdit = false,
  groups,
  teachers,
  studyPlans,
  classrooms
}) => {
  const { config: tenantConfig } = useTenantConfig();
  const [selectedStudyPlan, setSelectedStudyPlan] = useState<StudyPlanOption | null>(null);
  const [lessonFormat, setLessonFormat] = useState<'offline' | 'online'>('offline');

  const [formData, setFormData] = useState<Partial<ScheduleItem>>({
    id: initialData?.id || '',
    day: (initialData?.day || '') as ScheduleItem['day'],
    date: initialData?.date || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    classId: initialData?.classId || '',
    subject: initialData?.subject || '',
    teacherId: initialData?.teacherId || '',
    teacherName: initialData?.teacherName || '',
    roomId: initialData?.roomId || '',
    type: (initialData?.type || 'lesson') as ScheduleItem['type'],
    repeat: (initialData?.repeat || 'weekly') as ScheduleItem['repeat'],
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    periodPreset: initialData?.periodPreset || undefined,
    status: (initialData?.status || 'upcoming') as ScheduleItem['status']
  });

  // Обновляем данные формы при изменении initialData (для режима редактирования)
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        day: (initialData.day || '') as ScheduleItem['day'],
        date: initialData.date || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        classId: initialData.classId || '',
        subject: initialData.subject || '',
        teacherId: initialData.teacherId || '',
        teacherName: initialData.teacherName || '',
        roomId: initialData.roomId || '',
        type: (initialData.type || 'lesson') as ScheduleItem['type'],
        repeat: (initialData.repeat || 'weekly') as ScheduleItem['repeat'],
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        periodPreset: initialData.periodPreset || undefined,
        status: (initialData.status || 'upcoming') as ScheduleItem['status']
      });
      // Определяем формат и учебный план для редактирования
      if (initialData.roomId) {
        setLessonFormat('offline');
      } else {
        setLessonFormat('online');
      }
      const plan = studyPlans.find(p => p.name === initialData.subject);
      if (plan) {
        setSelectedStudyPlan(plan);
      }
    } else {
      // Сбрасываем состояние при открытии для создания
      setFormData({
        day: '' as ScheduleItem['day'],
        startTime: '',
        endTime: '',
        roomId: '',
        startDate: '',
        endDate: '',
        periodPreset: undefined
      });
      setSelectedStudyPlan(null);
      setLessonFormat('offline');
    }
  }, [initialData, isEdit, isOpen, studyPlans]);

  const handleStudyPlanSelect = (plan: StudyPlanOption | null) => {
    setSelectedStudyPlan(plan);
    if (plan) {
      // Находим преподавателя и группу по учебному плану
      // Это предположение, что в studyPlan есть teacherId и groupId
      // Если нет, эту логику нужно будет доработать
      const teacher = teachers.find(t => t.id === plan.teacherId);
      const group = groups.find(g => g.id === plan.groupId);

      setFormData(prev => ({
        ...prev,
        subject: plan.name,
        teacherId: plan.teacherId?.toString() || '',
        teacherName: teacher ? `${teacher.name} ${teacher.surname}` : '',
        classId: group?.name || '',
      }));
    }
  };

  const [duration, setDuration] = useState(50);

  const getEndTime = (startTime: string, lessonDuration: number): string => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + lessonDuration);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Убедимся, что отправляем правильные данные
    const dataToSave = { ...formData };
    if (lessonFormat === 'online') {
      dataToSave.roomId = ''; // Не отправляем ID аудитории для онлайн-уроков
    }
    onSave(dataToSave, isEdit ? formData.id : undefined);
    onClose();
  };

  if (!isOpen) return null;

  // Единая форма для создания и редактирования
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-t-xl sm:rounded-lg w-full sm:w-[500px] max-h-[95vh] sm:max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 pr-8 sm:pr-4">
            {isEdit ? 'Редактировать занятие' : 'Добавить занятие'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {/* Выбор учебного плана */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
              Учебный план (Предмет)
            </label>
            <Autocomplete
              placeholder="Выберите учебный план"
              options={studyPlans.map(p => ({ id: p.id, label: `${p.name} (${p.groupName})`, value: p.id.toString() }))}
              value={selectedStudyPlan ? { id: selectedStudyPlan.id, label: `${selectedStudyPlan.name} (${selectedStudyPlan.groupName})`, value: selectedStudyPlan.id.toString() } : null}
              onChange={(option) => {
                const plan = studyPlans.find(p => p.id.toString() === option?.value);
                handleStudyPlanSelect(plan || null);
              }}
              label="Учебный план"
              required
            />
          </div>

          {/* Информация о плане */}
          {selectedStudyPlan && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
              <div><strong>Группа:</strong> {formData.classId}</div>
              <div><strong>Преподаватель:</strong> {formData.teacherName}</div>
            </div>
          )}

          {/* Формат занятия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Формат занятия
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setLessonFormat('offline')}
                className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${lessonFormat === 'offline' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
              >
                Оффлайн
              </button>
              <button
                type="button"
                onClick={() => setLessonFormat('online')}
                className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${lessonFormat === 'online' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
              >
                Онлайн
              </button>
            </div>
          </div>

          {/* Выбор аудитории (только для оффлайн) */}
          <AnimatePresence>
            {lessonFormat === 'offline' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                  Аудитория
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={lessonFormat === 'offline'}
                >
                  <option value="">Выберите аудиторию</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.id.toString()}>
                      {classroom.name} ({classroom.building})
                    </option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          {/* День недели для повторяющихся занятий */}
          {formData.repeat !== 'once' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                День недели
              </label>
              <select
                value={formData.day || ''}
                onChange={(e) => setFormData({ ...formData, day: e.target.value as ScheduleItem['day'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Не выбрано</option>
                <option value="monday">Понедельник</option>
                <option value="tuesday">Вторник</option>
                <option value="wednesday">Среда</option>
                <option value="thursday">Четверг</option>
                <option value="friday">Пятница</option>
                <option value="saturday">Суббота</option>
                <option value="sunday">Воскресенье</option>
              </select>
            </div>
          )}

          {/* Дата проведения (только для одноразового занятия) */}
          {formData.repeat === 'once' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата проведения занятия
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  const dayOfWeek = selectedDate.getDay();
                  const dayNames: ScheduleItem['day'][] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

                  setFormData({
                    ...formData,
                    date: e.target.value,
                    day: dayNames[dayOfWeek]
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={formData.repeat === 'once'}
              />
              {formData.date && (
                <div className="text-xs text-gray-500 mt-1">
                  День недели: {
                    formData.day === 'monday' ? 'Понедельник' :
                      formData.day === 'tuesday' ? 'Вторник' :
                        formData.day === 'wednesday' ? 'Среда' :
                          formData.day === 'thursday' ? 'Четверг' :
                            formData.day === 'friday' ? 'Пятница' :
                              formData.day === 'saturday' ? 'Суббота' :
                                'Воскресенье'
                  }
                </div>
              )}
            </div>
          )}

          {/* Планирование времени и длительности */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <TimePicker
                label="Время начала"
                value={formData.startTime || ''}
                onChange={(time: string) => {
                  setFormData({
                    ...formData,
                    startTime: time,
                    endTime: getEndTime(time, duration)
                  });
                }}
                placeholder="Выберите время"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Длительность (в минутах)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => {
                const newDuration = parseInt(e.target.value, 10) || 0;
                setDuration(newDuration);
                if (formData.startTime) {
                  setFormData({
                    ...formData,
                    endTime: getEndTime(formData.startTime, newDuration)
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              step="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Регулярность
            </label>
            <select
              value={formData.repeat}
              onChange={(e) => {
                const repeat = e.target.value as ScheduleItem['repeat'];
                // Сброс периодов при смене
                setFormData(prev => ({
                  ...prev,
                  repeat,
                  ...(repeat === 'once'
                    ? { startDate: '', endDate: '', periodPreset: undefined }
                    : prev)
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Еженедельно</option>
              <option value="biweekly">Раз в две недели</option>
              <option value="once">Один раз</option>
            </select>

            {(formData.repeat === 'weekly' || formData.repeat === 'biweekly') && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Период повторения
                  </label>
                  <select
                    value={formData.periodPreset || (formData.startDate && formData.endDate ? 'custom' : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setFormData(prev => ({ ...prev, periodPreset: undefined, startDate: prev.startDate || '', endDate: prev.endDate || '' }));
                      } else if (val === '') {
                        setFormData(prev => ({ ...prev, periodPreset: undefined, startDate: '', endDate: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, periodPreset: val as any, startDate: '', endDate: '' }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Не выбрано</option>
                    {tenantConfig?.periodType === 'semester' ? (
                      <>
                        <option value="half_year_1">1 полугодие</option>
                        <option value="half_year_2">2 полугодие</option>
                        <option value="year">Учебный год</option>
                        <option value="custom">Свой диапазон</option>
                      </>
                    ) : (
                      <>
                        <option value="quarter1">1 четверть</option>
                        <option value="quarter2">2 четверть</option>
                        <option value="quarter3">3 четверть</option>
                        <option value="quarter4">4 четверть</option>
                        <option value="year">Учебный год</option>
                        <option value="custom">Свой диапазон</option>
                      </>
                    )}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    Выберите готовый период или свой диапазон дат
                  </div>
                </div>

                {!formData.periodPreset && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Начало периода
                      </label>
                      <input
                        type="date"
                        value={formData.startDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={!formData.periodPreset}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Конец периода
                      </label>
                      <input
                        type="date"
                        value={formData.endDate || ''}
                        min={formData.startDate || undefined}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={!formData.periodPreset}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Статус занятия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Статус занятия
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ScheduleItem['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="upcoming">Запланировано</option>
              <option value="completed">Проведено</option>
              <option value="cancelled">Отменено</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">
              {formData.status === 'upcoming' && '📅 Занятие запланировано'}
              {formData.status === 'completed' && '✅ Занятие проведено и засчитается в отработанные часы'}
              {formData.status === 'cancelled' && '❌ Занятие отменено и не засчитается в отработанные часы'}
            </div>
          </div>

          {/* Время окончания (автоматически) */}
          {formData.endTime && (
            <div className="text-sm text-gray-600">
              Время окончания (автоматически): {formData.endTime}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 sm:pt-6 border-t border-gray-200 sticky bottom-0 bg-white pb-4 sm:pb-0 sm:static sm:border-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={
                !selectedStudyPlan ||
                !formData.day ||
                !formData.startTime ||
                (lessonFormat === 'offline' && !formData.roomId) ||
                ((formData.repeat === 'weekly' || formData.repeat === 'biweekly') &&
                  !formData.periodPreset &&
                  !(formData.startDate && formData.endDate))
              }
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] touch-manipulation shadow-sm"
            >
              {isEdit ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DraggableScheduleItem = ({ item, canEdit, onEdit, onDelete }: { item: ScheduleItem, canEdit: boolean, onEdit: (item: ScheduleItem) => void, onDelete: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 100,
      opacity: isDragging ? 0.5 : 1,
    }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`p-2 mb-1 rounded text-xs group relative flex items-start gap-1 ${item.type === 'lesson' ? 'bg-blue-50 border-l-4 border-blue-500' :
        item.type === 'consultation' ? 'bg-green-50 border-l-4 border-green-500' :
          'bg-purple-50 border-l-4 border-purple-500'
        }`}
    >
      {/* Drag Handle */}
      {canEdit && (
        <div {...listeners} className="cursor-grab touch-none py-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Content */}
      <div className="flex-grow">
        <div className="font-semibold">{item.subject}</div>
        <div className="text-gray-600">{item.classId}</div>
        <div className="text-gray-500 flex items-center mt-1">
          <User className="h-3 w-3 mr-1" />
          {item.teacherName}
        </div>
        <div className="text-gray-500 flex items-center">
          <MapPin className="h-3 w-3 mr-1" />
          {item.roomId}
        </div>
      </div>

      {/* Action Buttons */}
      {canEdit && (
        <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="bg-white p-1 rounded-full shadow-sm hover:bg-gray-100"
          >
            <Edit className="h-3 w-3 text-gray-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="bg-white p-1 rounded-full shadow-sm hover:bg-gray-100"
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
};

const DroppableCell = ({ id, children, onAddClick }: { id: string, children: React.ReactNode, onAddClick: () => void }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`border border-gray-200 p-1 min-h-24 relative transition-colors ${isOver ? 'bg-blue-100' : 'bg-gray-50/50'}`}
      onClick={onAddClick}
    >
      {children}
    </div>
  );
};

const SchedulePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomFilter = searchParams.get('room');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'calendar'>('table');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [filters, setFilters] = useState({
    day: '',
    groupId: '',
    studyPlanId: '',
    teacherId: '',
    classroomId: roomFilter || ''
  });
  // Пагинация
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Partial<ScheduleItem> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Убраны состояния AI модалок

  // Состояние для данных фильтров
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlanOption[]>([]);
  const [isLoadingStudyPlans, setIsLoadingStudyPlans] = useState<boolean>(false);

  // Реф для дебаунса поиска учебных планов
  const studyPlanSearchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (studyPlanSearchTimeoutRef.current) {
        clearTimeout(studyPlanSearchTimeoutRef.current);
      }
    };
  }, []);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);

  const { user } = useAuth();
  const role = user?.role;

  // Загрузка фильтров из URL при первом рендере
  useEffect(() => {
    if (roomFilter) {
      setFilters(prev => ({
        ...prev,
        classroomId: roomFilter
      }));
    }

    // Загрузка других параметров из URL
    const day = searchParams.get('day');
    const groupId = searchParams.get('group');
    const teacherId = searchParams.get('teacher');
    const studyPlanId = searchParams.get('studyPlan');

    // Логируем для отладки
    if (studyPlanId) {
      console.log('Загружен ID учебного плана из URL:', studyPlanId);
    }

    setFilters(prev => ({
      ...prev,
      day: day || prev.day,
      groupId: groupId || prev.groupId,
      teacherId: teacherId || prev.teacherId,
      studyPlanId: studyPlanId || prev.studyPlanId
    }));
  }, [roomFilter, searchParams]);

  // Обновление URL при изменении фильтров
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.day) params.set('day', filters.day);
    if (filters.groupId) params.set('group', filters.groupId);
    if (filters.teacherId) params.set('teacher', filters.teacherId);
    if (filters.classroomId) params.set('room', filters.classroomId);
    if (filters.studyPlanId) params.set('studyPlan', filters.studyPlanId);

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Определяем, какие фильтры доступны для данной роли
  const getAvailableFilters = () => {
    const availableFilters = {
      day: true,        // День недели доступен всем
      studyPlan: true,  // Учебный план доступен всем
      group: false,     // По умолчанию выключено
      teacher: false,   // По умолчанию выключено
      classroom: false  // По умолчанию выключено
    };

    switch (role) {
      case 'ADMIN':
        // Администратор видит все фильтры
        availableFilters.group = true;
        availableFilters.teacher = true;
        availableFilters.classroom = true;
        break;

      case 'TEACHER':
        // Преподаватель видит фильтры по группам и кабинетам
        availableFilters.group = true;
        availableFilters.classroom = true;
        break;

      case 'STUDENT':
        // Студенту доступна фильтрация по преподавателям
        availableFilters.teacher = true;
        break;

      case 'PARENT':
        // Родителю доступна фильтрация по преподавателям
        availableFilters.teacher = true;
        break;
    }

    return availableFilters;
  };

  const availableFilters = getAvailableFilters();

  useEffect(() => {
    // Загрузка данных с API и фильтров
    loadScheduleData();
    loadFilterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сбрасываем страницу при изменении фильтров
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Перезагружаем расписание при изменении фильтров или страницы
  useEffect(() => {
    console.log('Изменились фильтры или страница, обновляем данные. Учебный план:', filters.studyPlanId);
    loadScheduleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, pageSize]);

  // При смене режима (особенно на календарь) перезапрашиваем больше данных
  useEffect(() => {
    loadScheduleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // При смене группы подгружаем учебные планы этой группы
  useEffect(() => {
    const currentGroupId = filters.groupId ? parseInt(filters.groupId, 10) : undefined;
    setIsLoadingStudyPlans(true);
    scheduleService
      .getStudyPlans({ groupId: currentGroupId, limit: 1000 })
      .then(plans => setStudyPlans(plans))
      .catch(error => console.error('Ошибка при загрузке учебных планов по группе:', error))
      .finally(() => setIsLoadingStudyPlans(false));
  }, [filters.groupId]);

  // Загрузка данных для фильтров
  const loadFilterData = async () => {
    try {
      // Если в URL или фильтрах есть ID учебного плана, нужно загрузить информацию о нем
      const studyPlanId = searchParams.get('studyPlan') || filters.studyPlanId;

      const groupIdParam = searchParams.get('group') || filters.groupId;
      const groupIdNum = groupIdParam ? parseInt(groupIdParam, 10) : undefined;

      const [groupsData, teachersData, studyPlansData, classroomsData] = await Promise.all([
        scheduleService.getGroups(),
        scheduleService.getTeachers(),
        scheduleService.getStudyPlans({ groupId: groupIdNum, limit: 1000 }),
        scheduleService.getClassrooms()
      ]);

      // Если у нас есть ID учебного плана, но нет его в списке, нужно его загрузить
      if (studyPlanId && !studyPlansData.some(plan => plan.id.toString() === studyPlanId)) {
        console.log('Загрузка детальной информации об учебном плане:', studyPlanId);
        try {
          // Тут нужно будет добавить метод для загрузки одного учебного плана по ID
          const studyPlanDetail = await scheduleService.getStudyPlanById(parseInt(studyPlanId));
          if (studyPlanDetail) {
            // Добавляем найденный учебный план к существующим
            studyPlansData.push(studyPlanDetail);
          }
        } catch (error) {
          console.error('Ошибка при загрузке детальной информации об учебном плане:', error);
        }
      }

      setGroups(groupsData);
      setTeachers(teachersData);
      setStudyPlans(studyPlansData);
      setClassrooms(classroomsData);
    } catch (error) {
      console.error('Ошибка загрузки данных фильтров:', error);
    }
  };

  const loadScheduleData = async () => {
    try {
      setIsLoading(true);

  // Для календаря и сетки загружаем много записей, чтобы охватить все дни недели
  const effectivePageSize = (viewMode === 'calendar' || viewMode === 'grid') ? 1000 : pageSize;

      const requestFilters = {
        ...(filters.groupId && { groupId: parseInt(filters.groupId) }),
        ...(filters.teacherId && { teacherId: parseInt(filters.teacherId) }),
        ...(filters.classroomId && { classroomId: parseInt(filters.classroomId) }),
        ...(filters.studyPlanId && { studyPlanId: parseInt(filters.studyPlanId) }),
        ...(filters.day && { dayOfWeek: getDayNumber(filters.day) }),
        page,
        pageSize: effectivePageSize
      };

      // Логирование для отладки
      console.log('Запрос расписания с фильтрами:', requestFilters);
      console.log('Текущий фильтр учебного плана:', filters.studyPlanId);
      console.log('Текущий режим просмотра:', viewMode, 'pageSize:', effectivePageSize);

      // Получаем расписание с учетом роли пользователя
      const response = await scheduleService.getScheduleForUser(
        user?.role || 'STUDENT',
        user?.id,
        requestFilters
      );

      // Функция нормализации: гарантируем наличие string day (monday..sunday)
      const mapNumberToDay = (n?: number | null): ScheduleItem['day'] | undefined => {
        if (!n) return undefined;
        const arr: ScheduleItem['day'][] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        return arr[n-1];
      };
      const deriveDayFromDate = (dateStr?: string | null): ScheduleItem['day'] | undefined => {
        if (!dateStr) return undefined;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return undefined;
        const weekday = d.getDay(); // 0=Sunday
        const map: Record<number, ScheduleItem['day']> = {0:'sunday',1:'monday',2:'tuesday',3:'wednesday',4:'thursday',5:'friday',6:'saturday'};
        return map[weekday];
      };
      const normalize = (items: ScheduleItem[]): ScheduleItem[] => items.map(it => ({
        ...it,
        day: it.day || mapNumberToDay((it as any).dayOfWeek) || deriveDayFromDate(it.date) || it.day
      }));

      if (Array.isArray(response)) {
        const items = response.slice(0, effectivePageSize);
  const norm = normalize(items);
  const dayStats: Record<string, number> = {};
  norm.forEach(i => { dayStats[i.day] = (dayStats[i.day] || 0) + 1; });
  console.log('Распределение занятий по дням (array response):', dayStats);
  setSchedule(norm);
        setTotal(response.length);
      } else {
        const items = response.items || [];
  const norm = normalize(items);
  const dayStats: Record<string, number> = {};
  norm.forEach(i => { dayStats[i.day] = (dayStats[i.day] || 0) + 1; });
  console.log('Распределение занятий по дням (paged response):', dayStats);
  setSchedule(norm);
        setTotal(response.total || items.length || 0);
      }
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      setSchedule([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Вспомогательная функция для конвертации дня недели в число
  const getDayNumber = (day: string): number => {
    const dayMap: { [key: string]: number } = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    };
    return dayMap[day] || 1;
  };

  // Функция проверки конфликтов расписания
  const checkScheduleConflicts = (newItem: CreateScheduleDto, existingSchedule: ScheduleItem[]): string[] => {
    const conflicts: string[] = [];

    // Конвертируем номер дня обратно в строку для сравнения
    const dayName = Object.entries({
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    }).find(([_, num]) => num === newItem.dayOfWeek)?.[0] as ScheduleItem['day'];

    // Функция для проверки пересечения времени
    const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
      const time1Start = new Date(`2000-01-01T${start1}:00`);
      const time1End = new Date(`2000-01-01T${end1}:00`);
      const time2Start = new Date(`2000-01-01T${start2}:00`);
      const time2End = new Date(`2000-01-01T${end2}:00`);

      return (time1Start < time2End && time1End > time2Start);
    };

    for (const existingItem of existingSchedule) {
      // Проверяем только занятия в тот же день
      if (existingItem.day !== dayName) continue;

      const newEndTime = newItem.endTime || getEndTime(newItem.startTime);
      const existingEndTime = existingItem.endTime || getEndTime(existingItem.startTime);

      // Проверяем пересечение времени
      if (timesOverlap(newItem.startTime, newEndTime, existingItem.startTime, existingEndTime)) {

        // Конфликт преподавателя
        if (newItem.teacherId.toString() === existingItem.teacherId) {
          conflicts.push(`Преподаватель занят в это время (${existingItem.startTime}-${existingEndTime})`);
        }

        // Конфликт аудитории
        if (newItem.classroomId && existingItem.roomId &&
          newItem.classroomId.toString() === existingItem.roomId) {
          conflicts.push(`Аудитория ${existingItem.roomId} занята в это время (${existingItem.startTime}-${existingEndTime})`);
        }

        // Конфликт группы
        if (newItem.groupId.toString() === existingItem.classId) {
          conflicts.push(`Группа ${existingItem.classId} уже имеет занятие в это время (${existingItem.startTime}-${existingEndTime})`);
        }
      }
    }

    return conflicts;
  };

  // Функция фильтрации расписания в зависимости от роли
  // Теперь фильтрация происходит на сервере, здесь просто возвращаем schedule
  const getFilteredSchedule = () => schedule;
  // Обработчик смены страницы
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Обработчик смены размера страницы
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  // Функция проверки прав на редактирование
  const canEditSchedule = () => {
    return role === 'ADMIN';
  };

  const exportToExcel = () => {
    const items = getFilteredSchedule();
    if (!items.length) return;

    const dayRu: Record<string, string> = {
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье'
    };
    const typeRu: Record<string, string> = {
      lesson: 'Урок',
      consultation: 'Консультация',
      extra: 'Доп. занятие'
    };
    const repeatRu: Record<string, string> = {
      weekly: 'Еженедельно',
      biweekly: 'Раз в 2 недели',
      once: 'Единожды'
    };
    const statusRu: Record<string, string> = {
      upcoming: 'Предстоит',
      completed: 'Завершено',
      cancelled: 'Отменено'
    };

    const rows = items.map(it => ({
      'Дата/День': it.date ? new Date(it.date).toLocaleDateString('ru-RU') : (dayRu[it.day] || ''),
      'День недели': dayRu[it.day] || '',
      'Время': `${it.startTime} - ${it.endTime}`,
      'Группа': it.classId,
      'Предмет': it.subject,
      'Преподаватель': it.teacherName,
      'Аудитория': it.roomId,
      'Тип': typeRu[it.type] || it.type,
      'Повторение': repeatRu[it.repeat] || it.repeat,
      'Статус': statusRu[it.status] || it.status
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Расписание');
    const fileName = `schedule-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleAddClick = (day?: ScheduleItem['day'], time?: string) => {
    setSelectedItem(day && time ? { day, startTime: time } : {});
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: ScheduleItem) => {
    setSelectedItem(item);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Вы действительно хотите удалить это занятие?')) {
      try {
        // Вызываем API для удаления
        await scheduleService.remove(id);

        // Обновляем локальное состояние после успешного удаления
        setSchedule(prev => prev.filter(item => item.id !== id));

        // Обновляем общее количество
        setTotal(prev => prev - 1);
      } catch (error) {
        console.error('Ошибка при удалении занятия:', error);
        alert('Ошибка при удалении занятия. Попробуйте еще раз.');
      }
    }
  };

  const handleScheduleSave = async (scheduleItem: Partial<ScheduleItem>, id?: string) => {
    try {
      if (id) {
        // Редактирование существующего занятия
        console.log('Редактирование занятия:', id, scheduleItem);

        // Создаем DTO для обновления
        const updateData: UpdateScheduleDto = {};

        if (scheduleItem.day) {
          updateData.dayOfWeek = getDayNumber(scheduleItem.day);
        }
        // Примечание: поле date не входит в UpdateScheduleDto; перенос даты делается отдельным методом rescheduleLesson
        if (scheduleItem.startTime) {
          updateData.startTime = scheduleItem.startTime;
        }
        if (scheduleItem.endTime) {
          updateData.endTime = scheduleItem.endTime;
        }
        if (scheduleItem.roomId) {
          const selectedClassroom = classrooms.find(c => c.name === scheduleItem.roomId || c.id.toString() === scheduleItem.roomId);
          if (selectedClassroom) {
            updateData.classroomId = selectedClassroom.id;
          }
        }
        if (scheduleItem.subject) {
          const selectedStudyPlan = studyPlans.find(sp => sp.name === scheduleItem.subject);
          if (selectedStudyPlan) {
            updateData.studyPlanId = selectedStudyPlan.id;
          }
        }
        if (scheduleItem.teacherId) {
          updateData.teacherId = parseInt(scheduleItem.teacherId);
        }
        if (scheduleItem.classId) {
          const selectedGroup = groups.find(g => g.name === scheduleItem.classId);
          if (selectedGroup) {
            updateData.groupId = selectedGroup.id;
          }
        }
        if (scheduleItem.repeat) {
          updateData.repeat = scheduleItem.repeat;
        }
        if (scheduleItem.periodPreset) {
          updateData.periodPreset = scheduleItem.periodPreset as any;
        } else if (scheduleItem.startDate && scheduleItem.endDate) {
          updateData.startDate = scheduleItem.startDate;
          updateData.endDate = scheduleItem.endDate;
        }

        console.log('Отправляем обновление с данными:', updateData);

        // Вызываем API для обновления
        const updatedSchedule = await scheduleService.update(id, updateData);

        // Конвертируем ответ API в формат для отображения
        const updatedScheduleItem = ScheduleService.convertToScheduleItem(updatedSchedule);

        // Обновляем локальное состояние
        setSchedule(prev => prev.map(item =>
          item.id === id ? updatedScheduleItem : item
        ));

        console.log('Занятие успешно обновлено');
      } else {
        // Создание нового занятия
        // Нужно найти реальные ID для создания через API
        const selectedGroup = groups.find(g => g.name === scheduleItem.classId);
        const selectedTeacher = teachers.find(t => t.id.toString() === scheduleItem.teacherId);
        const selectedClassroom = classrooms.find(c => c.name === scheduleItem.roomId);
        const selectedStudyPlan = studyPlans.find(sp => sp.name === scheduleItem.subject);

        if (!selectedGroup || !selectedTeacher || !selectedStudyPlan) {
          throw new Error('Не удалось найти необходимые данные для создания занятия');
        }

        // Создаем DTO для API
        const createDto: CreateScheduleDto = {
          studyPlanId: selectedStudyPlan!.id,
          groupId: selectedGroup.id,
          teacherId: selectedTeacher.id,
          classroomId: scheduleItem.roomId ? parseInt(scheduleItem.roomId, 10) : undefined,
          dayOfWeek: getDayNumber(scheduleItem.day!),
          date: scheduleItem.repeat === 'once' ? scheduleItem.date : undefined,
          startTime: scheduleItem.startTime!,
          endTime: scheduleItem.endTime || getEndTime(scheduleItem.startTime!, 50),
          repeat: scheduleItem.repeat,
          ...(scheduleItem.repeat !== 'once' && scheduleItem.periodPreset
            ? { periodPreset: scheduleItem.periodPreset as any }
            : {}),
          ...(scheduleItem.repeat !== 'once' && !scheduleItem.periodPreset && scheduleItem.startDate && scheduleItem.endDate
            ? { startDate: scheduleItem.startDate, endDate: scheduleItem.endDate }
            : {})
        };

        // Вызываем API для создания
        const createdSchedule = await scheduleService.create(createDto);

        // Конвертируем ответ API в формат для отображения
        const newScheduleItem = ScheduleService.convertToScheduleItem(createdSchedule);

        // Добавляем к существующему расписанию
        setSchedule(prev => [...prev, newScheduleItem]);
        setTotal(prev => prev + 1);
      }
    } catch (error) {
      console.error('Ошибка при сохранении расписания:', error);
      alert('Ошибка при сохранении занятия: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  // Вспомогательная функция для вычисления времени окончания
  const getEndTime = (startTime: string, duration = 60): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + duration);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedSchedule: ScheduleItem[] = jsonData.map((row: unknown) => {
          const rowData = row as Record<string, unknown>;
          const dayMapping: Record<string, ScheduleItem['day']> = {
            'понедельник': 'monday',
            'вторник': 'tuesday',
            'среда': 'wednesday',
            'четверг': 'thursday',
            'пятница': 'friday',
            'суббота': 'saturday',
            'воскресенье': 'sunday',
            'monday': 'monday',
            'tuesday': 'tuesday',
            'wednesday': 'wednesday',
            'thursday': 'thursday',
            'friday': 'friday',
            'saturday': 'saturday',
            'sunday': 'sunday'
          };

          const day = typeof rowData['День недели'] === 'string'
            ? dayMapping[rowData['День недели'].toLowerCase()] || 'monday'
            : 'monday';

          const typeMapping: Record<string, ScheduleItem['type']> = {
            'урок': 'lesson',
            'консультация': 'consultation',
            'дополнительно': 'extra',
            'lesson': 'lesson',
            'consultation': 'consultation',
            'extra': 'extra'
          };

          const type = typeof rowData['Тип занятия'] === 'string'
            ? typeMapping[rowData['Тип занятия'].toLowerCase()] || 'lesson'
            : 'lesson';

          const repeatMapping: Record<string, ScheduleItem['repeat']> = {
            'еженедельно': 'weekly',
            'раз в две недели': 'biweekly',
            'один раз': 'once',
            'weekly': 'weekly',
            'biweekly': 'biweekly',
            'once': 'once'
          };

          const repeat = typeof rowData['Повторение'] === 'string'
            ? repeatMapping[rowData['Повторение'].toLowerCase()] || 'weekly'
            : 'weekly';

          return {
            id: Math.random().toString(36).substr(2, 9),
            day,
            startTime: typeof rowData['Время начала'] === 'string' ? rowData['Время начала'] : '',
            endTime: typeof rowData['Время окончания'] === 'string' ? rowData['Время окончания'] : '',
            classId: typeof rowData['ID группы'] === 'string' || typeof rowData['ID группы'] === 'number' ? String(rowData['ID группы']) : '',
            subject: typeof rowData['Предмет'] === 'string' ? rowData['Предмет'] : '',
            teacherId: typeof rowData['ID преподавателя'] === 'string' || typeof rowData['ID преподавателя'] === 'number' ? String(rowData['ID преподавателя']) : '',
            teacherName: typeof rowData['Имя преподавателя'] === 'string' ? rowData['Имя преподавателя'] : '',
            roomId: typeof rowData['Кабинет'] === 'string' || typeof rowData['Кабинет'] === 'number' ? String(rowData['Кабинет']) : '',
            type,
            repeat,
            status: 'upcoming' as const
          };
        });

        setSchedule(importedSchedule);
      } catch (error) {
        console.error('Ошибка при импорте Excel:', error);
        alert('Произошла ошибка при импорте файла. Пожалуйста, проверьте формат файла.');
      }
    };

    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Типы для AI-генерации
  type AIItem = {
    day?: string;
    dayOfWeek?: string | number;
    startTime?: string;
    time?: string;
    endTime?: string;
    groupName?: string;
    group?: string;
    groupId?: string;
    teacherName?: string;
    teacher?: string;
    teacherId?: string;
    roomId?: string;
    room?: string;
    classroom?: string;
    classroomId?: string;
    subject?: string;
    studyPlan?: string;
    studyPlanId?: string;
    [key: string]: unknown;
  };
  interface AIGenerateResult {
    generatedSchedule?: AIItem[];
    [key: string]: unknown;
  }

  const handleAIGenerate = async (result: AIGenerateResult) => {
    console.log('AI generated schedule FULL result:', JSON.stringify(result, null, 2));

    if (result.generatedSchedule && Array.isArray(result.generatedSchedule)) {
      try {
        console.log('Начинаем сохранение AI расписания в БД...');
        console.log('Доступные группы:', groups.map(g => ({ id: g.id, name: g.name })));
        console.log('Доступные преподаватели:', teachers.map(t => ({ id: t.id, name: `${t.name} ${t.surname}` })));
        console.log('Доступные учебные планы:', studyPlans.map(sp => ({ id: sp.id, name: sp.name })));
        console.log('Доступные аудитории:', classrooms.map(c => ({ id: c.id, name: c.name })));

        // Загружаем ПОЛНОЕ расписание из БД для проверки конфликтов
        console.log('Загружаем полное расписание из БД для проверки конфликтов...');
        let fullSchedule: ScheduleItem[] = [];

        try {
          // Получаем все расписание без фильтров для проверки конфликтов
          const fullScheduleResponse = await scheduleService.getScheduleForUser(
            user?.role || 'STUDENT',
            user?.id,
            {
              page: 1,
              pageSize: 10000 // Большой размер чтобы получить все записи
            }
          );

          if (Array.isArray(fullScheduleResponse)) {
            fullSchedule = fullScheduleResponse;
          } else {
            fullSchedule = fullScheduleResponse.items || [];
          }

          console.log(`Загружено ${fullSchedule.length} существующих записей расписания для проверки конфликтов`);
          console.log('Образец существующих записей:', fullSchedule.slice(0, 3));

        } catch (error) {
          console.warn('Ошибка при загрузке полного расписания, используем текущие данные:', error);
          fullSchedule = schedule; // Fallback на текущие данные
        }

        // Сохраняем каждую запись через API
        const savedScheduleItems: ScheduleItem[] = [];
        const errors: string[] = [];

        for (let i = 0; i < result.generatedSchedule.length; i++) {
          const aiItem = result.generatedSchedule[i];
          console.log(`\n--- Обрабатываем запись ${i + 1}/${result.generatedSchedule.length} ---`);
          console.log('AI Item:', JSON.stringify(aiItem, null, 2));

          try {
            // Находим реальные ID для создания через API
            console.log('Поиск группы...');
            const selectedGroup = groups.find(g =>
              g.name === aiItem.groupName ||
              g.name === aiItem.group ||
              g.id.toString() === aiItem.groupId ||
              g.name.toLowerCase().includes((aiItem.groupName || aiItem.group || '').toLowerCase())
            );
            console.log('Найденная группа:', selectedGroup);

            console.log('Поиск преподавателя...');
            const selectedTeacher = teachers.find(t => {
              const fullName = `${t.name} ${t.surname}`;
              return fullName === aiItem.teacherName ||
                fullName === aiItem.teacher ||
                t.id.toString() === aiItem.teacherId ||
                fullName.toLowerCase().includes((aiItem.teacherName || aiItem.teacher || '').toLowerCase());
            });
            console.log('Найденный преподаватель:', selectedTeacher);

            console.log('Поиск аудитории...');
            const selectedClassroom = classrooms.find(c =>
              c.name === aiItem.roomId ||
              c.name === aiItem.room ||
              c.name === aiItem.classroom ||
              c.id.toString() === aiItem.classroomId ||
              c.name.toLowerCase().includes((aiItem.roomId || aiItem.room || aiItem.classroom || '').toLowerCase())
            );
            console.log('Найденная аудитория:', selectedClassroom);

            console.log('Поиск учебного плана...');
            const selectedStudyPlan = studyPlans.find(sp =>
              sp.name === aiItem.subject ||
              sp.name === aiItem.studyPlan ||
              sp.id.toString() === aiItem.studyPlanId ||
              sp.name.toLowerCase().includes((aiItem.subject || aiItem.studyPlan || '').toLowerCase())
            );
            console.log('Найденный учебный план:', selectedStudyPlan);

            if (!selectedGroup) {
              const errorMsg = `Группа не найдена для: ${aiItem.groupName || aiItem.group || 'undefined'}`;
              console.error(errorMsg);
              errors.push(errorMsg);
              continue;
            }

            if (!selectedTeacher) {
              const errorMsg = `Преподаватель не найден для: ${aiItem.teacherName || aiItem.teacher || 'undefined'}`;
              console.error(errorMsg);
              errors.push(errorMsg);
              continue;
            }

            if (!selectedStudyPlan) {
              const errorMsg = `Учебный план не найден для: ${aiItem.subject || aiItem.studyPlan || 'undefined'}`;
              console.error(errorMsg);
              errors.push(errorMsg);
              continue;
            }

            // Создаем DTO для API
            const dayString = (() => {
              if (typeof aiItem.dayOfWeek === 'number') {
                const names = ['', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
                return names[aiItem.dayOfWeek] || 'monday';
              }
              if (typeof aiItem.dayOfWeek === 'string' && aiItem.dayOfWeek) return aiItem.dayOfWeek;
              if (typeof aiItem.day === 'string' && aiItem.day) return aiItem.day;
              return 'monday';
            })();

            const createDto: CreateScheduleDto = {
              studyPlanId: selectedStudyPlan.id,
              groupId: selectedGroup.id,
              teacherId: selectedTeacher.id,
              classroomId: selectedClassroom?.id,
              dayOfWeek: getDayNumber(dayString),
              startTime: aiItem.startTime || aiItem.time || '09:00',
              endTime: aiItem.endTime || getEndTime(aiItem.startTime || aiItem.time || '09:00')
            };

            console.log('Создаем запись расписания с DTO:', JSON.stringify(createDto, null, 2));

            // Проверяем конфликты перед созданием
            console.log('Проверяем конфликты с полным расписанием...');
            const conflictCheckSchedule = [...fullSchedule, ...savedScheduleItems];
            console.log(`Проверяем против ${conflictCheckSchedule.length} существующих записей`);

            const conflicts = checkScheduleConflicts(createDto, conflictCheckSchedule);

            if (conflicts.length > 0) {
              const conflictMsg = `Конфликт расписания для записи ${i + 1}: ${conflicts.join(', ')}`;
              console.warn(conflictMsg);
              errors.push(conflictMsg);
              continue;
            }

            console.log('Конфликтов не найдено, создаем запись...');

            // Вызываем API для создания
            const createdSchedule = await scheduleService.create(createDto);

            // Конвертируем ответ API в формат для отображения
            const newScheduleItem = ScheduleService.convertToScheduleItem(createdSchedule);
            savedScheduleItems.push(newScheduleItem);

            console.log('Запись успешно создана:', newScheduleItem);

          } catch (error) {
            const errorMsg = `Ошибка при создании записи ${i + 1}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
            console.error(errorMsg, error);
            errors.push(errorMsg);
          }
        }

        console.log('\n--- Результаты сохранения ---');
        console.log(`Успешно сохранено: ${savedScheduleItems.length} записей`);
        console.log(`Ошибок: ${errors.length}`);
        if (errors.length > 0) {
          console.log('Список ошибок:', errors);
        }

        if (savedScheduleItems.length > 0) {
          // Добавляем сохраненные записи к существующему расписанию
          setSchedule(prev => [...prev, ...savedScheduleItems]);
          setTotal(prev => prev + savedScheduleItems.length);

          const message = errors.length > 0
            ? `Создано ${savedScheduleItems.length} записей. ${errors.length} записей пропущено из-за ошибок.`
            : `Успешно создано ${savedScheduleItems.length} записей расписания!`;

          console.log(message);
          alert(message);

          if (errors.length > 0) {
            console.warn('Детали ошибок:', errors.join('\n'));
          }
        } else {
          const errorMessage = 'Не удалось создать ни одной записи расписания.\n\nОшибки:\n' + errors.join('\n');
          console.error(errorMessage);
          alert(errorMessage);
        }

      } catch (error) {
        console.error('Критическая ошибка при сохранении AI расписания:', error);
        alert('Критическая ошибка при сохранении расписания: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
      }
    } else {
      console.error('Неверный формат результата AI:', result);
      alert('Неверный формат результата от AI. Проверьте консоль для деталей.');
    }
  };

  interface AIStudyPlanGenerateParams {
    studyPlanIds: number[];
    groupIds: number[];
    teacherIds: number[];
    startDate: string;
    endDate: string;
    constraints: {
      workingHours: { start: string; end: string };
      maxConsecutiveHours: number;
      lessonsPerDayLimit: number;
    };
  }

  const handleAIGenerateFromStudyPlans = async (params: AIStudyPlanGenerateParams) => {
    try {
      setIsLoading(true);
      // (Удалено) Закрытие AI модалки – функционал перенесен на отдельную страницу
      // Приводим к GenerationParams (добавляем обязательные поля)
      const genParams = {
        startDate: params.startDate,
        endDate: params.endDate,
        groupIds: params.groupIds,
        constraints: {
          workingHours: params.constraints.workingHours,
          maxConsecutiveHours: params.constraints.maxConsecutiveHours,
          preferredBreaks: [],
          excludeWeekends: true,
          minBreakDuration: 10
        },
        generationType: 'full' as const,
        subjectIds: params.studyPlanIds,
        teacherIds: params.teacherIds
      };
      const result = await scheduleService.generateFromStudyPlans(genParams);
      console.log('AI generated schedule from study plans:', result);
      const count = result.generatedSchedule?.length || 0;
      if (count > 0) {
        alert(`Сгенерировано (без автосохранения) занятий: ${count}. Примените через AI Flow для сохранения.`);
      } else {
        alert('AI не вернул подходящих занятий.');
      }
    } catch (error) {
      console.error('Error generating schedule from study plans:', error);
      alert('Ошибка при генерации расписания.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomClick = (roomId: string) => {
    console.log(`Выбрана аудитория ${roomId}`);
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const [selectedGridDay, setSelectedGridDay] = useState<ScheduleItem['day']>('monday');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Константы для сетки расписания (используются и на десктопе, и на мобильных)
  const gridDays: Array<{ key: ScheduleItem['day']; label: string }> = [
    { key: 'monday', label: 'Понедельник' },
    { key: 'tuesday', label: 'Вторник' },
    { key: 'wednesday', label: 'Среда' },
    { key: 'thursday', label: 'Четверг' },
    { key: 'friday', label: 'Пятница' },
  ];
  const gridTimes: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

  // Вспомогательные функции для работы со временем в сетке
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const getSlotRange = (time: string) => {
    const start = timeToMinutes(time);
    const idx = gridTimes.indexOf(time);
    const end = idx >= 0 && idx < gridTimes.length - 1 ? timeToMinutes(gridTimes[idx + 1]) : start + 60; // последний слот = +60 мин
    return { start, end };
  };

  // --- Построение набора элементов для недельной сетки ---
  const buildGridItems = () => {
    const items = getFilteredSchedule();
    if (!items.length) return [] as ScheduleItem[];

    // Границы текущей недели (понедельник-воскресенье) по локальному времени
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // 0..6 (0 = Monday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - day);
    weekStart.setHours(0,0,0,0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);

    const toUTCDateOnly = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const inWeek = (dateStr?: string) => {
      if (!dateStr) return true; // для регулярных без конкретной даты – показываем, потом отфильтруем biweekly
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      const t = toUTCDateOnly(d);
      return t >= toUTCDateOnly(weekStart) && t <= toUTCDateOnly(weekEnd);
    };

    const weekNumber = (date: Date) => {
      const firstJan = new Date(date.getFullYear(),0,1);
      const diff = date.getTime() - firstJan.getTime();
      return Math.floor(diff / (1000*60*60*24*7));
    };

    const anchorWeekCache: Record<string, number> = {};
    const getAnchorWeek = (it: ScheduleItem) => {
      if (it.id in anchorWeekCache) return anchorWeekCache[it.id];
      let anchor: Date | undefined;
      if (it.startDate) anchor = new Date(it.startDate);
      else if (it.date) anchor = new Date(it.date);
      if (!anchor || isNaN(anchor.getTime())) anchor = now; // fallback
      const w = weekNumber(anchor);
      anchorWeekCache[it.id] = w;
      return w;
    };

    const currentWeekNumber = weekNumber(weekStart);

    const map = new Map<string, ScheduleItem>();

    for (const it of items) {
      // Фильтрация по неделе для одноразовых (once) и датированных
      if (it.repeat === 'once' || it.date) {
        if (!inWeek(it.date)) continue;
      }

      // Biweekly: показываем только если чётность недели совпадает
      if (it.repeat === 'biweekly') {
        const anchorWeek = getAnchorWeek(it);
        if ((currentWeekNumber - anchorWeek) % 2 !== 0) continue; // не эта неделя
      }

      // Ключ для уникальности занятия в недельной сетке
      const key = [it.day, it.startTime, it.subject, it.classId, it.teacherId, it.roomId, it.repeat].join('|');
      if (!map.has(key)) {
        map.set(key, it);
      } else {
        // Если есть несколько одноразовых в той же ячейке текущей недели – оставляем ближайшую по дате
        const existing = map.get(key)!;
        if (it.date && existing.date) {
          const dNew = new Date(it.date).getTime();
          const dOld = new Date(existing.date).getTime();
          if (Math.abs(dNew - weekStart.getTime()) < Math.abs(dOld - weekStart.getTime())) {
            map.set(key, it);
          }
        } else if (it.date && !existing.date) {
          // Предпочитаем конкретизированную дату над шаблонной
          map.set(key, it);
        }
      }
    }
    return Array.from(map.values());
  };

  const gridItems = buildGridItems();

const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Проверяем, что перетаскивание произошло над валидной ячейкой
    if (over && active.id !== over.id) {
      // Получаем данные перетаскиваемого элемента
      const activeItem = active.data.current?.item as ScheduleItem;
      if (!activeItem) return;

      // ID ячейки, куда перетащили
      const droppableId = over.id as string;
      const [newDay, newTime] = droppableId.split('-');

      // Проверяем, что ID ячейки корректный
      if (!newDay || !newTime) {
        console.warn('Invalid drop zone:', droppableId);
        return;
      }

      // Проверяем, изменилась ли позиция
      if (activeItem.day === newDay && activeItem.startTime === newTime) {
        return; // Ничего не делаем, если позиция не изменилась
      }

      // Вычисляем новое время окончания
      const duration = new Date(`1970-01-01T${activeItem.endTime}`).getTime() - new Date(`1970-01-01T${activeItem.startTime}`).getTime();
      const newEndTime = new Date(new Date(`1970-01-01T${newTime}`).getTime() + duration).toTimeString().slice(0, 5);

      // Оптимистичное обновление UI
      setSchedule((items) =>
        items.map(item =>
          item.id === active.id
            ? { ...item, day: newDay as ScheduleItem['day'], startTime: newTime, endTime: newEndTime }
            : item
        )
      );

      try {
        await scheduleService.updateScheduleDayAndTime(active.id as string, newDay, newTime, newEndTime);
      } catch (error) {
        console.error("Failed to update schedule:", error);
        loadScheduleData();
        alert("Не удалось переместить занятие. Проверьте, нет ли конфликтов.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Загрузка расписания..." />
      </div>
    );
  }

  return (
    <>
      <div className="p-3 md:p-6 max-w-[1600px] mx-auto">
        {/* Заголовок и кнопки */}
        <div className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 leading-tight">
                {role === 'STUDENT' ? 'Моё расписание' :
                  role === 'PARENT' ? 'Расписание занятий' :
                    role === 'TEACHER' ? 'Мои занятия' :
                      'Управление расписанием'}
              </h1>
            </div>

            {/* Переключатель вида */}
            <div className="flex rounded-lg overflow-hidden border border-gray-300 shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 sm:px-4 py-2 transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center touch-manipulation ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Table className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Таблица</span>
                <span className="sm:hidden">Табл.</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 sm:px-4 py-2 transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center touch-manipulation ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Calendar className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Сетка</span>
                <span className="sm:hidden">Сетка</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 sm:px-4 py-2 transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center touch-manipulation ${viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Calendar className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Календарь</span>
                <span className="sm:hidden">Кален.</span>
              </button>
            </div>
          </div>

        {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={exportToExcel}
              disabled={getFilteredSchedule().length === 0}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center justify-center transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Экспорт в Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
            {/* Показываем кнопку AI только администратору */}
            {role === 'ADMIN' && (
              <div className="flex flex-col sm:flex-row gap-2 flex-1 sm:flex-none">
                <NavLink
                  to="/ai-schedule"
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center justify-center transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation shadow-sm"
                >
                  <Bot className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">Умная генерация расписания</span>
                  <span className="sm:hidden">Умная генерация</span>
                </NavLink>
              </div>
            )}

            {/* Кнопка обновления статусов */}
            {(role === 'ADMIN' || role === 'TEACHER') && (
              <button
                onClick={async () => {
                  try {
                    const result = await scheduleService.updateStatuses();
                    alert(`Статусы обновлены! Изменено записей: ${result.updated}`);
                    loadScheduleData();
                  } catch (error) {
                    console.error('Ошибка при обновлении статусов:', error);
                    alert('Ошибка при обновлении статусов');
                  }
                }}
                disabled={isLoading}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center transition-colors disabled:opacity-50 text-sm sm:text-base min-h-[44px] touch-manipulation shadow-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Обновить статусы</span>
                <span className="sm:hidden">Обновить</span>
              </button>
            )}

            {canEditSchedule() && (
              <button
                onClick={() => handleAddClick()}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Добавить занятие</span>
                <span className="sm:hidden">Добавить</span>
              </button>
            )}
          </div>
        </div>

        {/* Панель фильтров */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
            <h3 className="text-sm sm:text-base font-medium text-gray-700">Фильтры</h3>
            <button
              onClick={() => {
                setFilters({
                  day: '',
                  groupId: '',
                  studyPlanId: '',
                  teacherId: '',
                  classroomId: ''
                });
                setPage(1);
              }}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center sm:justify-start px-3 py-1.5 sm:px-2 sm:py-1 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors touch-manipulation"
            >
              <RefreshCw className="w-3 h-3 mr-1 flex-shrink-0" />
              <span>Сбросить все</span>
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Первая строка фильтров */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* День недели доступен всем */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
                  День недели
                </label>
                <select
                  value={filters.day}
                  onChange={(e) => setFilters({ ...filters, day: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] transition-colors"
                >
                  <option value="">Все дни</option>
                  <option value="monday">Понедельник</option>
                  <option value="tuesday">Вторник</option>
                  <option value="wednesday">Среда</option>
                  <option value="thursday">Четверг</option>
                  <option value="friday">Пятница</option>
                  <option value="saturday">Суббота</option>
                  <option value="sunday">Воскресенье</option>
                </select>
              </div>

              {/* Группа */}
              {availableFilters.group && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
                    Группа
                  </label>
                  <select
                    value={filters.groupId}
                    onChange={(e) => setFilters({ ...filters, groupId: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] transition-colors"
                  >
                    <option value="">Все группы</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id.toString()}>
                        {group.name} (класс {group.courseNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Преподаватель для админа */}
              {availableFilters.teacher && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
                    Преподаватель
                  </label>
                  <select
                    value={filters.teacherId}
                    onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] transition-colors"
                  >
                    <option value="">Все преподаватели</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id.toString()}>
                        {teacher.name} {teacher.surname}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Вторая строка фильтров */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Учебный план (предмет) */}
              {availableFilters.studyPlan && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
                    Учебный план
                  </label>
                  <Autocomplete
                    placeholder="Поиск предмета..."
                    options={studyPlans.map(plan => ({
                      id: plan.id,
                      label: plan.name.length > 40 ? `${plan.name.substring(0, 40)}...` : plan.name,
                      value: plan.id.toString()
                    }))}
                    value={filters.studyPlanId ? {
                      id: parseInt(filters.studyPlanId),
                      label: studyPlans.find(plan => plan.id.toString() === filters.studyPlanId)?.name || `План #${filters.studyPlanId}`,
                      value: filters.studyPlanId
                    } : null}
                    onChange={(option) => {
                      setFilters({
                        ...filters,
                        studyPlanId: option ? option.value.toString() : ''
                      });
                      setPage(1);
                    }}
                    onSearch={(query: string) => {
                      if (studyPlanSearchTimeoutRef.current) {
                        clearTimeout(studyPlanSearchTimeoutRef.current);
                      }

                      if (query.length >= 2) {
                        setIsLoadingStudyPlans(true);
                        studyPlanSearchTimeoutRef.current = setTimeout(() => {
                          scheduleService.searchStudyPlans(query, filters.groupId ? parseInt(filters.groupId) : undefined)
                            .then(plans => {
                              setStudyPlans(plans);
                              setIsLoadingStudyPlans(false);
                            })
                            .catch(error => {
                              console.error('Ошибка при поиске учебных планов:', error);
                              setIsLoadingStudyPlans(false);
                            });
                        }, 300);
                      } else if (query.length === 0) {
                        setIsLoadingStudyPlans(true);
                        scheduleService.getStudyPlans({ groupId: filters.groupId ? parseInt(filters.groupId) : undefined, limit: 1000 })
                          .then(plans => {
                            setStudyPlans(plans);
                            setIsLoadingStudyPlans(false);
                          })
                          .catch(error => {
                            console.error('Ошибка при загрузке учебных планов:', error);
                            setIsLoadingStudyPlans(false);
                          });
                      }
                    }}
                    isLoading={isLoadingStudyPlans}
                    className="min-h-[44px]"
                  />
                </div>
              )}

              {/* Аудитория */}
              {availableFilters.classroom && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
                    Аудитория
                  </label>
                  <select
                    value={filters.classroomId}
                    onChange={(e) => setFilters({ ...filters, classroomId: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] transition-colors"
                  >
                    <option value="">Все аудитории</option>
                    {classrooms.map(classroom => (
                      <option key={classroom.id} value={classroom.id.toString()}>
                        {classroom.name} ({classroom.building})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Статистика */}
            <div className="pt-2 sm:pt-3 border-t border-gray-100">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-right bg-gray-50 px-3 py-2 rounded-md">
                Найдено: <span className="font-medium text-gray-700">{total}</span> занятий
              </div>
            </div>
          </div>
        </div>

        {/* Таблица расписания */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200 [&_td]:!whitespace-normal [&_td]:break-words [&_td]:align-top">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата / День недели
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Время
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Группа
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Предмет
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Преподаватель
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Аудитория
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Повторение
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    {canEditSchedule() && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredSchedule().map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-900">
                        <div>
                          {item.date ? (
                            <div>
                              <div className="font-medium">{new Date(item.date).toLocaleDateString('ru-RU')}</div>
                              <div className="text-xs text-gray-500">
                                {item.day === 'monday' ? 'Понедельник' :
                                  item.day === 'tuesday' ? 'Вторник' :
                                    item.day === 'wednesday' ? 'Среда' :
                                      item.day === 'thursday' ? 'Четверг' :
                                        item.day === 'friday' ? 'Пятница' :
                                          item.day === 'saturday' ? 'Суббота' : 'Воскресенье'}
                              </div>
                            </div>
                          ) : (
                            <div>
                              {item.day === 'monday' ? 'Понедельник' :
                                item.day === 'tuesday' ? 'Вторник' :
                                  item.day === 'wednesday' ? 'Среда' :
                                    item.day === 'thursday' ? 'Четверг' :
                                      item.day === 'friday' ? 'Пятница' :
                                        item.day === 'saturday' ? 'Суббота' : 'Воскресенье'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {item.startTime} - {item.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-900">
                        {item.classId}
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-900">
                        {item.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-900">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {item.teacherName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-900">
                        <button
                          onClick={() => handleRoomClick(item.roomId)}
                          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          {item.roomId}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === 'lesson' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'consultation' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                          {item.type === 'lesson' ? 'Урок' :
                            item.type === 'consultation' ? 'Консультация' : 'Доп. занятие'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-900">
                        {item.repeat === 'weekly' ? 'Еженедельно' :
                          item.repeat === 'biweekly' ? 'Раз в 2 недели' : 'Единожды'}
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                          item.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {item.status === 'upcoming' ? 'Предстоит' :
                            item.status === 'completed' ? 'Завершено' : 'Отменено'}
                        </span>
                      </td>
                      {canEditSchedule() && (
                        <td className="px-6 py-4 whitespace-normal break-words text-sm text-right">
                          <div className="flex space-x-2 justify-end">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {getFilteredSchedule().length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Занятий не найдено</h3>
                  <p className="text-gray-500">Попробуйте изменить фильтры поиска</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {getFilteredSchedule().map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="font-semibold text-gray-900 text-base leading-tight">
                              {item.subject}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Группа: {item.classId}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            {canEditSchedule() && (
                              <>
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(item.id)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {/* Date and Time */}
                          <div className="flex items-center text-gray-700">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <div>
                              {item.date ? (
                                <div>
                                  <div className="font-medium">{new Date(item.date).toLocaleDateString('ru-RU')}</div>
                                  <div className="text-xs text-gray-500">
                                    {item.day === 'monday' ? 'Понедельник' :
                                      item.day === 'tuesday' ? 'Вторник' :
                                        item.day === 'wednesday' ? 'Среда' :
                                          item.day === 'thursday' ? 'Четверг' :
                                            item.day === 'friday' ? 'Пятница' :
                                              item.day === 'saturday' ? 'Суббота' : 'Воскресенье'}
                                  </div>
                                </div>
                              ) : (
                                <span>
                                  {item.day === 'monday' ? 'Понедельник' :
                                    item.day === 'tuesday' ? 'Вторник' :
                                      item.day === 'wednesday' ? 'Среда' :
                                        item.day === 'thursday' ? 'Четверг' :
                                          item.day === 'friday' ? 'Пятница' :
                                            item.day === 'saturday' ? 'Суббота' : 'Воскресенье'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center text-gray-700">
                            <Clock className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span>{item.startTime} - {item.endTime}</span>
                          </div>

                          <div className="flex items-center text-gray-700">
                            <User className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{item.teacherName}</span>
                          </div>

                          <div className="flex items-center text-gray-700">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <button
                              onClick={() => handleRoomClick(item.roomId)}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              {item.roomId}
                            </button>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === 'lesson' ? 'bg-blue-100 text-blue-800' :
                            item.type === 'consultation' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                            {item.type === 'lesson' ? 'Урок' :
                              item.type === 'consultation' ? 'Консультация' : 'Доп. занятие'}
                          </span>

                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.repeat === 'weekly' ? 'Еженедельно' :
                              item.repeat === 'biweekly' ? 'Раз в 2 недели' : 'Единожды'}
                          </span>

                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                            item.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {item.status === 'upcoming' ? 'Предстоит' :
                              item.status === 'completed' ? 'Завершено' : 'Отменено'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Пагинация */}
            <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm">
                  <span>Строк на странице:</span>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm min-h-[36px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[36px] transition-colors touch-manipulation"
                  >
                    Назад
                  </button>
                  <span className="text-sm font-medium px-2">
                    Страница {page} из {Math.ceil(total / pageSize) || 1}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                    className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[36px] transition-colors touch-manipulation"
                  >
                    Вперёд
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
                  Всего: <span className="font-medium">{total}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Сетка расписания */}
        {viewMode === 'grid' && (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            {/* Desktop grid */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-auto">
              <div className="p-4 overflow-auto">
                <div className="grid grid-cols-6 gap-4 min-w-[900px]">
                  <div className="col-span-1" />
                  {gridDays.map(d => (
                    <div key={d.key} className="text-center font-medium py-2 bg-gray-100 rounded">
                      {d.label}
                    </div>
                  ))}

                  {gridTimes.map((time) => (
                    <React.Fragment key={time}>
                      <div className="text-center font-medium py-2 bg-gray-50 rounded">
                        {time}
                      </div>
                      {gridDays.map(({ key: day }) => {
                        // Показываем все занятия, время начала которых попадает в диапазон текущего слота [time, nextTime)
                        const { start: slotStart, end: slotEnd } = getSlotRange(time);
                        const itemsInCell = gridItems
                          .filter((item) => {
                            if (item.day !== day) return false;
                            if (!item.startTime) return false;
                            const m = timeToMinutes(item.startTime);
                            return m >= slotStart && m < slotEnd; // попадает в часовой интервал
                          })
                          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
                        const droppableId = `${day}-${time}`;

                        return (
                          <DroppableCell
                            key={droppableId}
                            id={droppableId}
                            onAddClick={() => canEditSchedule() && handleAddClick(day as ScheduleItem['day'], time)}
                          >
                            {itemsInCell.map((item) => (
                              <DraggableScheduleItem
                                key={item.id}
                                item={item}
                                canEdit={canEditSchedule()}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                              />
                            ))}
                          </DroppableCell>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile grid (day tabs + vertical times) */}
            <div className="lg:hidden bg-white rounded-lg shadow overflow-hidden">
              <div className="p-3">
                {/* Day selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {gridDays.map(d => (
                    <button
                      key={d.key}
                      onClick={() => setSelectedGridDay(d.key)}
                      className={`px-3 py-2 rounded-md text-sm whitespace-nowrap min-h-[36px] transition-colors ${selectedGridDay === d.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Times list for selected day */}
                <div className="mt-2 space-y-2">
                  {gridTimes.map((time) => {
                    const { start: slotStart, end: slotEnd } = getSlotRange(time);
                    const itemsInCell = gridItems
                      .filter((item) => {
                        if (item.day !== selectedGridDay) return false;
                        if (!item.startTime) return false;
                        const m = timeToMinutes(item.startTime);
                        return m >= slotStart && m < slotEnd;
                      })
                      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
                    const droppableId = `${selectedGridDay}-${time}`;
                    return (
                      <div key={time} className="flex items-stretch gap-2">
                        <div className="w-14 flex items-start justify-center pt-1 text-xs text-gray-500">
                          {time}
                        </div>
                        <div className="flex-1">
                          <DroppableCell
                            id={droppableId}
                            onAddClick={() => canEditSchedule() && handleAddClick(selectedGridDay, time)}
                          >
                            {itemsInCell.map((item) => (
                              <DraggableScheduleItem
                                key={item.id}
                                item={item}
                                canEdit={canEditSchedule()}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                              />
                            ))}
                          </DroppableCell>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DndContext>
        )}

        {/* Календарный вид (месяц) */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm"
              >
                ‹
              </button>
              <div className="text-sm sm:text-base font-semibold text-gray-900">
                {currentMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
              </div>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                <div key={d} className="bg-gray-50 text-center py-2 text-xs sm:text-sm font-medium text-gray-600">
                  {d}
                </div>
              ))}
              {(() => {
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                const startWeekday = (firstDay.getDay() + 6) % 7; // 0=Mon
                const totalDays = lastDay.getDate();
                const cells: React.ReactNode[] = [];
                for (let i = 0; i < startWeekday; i++) {
                  cells.push(<div key={`empty-${i}`} className="bg-white h-24 sm:h-32" />);
                }
                for (let day = 1; day <= totalDays; day++) {
                  const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const itemsInDay = getFilteredSchedule().filter((item) => {
                    // Отображаем регулярные занятия (weekly/biweekly) и одноразовые (once)
                    const dayMap: Record<number, ScheduleItem['day']> = {
                      0: 'sunday',
                      1: 'monday',
                      2: 'tuesday',
                      3: 'wednesday',
                      4: 'thursday',
                      5: 'friday',
                      6: 'saturday',
                    };
                    const dayName = dayMap[dateObj.getDay()];
                    const sameDate = (d1: Date, d2: Date) =>
                      d1.getFullYear() === d2.getFullYear() &&
                      d1.getMonth() === d2.getMonth() &&
                      d1.getDate() === d2.getDate();
                    const hasDate = !!item.date;
                    const startDate = hasDate ? new Date(item.date as string) : undefined;

                    // Одноразовые занятия показываем только в день даты
                    if (item.repeat === 'once') {
                      return hasDate ? sameDate(new Date(item.date as string), dateObj) : false;
                    }

                    // День недели должен совпадать (если указан)
                    if (item.day && item.day !== dayName) return false;

                    // Biweekly: используем дату как якорь; если её нет — показываем каждую подходящую неделю (фолбэк)
                    if (item.repeat === 'biweekly') {
                      if (!startDate) return true;
                      const d1 = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                      const d2 = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
                      const diffDays = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
                      if (diffDays < 0) return false;
                      const weeks = Math.floor(diffDays / 7);
                      return weeks % 2 === 0;
                    }

                    // Weekly или не указан repeat: показываем каждую неделю в соответствующий день
                    if (startDate) {
                      const before =
                        Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) <
                        Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                      if (before) return false;
                    }
                    return true;
                  });
                  cells.push(
                    <div key={`day-${day}`} className="bg-white h-24 sm:h-32 p-1 sm:p-2">
                      <div className="text-xs text-gray-500 mb-1">{day}</div>
                      <div className="space-y-1 overflow-y-auto max-h-[5.5rem] sm:max-h-[7rem] pr-1">
                        {itemsInDay.map((item) => (
                          <div
                            key={item.id}
                            className="text-[10px] sm:text-xs p-1 rounded border-l-4 bg-blue-50 border-blue-400 cursor-pointer hover:bg-blue-100"
                            onClick={() => canEditSchedule() ? handleEditClick(item) : undefined}
                            title={`${item.startTime} ${item.subject} (${item.classId})`}
                          >
                            <div className="font-medium truncate">{item.subject}</div>
                            <div className="text-gray-600">{item.startTime} • {item.classId}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                const totalCells = startWeekday + totalDays;
                const trailing = (7 - (totalCells % 7)) % 7;
                for (let i = 0; i < trailing; i++) {
                  cells.push(<div key={`trail-${i}`} className="bg-white h-24 sm:h-32" />);
                }
                return cells;
              })()}
            </div>
          </div>
        )}

        {/* Модальные окна показываются только если есть права на редактирование */}
        <AnimatePresence>
          {isModalOpen && canEditSchedule() && (
            <ScheduleModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedItem(null);
              }}
              onSave={handleScheduleSave}
              initialData={selectedItem || undefined}
              isEdit={isEditMode}
              groups={groups}
              teachers={teachers}
              studyPlans={studyPlans}
              classrooms={classrooms}
            />
          )}
        </AnimatePresence>

        {/* Удалены AI модалки */}
      </div>
    </>
  );
};

export default SchedulePage;
