import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronRight, FaBook, FaClock, FaCheckCircle, FaPlayCircle, FaCircle, FaCalendarAlt, FaGraduationCap, FaClipboardList, FaTasks, FaSpinner, FaEdit, FaPlus, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { KtpData, KtpSection, KtpLesson } from '../types/ktp';
import { formatDate } from '../utils';
import { ktpService } from '../services/ktpService';
import { systemService } from '../services/systemService';
import { Spinner } from './ui/Spinner';

interface KtpTreeViewProps {
  ktpId?: number;
  ktpData?: KtpData;
  canEdit?: boolean;
}

interface SectionCardProps {
  section: KtpSection;
  isExpanded: boolean;
  onToggle: () => void;
}

interface LessonCardProps {
  lesson: KtpLesson;
  lessonIndex: number;
  onLessonClick: (lesson: KtpLesson) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'in_progress':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'planned':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <FaCheckCircle className="w-4 h-4" />;
    case 'in_progress':
      return <FaPlayCircle className="w-4 h-4" />;
    case 'planned':
      return <FaCircle className="w-4 h-4" />;
    default:
      return <FaCircle className="w-4 h-4" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Завершен';
    case 'in_progress':
      return 'В процессе';
    case 'planned':
      return 'Запланирован';
    default:
      return 'Не определен';
  }
};

const LessonCard: React.FC<LessonCardProps> = ({ lesson, lessonIndex, onLessonClick }) => {
  const statusColor = getStatusColor(lesson.status);
  const statusIcon = getStatusIcon(lesson.status);
  const statusText = getStatusText(lesson.status);

  return (
    <div className={`ml-8 mb-3 p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${statusColor} hover:border-opacity-80`}>
      <div className="flex items-start justify-between">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => onLessonClick(lesson)}
        >
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-500 mr-3">#{lessonIndex}</span>
            <h4 className="font-semibold text-gray-800 flex-1">{lesson.title}</h4>
            <div className="flex items-center text-sm ml-4">
              {statusIcon}
              <span className="ml-1">{statusText}</span>
            </div>
          </div>
          
          {lesson.description && (
            <p className="text-sm text-gray-600 mb-3">{lesson.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center">
              <FaCalendarAlt className="w-3 h-3 mr-1" />
              <span>Неделя {lesson.week}</span>
            </div>
            
            <div className="flex items-center">
              <FaClock className="w-3 h-3 mr-1" />
              <span>{lesson.duration} ч.</span>
            </div>
            
            {lesson.date && (
              <div className="flex items-center">
                <FaCalendarAlt className="w-3 h-3 mr-1" />
                <span>{formatDate(lesson.date)}</span>
              </div>
            )}
            
            {lesson.materials && lesson.materials.length > 0 && (
              <div className="flex items-center">
                <FaBook className="w-3 h-3 mr-1" />
                <span>{lesson.materials.length} материал(ов)</span>
              </div>
            )}
          </div>
          
          {lesson.objectives && lesson.objectives.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                <FaGraduationCap className="w-3 h-3 mr-1" />
                Цели урока:
              </div>
              <ul className="text-xs text-gray-600 ml-4">
                {lesson.objectives.slice(0, 2).map((objective, index) => (
                  <li key={index} className="mb-1">• {objective}</li>
                ))}
                {lesson.objectives.length > 2 && (
                  <li className="text-gray-500 italic">и еще {lesson.objectives.length - 2}...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionCard: React.FC<SectionCardProps> = ({ section, isExpanded, onToggle }) => {
  const completedLessons = section.lessons.filter(lesson => lesson.status === 'completed').length;
  const inProgressLessons = section.lessons.filter(lesson => lesson.status === 'in_progress').length;
  const totalLessons = section.lessons.length;
  const progress = (completedLessons / totalLessons) * 100;

  return (
    <div className="mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1" onClick={onToggle}>
            <div className="mr-3 cursor-pointer">
              {isExpanded ? (
                <FaChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <FaChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </div>
            
            <div className="flex-1 cursor-pointer">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-gray-600 mb-3">{section.description}</p>
              )}
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaBook className="w-4 h-4 mr-1" />
                  <span>{totalLessons} уроков</span>
                </div>
                
                <div className="flex items-center">
                  <FaClock className="w-4 h-4 mr-1" />
                  <span>{section.totalHours} часов</span>
                </div>
                
                <div className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  <span>{completedLessons} завершено</span>
                </div>
                
                {inProgressLessons > 0 && (
                  <div className="flex items-center">
                    <FaPlayCircle className="w-4 h-4 mr-1 text-orange-600" />
                    <span>{inProgressLessons} в процессе</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="ml-4 flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {Math.round(progress)}% завершено
              </div>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KtpTreeView: React.FC<KtpTreeViewProps> = ({ ktpId, ktpData: initialKtpData, canEdit = false }) => {
  const [ktpData, setKtpData] = useState<KtpData | null>(initialKtpData || null);
  const [loading, setLoading] = useState(!initialKtpData);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<KtpLesson | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [showAddLessonForm, setShowAddLessonForm] = useState<number | null>(null);
  const [academicHourDuration, setAcademicHourDuration] = useState<number>(45); // минуты
  const [newSectionData, setNewSectionData] = useState({
    title: '',
    description: ''
  });
  const [newLessonData, setNewLessonData] = useState({
    title: '',
    description: '',
    duration: 2,
    week: 1,
    date: '',
    objectives: '',
    methods: 'Лекция, Практическая работа',
    materials: '',
    assessment: 'Устный опрос, практические задания',
    homework: ''
  });

  useEffect(() => {
    if (ktpId && !initialKtpData) {
      loadKtpData();
    } else if (initialKtpData) {
      setKtpData(initialKtpData);
      setExpandedSections(new Set(initialKtpData.sections.filter(section => section.expanded).map(section => section.id)));
      setLoading(false);
    }
    
    // Загружаем настройку академического часа
    loadAcademicHourDuration();
  }, [ktpId, initialKtpData]);

  const loadAcademicHourDuration = async () => {
    try {
      const result = await systemService.getAcademicHourDuration();
      setAcademicHourDuration(result.minutes);
    } catch (error) {
      console.error('Ошибка загрузки продолжительности академического часа:', error);
      // Используем стандартное значение 45 минут
      setAcademicHourDuration(45);
    }
  };

  // Функция для пересчета общих часов раздела на основе уроков
  const recalculateSectionHours = (lessons: KtpLesson[]): number => {
    return lessons.reduce((total, lesson) => total + lesson.duration, 0);
  };

  // Функция для конвертации в академические часы (если нужно)
  const convertToAcademicHours = (lessonHours: number): number => {
    // lessonHours уже в академических часах, возвращаем как есть
    return lessonHours;
  };

  const loadKtpData = async () => {
    if (!ktpId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await ktpService.getKtpById(ktpId);
      setKtpData(data);
      setExpandedSections(new Set(data.sections.filter(section => section.expanded).map(section => section.id)));
    } catch (err) {
      setError('Ошибка при загрузке КТП');
      console.error('Error loading KTP data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleLessonClick = (lesson: KtpLesson) => {
    setSelectedLesson(lesson);
  };

  const closeLessonModal = () => {
    setSelectedLesson(null);
  };

  const handleUpdateLessonStatus = async (lessonId: number, status: 'planned' | 'in_progress' | 'completed') => {
    if (!ktpData) return;

    try {
      await ktpService.updateLessonStatus(ktpData.id, lessonId, status);
      
      // Обновляем статус урока в локальном состоянии
      const updatedKtpData = {
        ...ktpData,
        sections: ktpData.sections.map(section => ({
          ...section,
          lessons: section.lessons.map(lesson =>
            lesson.id === lessonId ? { ...lesson, status } : lesson
          )
        }))
      };
      
      setKtpData(updatedKtpData);
    } catch (err) {
      console.error('Error updating lesson status:', err);
      alert('Ошибка при обновлении статуса урока');
    }
  };

  const handleEditSection = (section: KtpSection) => {
    setEditingSection(section.id);
    setEditData({
      title: section.title,
      description: section.description || '',
      totalHours: section.totalHours
    });
  };

  const handleEditLesson = (lesson: KtpLesson) => {
    setEditingLesson(lesson.id);
    setEditData({
      title: lesson.title,
      description: lesson.description || '',
      duration: lesson.duration,
      week: lesson.week,
      date: lesson.date || '',
      objectives: lesson.objectives.join('\n'),
      methods: lesson.methods.join(', '),
      materials: lesson.materials?.join(', ') || '',
      assessment: lesson.assessment || '',
      homework: lesson.homework || ''
    });
  };

  const handleSaveSection = async () => {
    if (!ktpData || !editingSection || !editData) return;

    try {
      setSaving(true);
      
      const updatedSections = ktpData.sections.map(section =>
        section.id === editingSection
          ? { ...section, ...editData }
          : section
      );

      await ktpService.updateKtp(ktpData.id, { sections: updatedSections });
      
      setKtpData({
        ...ktpData,
        sections: updatedSections
      });
      
      setEditingSection(null);
      setEditData(null);
    } catch (err) {
      console.error('Error updating section:', err);
      alert('Ошибка при сохранении раздела');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!ktpData || !editingLesson || !editData) return;

    try {
      setSaving(true);
      
      const updatedSections = ktpData.sections.map(section => {
        const updatedLessons = section.lessons.map(lesson =>
          lesson.id === editingLesson
            ? {
                ...lesson,
                title: editData.title,
                description: editData.description,
                duration: Number(editData.duration),
                week: Number(editData.week),
                date: editData.date,
                objectives: editData.objectives.split('\n').filter((obj: string) => obj.trim()),
                methods: editData.methods.split(',').map((method: string) => method.trim()).filter((method: string) => method),
                materials: editData.materials ? editData.materials.split(',').map((material: string) => material.trim()).filter((material: string) => material) : [],
                assessment: editData.assessment,
                homework: editData.homework
              }
            : lesson
        );
        
        return {
          ...section,
          lessons: updatedLessons,
          totalHours: recalculateSectionHours(updatedLessons)
        };
      });

      await ktpService.updateKtp(ktpData.id, { sections: updatedSections });
      
      setKtpData({
        ...ktpData,
        sections: updatedSections
      });
      
      setEditingLesson(null);
      setEditData(null);
    } catch (err) {
      console.error('Error updating lesson:', err);
      alert('Ошибка при сохранении урока');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditingLesson(null);
    setEditData(null);
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!ktpData || !confirm('Вы уверены, что хотите удалить этот урок?')) return;

    try {
      setSaving(true);
      
      const updatedSections = ktpData.sections.map(section => {
        const updatedLessons = section.lessons.filter(lesson => lesson.id !== lessonId);
        return {
          ...section,
          lessons: updatedLessons,
          totalHours: recalculateSectionHours(updatedLessons)
        };
      });

      await ktpService.updateKtp(ktpData.id, { sections: updatedSections });
      
      setKtpData({
        ...ktpData,
        sections: updatedSections
      });
    } catch (err) {
      console.error('Error deleting lesson:', err);
      alert('Ошибка при удалении урока');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!ktpData || !newSectionData.title.trim()) return;

    try {
      setSaving(true);
      
      const maxId = Math.max(...ktpData.sections.map(s => s.id), 0);
      const newSection = {
        id: maxId + 1,
        title: newSectionData.title,
        description: newSectionData.description,
        totalHours: 0,
        expanded: false,
        lessons: []
      };

      const updatedSections = [...ktpData.sections, newSection];
      await ktpService.updateKtp(ktpData.id, { sections: updatedSections });
      
      setKtpData({
        ...ktpData,
        sections: updatedSections
      });
      
      // Сбрасываем форму
      setNewSectionData({
        title: '',
        description: ''
      });
      setShowAddSectionForm(false);
      
      // Автоматически расширяем новый раздел
      setExpandedSections(prev => new Set([...prev, newSection.id]));
    } catch (err) {
      console.error('Error adding section:', err);
      alert('Ошибка при создании раздела');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAddSection = () => {
    setShowAddSectionForm(false);
    setNewSectionData({
      title: '',
      description: ''
    });
  };

  const handleAddLesson = async (sectionId: number) => {
    if (!ktpData || !newLessonData.title.trim()) return;

    try {
      setSaving(true);
      
      const sectionLessons = ktpData.sections.find(s => s.id === sectionId)?.lessons || [];
      const maxId = Math.max(...ktpData.sections.flatMap(s => s.lessons.map(l => l.id)), 0);
      const nextWeek = sectionLessons.length > 0 ? Math.max(...sectionLessons.map(l => l.week)) + 1 : 1;
      
      const newLesson = {
        id: maxId + 1,
        title: newLessonData.title,
        description: newLessonData.description,
        duration: newLessonData.duration,
        week: nextWeek,
        date: newLessonData.date,
        status: 'planned' as const,
        materials: newLessonData.materials ? newLessonData.materials.split(',').map(m => m.trim()).filter(m => m) : [],
        objectives: newLessonData.objectives ? newLessonData.objectives.split('\n').filter(obj => obj.trim()) : [],
        methods: newLessonData.methods ? newLessonData.methods.split(',').map(m => m.trim()).filter(m => m) : ['Лекция'],
        assessment: newLessonData.assessment,
        homework: newLessonData.homework
      };

      const updatedSections = ktpData.sections.map(section =>
        section.id === sectionId
          ? { 
              ...section, 
              lessons: [...section.lessons, newLesson],
              totalHours: recalculateSectionHours([...section.lessons, newLesson])
            }
          : section
      );

      await ktpService.updateKtp(ktpData.id, { sections: updatedSections });
      
      setKtpData({
        ...ktpData,
        sections: updatedSections
      });
      
      // Сбрасываем форму
      setNewLessonData({
        title: '',
        description: '',
        duration: 2,
        week: 1,
        date: '',
        objectives: '',
        methods: 'Лекция, Практическая работа',
        materials: '',
        assessment: 'Устный опрос, практические задания',
        homework: ''
      });
      setShowAddLessonForm(null);
    } catch (err) {
      console.error('Error adding lesson:', err);
      alert('Ошибка при создании урока');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAddLesson = () => {
    setShowAddLessonForm(null);
    setNewLessonData({
      title: '',
      description: '',
      duration: 2,
      week: 1,
      date: '',
      objectives: '',
      methods: 'Лекция, Практическая работа',
      materials: '',
      assessment: 'Устный опрос, практические задания',
      homework: ''
    });
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!ktpData) return;
    
    const section = ktpData.sections.find(s => s.id === sectionId);
    if (!section) return;

    const confirmMessage = section.lessons.length > 0 
      ? `Вы уверены, что хотите удалить раздел "${section.title}" и все ${section.lessons.length} уроков в нём?`
      : `Вы уверены, что хотите удалить раздел "${section.title}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      setSaving(true);
      
      const updatedSections = ktpData.sections.filter(s => s.id !== sectionId);
      await ktpService.updateKtp(ktpData.id, { sections: updatedSections });
      
      setKtpData({
        ...ktpData,
        sections: updatedSections
      });
      
      // Убираем раздел из развернутых
      const newExpanded = new Set(expandedSections);
      newExpanded.delete(sectionId);
      setExpandedSections(newExpanded);
    } catch (err) {
      console.error('Error deleting section:', err);
      alert('Ошибка при удалении раздела');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          {ktpId && (
            <button
              onClick={loadKtpData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Попробовать снова
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!ktpData) {
    return (
      <div className="p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <p className="text-gray-600">КТП не найден</p>
        </div>
      </div>
    );
  }

  const completedLessons = ktpData.sections.reduce((acc, section) => 
    acc + section.lessons.filter(lesson => lesson.status === 'completed').length, 0
  );
  const totalProgress = (completedLessons / ktpData.totalLessons) * 100;

  return (
    <div className="w-full">
      {/* Заголовок с информацией о КТП */}
      {ktpData.studyPlan && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {ktpData.studyPlan.name}
          </h2>
          {ktpData.studyPlan.teacher && (
            <p className="text-gray-600">
              Преподаватель: {ktpData.studyPlan.teacher.name}
            </p>
          )}
        </div>
      )}

      {/* Общая статистика */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Общий прогресс курса</h3>
          <div className="text-2xl font-bold text-indigo-600">{Math.round(totalProgress)}%</div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{ktpData.totalLessons}</div>
            <div className="text-sm text-gray-600">Всего уроков</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{ktpData.totalHours}</div>
            <div className="text-sm text-gray-600">Всего часов</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedLessons}</div>
            <div className="text-sm text-gray-600">Завершено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{ktpData.totalLessons - completedLessons}</div>
            <div className="text-sm text-gray-600">Осталось</div>
          </div>
        </div>
        
        <div className="w-full h-3 bg-white rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* Кнопка добавления нового раздела */}
      {canEdit && (
        <div className="mb-6">
          <button
            onClick={() => setShowAddSectionForm(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Добавить новый раздел
          </button>
        </div>
      )}

      {/* Форма добавления нового раздела */}
      {showAddSectionForm && (
        <div className="mb-6 bg-white border border-green-300 rounded-lg p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Новый раздел</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название раздела
              </label>
              <input
                type="text"
                value={newSectionData.title}
                onChange={(e) => setNewSectionData({ ...newSectionData, title: e.target.value })}
                placeholder="Введите название раздела"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={newSectionData.description}
                onChange={(e) => setNewSectionData({ ...newSectionData, description: e.target.value })}
                placeholder="Введите описание раздела"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">Количество часов:</span> будет рассчитано автоматически на основе добавленных уроков
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddSection}
                disabled={saving || !newSectionData.title.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                Создать раздел
              </button>
              <button
                onClick={handleCancelAddSection}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
              >
                <FaTimes />
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Дерево разделов и уроков */}
      <div className="space-y-0">
        {ktpData.sections.map((section, sectionIndex) => (
          <div key={section.id}>
            {editingSection === section.id ? (
              <div className="mb-6 bg-white border border-blue-300 rounded-lg p-5 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название раздела
                    </label>
                    <input
                      type="text"
                      value={editData?.title || ''}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={editData?.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Всего часов
                    </label>
                    <input
                      type="number"
                      value={editData?.totalHours || ''}
                      onChange={(e) => setEditData({ ...editData, totalHours: Number(e.target.value) })}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveSection}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                      Сохранить
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FaTimes />
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <SectionCard
                  section={section}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => toggleSection(section.id)}
                />
                {canEdit && (
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={() => handleEditSection(section)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Редактировать раздел"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Удалить раздел"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {expandedSections.has(section.id) && (
              <div className="mb-6 animate-fadeIn">
                {section.lessons.map((lesson, lessonIndex) => {
                  const globalLessonIndex = ktpData.sections
                    .slice(0, sectionIndex)
                    .reduce((acc, prevSection) => acc + prevSection.lessons.length, 0) + lessonIndex + 1;
                  
                  return editingLesson === lesson.id ? (
                    <div key={lesson.id} className="ml-8 mb-3 bg-white border border-blue-300 rounded-lg p-4 shadow-sm">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Название урока
                            </label>
                            <input
                              type="text"
                              value={editData?.title || ''}
                              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Длительность (часы)
                            </label>
                            <input
                              type="number"
                              value={editData?.duration || ''}
                              onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Неделя
                            </label>
                            <input
                              type="number"
                              value={editData?.week || ''}
                              onChange={(e) => setEditData({ ...editData, week: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Дата
                            </label>
                            <input
                              type="date"
                              value={editData?.date || ''}
                              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Описание
                          </label>
                          <textarea
                            value={editData?.description || ''}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Цели урока (каждая цель с новой строки)
                          </label>
                          <textarea
                            value={editData?.objectives || ''}
                            onChange={(e) => setEditData({ ...editData, objectives: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Методы обучения (через запятую)
                            </label>
                            <input
                              type="text"
                              value={editData?.methods || ''}
                              onChange={(e) => setEditData({ ...editData, methods: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Материалы (через запятую)
                            </label>
                            <input
                              type="text"
                              value={editData?.materials || ''}
                              onChange={(e) => setEditData({ ...editData, materials: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Оценивание
                            </label>
                            <textarea
                              value={editData?.assessment || ''}
                              onChange={(e) => setEditData({ ...editData, assessment: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Домашнее задание
                            </label>
                            <textarea
                              value={editData?.homework || ''}
                              onChange={(e) => setEditData({ ...editData, homework: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveLesson}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            Сохранить
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
                          >
                            <FaTimes />
                            Отмена
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 ml-auto"
                            >
                              <FaTrash />
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={lesson.id} className="relative">
                      <LessonCard
                        lesson={lesson}
                        lessonIndex={globalLessonIndex}
                        onLessonClick={handleLessonClick}
                      />
                      {canEdit && (
                        <button
                          onClick={() => handleEditLesson(lesson)}
                          className="absolute top-3 right-3 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Редактировать урок"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {/* Кнопка добавления урока в раздел */}
                {canEdit && (
                  <div className="ml-8 mb-3">
                    {showAddLessonForm === section.id ? (
                      <div className="bg-white border border-green-300 rounded-lg p-4 shadow-sm">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Новый урок</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Название урока
                              </label>
                              <input
                                type="text"
                                value={newLessonData.title}
                                onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                                placeholder="Введите название урока"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Длительность (часы)
                              </label>
                              <input
                                type="number"
                                value={newLessonData.duration}
                                onChange={(e) => setNewLessonData({ ...newLessonData, duration: Number(e.target.value) })}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Дата проведения
                              </label>
                              <input
                                type="date"
                                value={newLessonData.date}
                                onChange={(e) => setNewLessonData({ ...newLessonData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Методы обучения
                              </label>
                              <input
                                type="text"
                                value={newLessonData.methods}
                                onChange={(e) => setNewLessonData({ ...newLessonData, methods: e.target.value })}
                                placeholder="Лекция, Практическая работа"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Описание урока
                            </label>
                            <textarea
                              value={newLessonData.description}
                              onChange={(e) => setNewLessonData({ ...newLessonData, description: e.target.value })}
                              placeholder="Краткое описание урока"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Цели урока (каждая цель с новой строки)
                            </label>
                            <textarea
                              value={newLessonData.objectives}
                              onChange={(e) => setNewLessonData({ ...newLessonData, objectives: e.target.value })}
                              placeholder="Изучить основы..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Материалы урока
                              </label>
                              <input
                                type="text"
                                value={newLessonData.materials}
                                onChange={(e) => setNewLessonData({ ...newLessonData, materials: e.target.value })}
                                placeholder="Учебник, презентация"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Способ оценивания
                              </label>
                              <input
                                type="text"
                                value={newLessonData.assessment}
                                onChange={(e) => setNewLessonData({ ...newLessonData, assessment: e.target.value })}
                                placeholder="Устный опрос, тест"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Домашнее задание
                            </label>
                            <textarea
                              value={newLessonData.homework}
                              onChange={(e) => setNewLessonData({ ...newLessonData, homework: e.target.value })}
                              placeholder="Описание домашнего задания"
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddLesson(section.id)}
                              disabled={saving || !newLessonData.title.trim()}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                              Создать урок
                            </button>
                            <button
                              onClick={handleCancelAddLesson}
                              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
                            >
                              <FaTimes />
                              Отмена
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddLessonForm(section.id)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaPlus className="w-4 h-4" />
                        Добавить урок в раздел
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модальное окно с деталями урока */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fadeIn">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{selectedLesson.title}</h2>
              <button
                onClick={closeLessonModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
              {/* Статус урока с возможностью изменения */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Статус урока</h4>
                <div className="flex gap-2">
                  {['planned', 'in_progress', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateLessonStatus(selectedLesson.id, status as any)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedLesson.status === status
                          ? getStatusColor(status).replace('text-', 'bg-').replace('bg-', 'text-white bg-')
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {getStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>

              {selectedLesson.description && (
                <p className="text-gray-600 mb-4">{selectedLesson.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FaGraduationCap className="w-4 h-4 mr-2" />
                    Цели урока
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedLesson.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FaTasks className="w-4 h-4 mr-2" />
                    Методы обучения
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLesson.methods.map((method, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedLesson.materials && selectedLesson.materials.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FaBook className="w-4 h-4 mr-2" />
                    Материалы
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLesson.materials.map((material, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedLesson.assessment && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <FaClipboardList className="w-4 h-4 mr-2" />
                      Оценивание
                    </h4>
                    <p className="text-sm text-gray-600">{selectedLesson.assessment}</p>
                  </div>
                )}
                
                {selectedLesson.homework && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <FaTasks className="w-4 h-4 mr-2" />
                      Домашнее задание
                    </h4>
                    <p className="text-sm text-gray-600">{selectedLesson.homework}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KtpTreeView;
