import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  Download,
  Edit,
  Trash2,
  BookOpen,
  ExternalLink,
  HelpCircle,
  Video
} from 'lucide-react';
import { Button, Loading, Modal } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils';
import { Lesson, Materials, StudyPlan } from '../types/lesson';
import { lessonService } from '../services/lessonService';
import { studyPlanService } from '../services/studyPlanService';
import { materialService, Material } from '../services/materialService';

const LessonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<Material | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadLesson();
      loadStudyPlans();
    }
  }, [id]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [lessonData, materialsData] = await Promise.all([
        lessonService.getLesson(parseInt(id!)),
        materialService.getMaterialsByLesson(parseInt(id!)).catch(() => null) // Игнорируем ошибку если материалов нет
      ]);
      
      setLesson(lessonData);
      
      // Устанавливаем материалы если они есть
      setMaterials(materialsData as Material | null);
    } catch (error) {
      console.error('Ошибка загрузки урока:', error);
      setError('Не удалось загрузить данные урока');
    } finally {
      setLoading(false);
    }
  };

  const loadStudyPlans = async () => {
    try {
      const response = await studyPlanService.getStudyPlans();
      const convertedPlans: StudyPlan[] = response.data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        teacherId: plan.teacherId,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        teacher: plan.teacher,
        group: plan.group,
        lessons: plan.lessons?.map(lesson => ({
          id: lesson.id,
          name: lesson.name,
          date: lesson.date,
          studyPlanId: lesson.studyPlanId || 0,
          createdAt: lesson.createdAt || '',
          updatedAt: lesson.updatedAt || '',
          description: lesson.description
        })),
        _count: plan._count
      }));
      setStudyPlans(convertedPlans);
    } catch (error) {
      console.error('Ошибка загрузки учебных планов:', error);
    }
  };

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (formData: any) => {
    if (!lesson) return;
    
    try {
      setSaving(true);
      await lessonService.updateLesson(lesson.id, formData);
      setEditModalOpen(false);
      await loadLesson(); // Перезагружаем данные урока
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lesson) return;
    
    try {
      await lessonService.deleteLesson(lesson.id);
      navigate('/lessons');
    } catch (error) {
      console.error('Ошибка при удалении урока:', error);
    }
  };

  const handleDownloadMaterial = (material: Materials) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Загрузка урока..." />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Урок не найден'}</p>
          <Button
            variant="outline"
            onClick={() => navigate('/lessons')}
            className="mt-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к урокам
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = hasRole('ADMIN') || (hasRole('TEACHER') && lesson.studyPlan?.teacher?.user?.id === user?.id);
  const canDelete = hasRole('ADMIN');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/lessons')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.name}</h1>
            <p className="text-gray-500 mt-1">
              Детали урока
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Основная информация
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Дата</p>
                  <p className="text-gray-900">{formatDate(lesson.date)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Время</p>
                  <p className="text-gray-900">{formatDateTime(lesson.date)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Учебный план</p>
                  <p className="text-gray-900">{lesson.studyPlan?.name || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Результаты</p>
                  <p className="text-gray-900">{lesson._count?.LessonResult || 0} студентов</p>
                </div>
              </div>
            </div>

            {lesson.description && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Описание</h3>
                <p className="text-gray-900 leading-relaxed">{lesson.description}</p>
              </div>
            )}
          </div>

          {/* Materials */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Материалы урока
              </h2>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/lessons/${id}/materials`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Управление материалами
                </Button>
              )}
            </div>
            {materials ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Lecture */}
                  <div className={`flex items-center p-3 rounded-lg border ${materials?.lecture ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <FileText className={`h-5 w-5 mr-3 ${materials?.lecture ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`font-medium ${materials?.lecture ? 'text-green-900' : 'text-gray-500'}`}>
                        Лекция
                      </p>
                      <p className={`text-xs ${materials?.lecture ? 'text-green-700' : 'text-gray-400'}`}>
                        {materials?.lecture ? 'Доступна' : 'Не добавлена'}
                      </p>
                    </div>
                  </div>

                  {/* Video */}
                  <div className={`flex items-center p-3 rounded-lg border ${materials?.videoUrl ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <Video className={`h-5 w-5 mr-3 ${materials?.videoUrl ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`font-medium ${materials?.videoUrl ? 'text-green-900' : 'text-gray-500'}`}>
                        Видео
                      </p>
                      <p className={`text-xs ${materials?.videoUrl ? 'text-green-700' : 'text-gray-400'}`}>
                        {materials?.videoUrl ? 'Доступно' : 'Не добавлено'}
                      </p>
                    </div>
                  </div>

                  {/* Presentation */}
                  <div className={`flex items-center p-3 rounded-lg border ${materials?.presentationUrl ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <FileText className={`h-5 w-5 mr-3 ${materials?.presentationUrl ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`font-medium ${materials?.presentationUrl ? 'text-green-900' : 'text-gray-500'}`}>
                        Презентация
                      </p>
                      <p className={`text-xs ${materials?.presentationUrl ? 'text-green-700' : 'text-gray-400'}`}>
                        {materials?.presentationUrl ? 'Доступна' : 'Не добавлена'}
                      </p>
                    </div>
                  </div>

                  {/* Quiz */}
                  <div className={`flex items-center p-3 rounded-lg border ${materials?.quiz ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <HelpCircle className={`h-5 w-5 mr-3 ${materials?.quiz ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`font-medium ${materials?.quiz ? 'text-green-900' : 'text-gray-500'}`}>
                        Тест
                      </p>
                      <p className={`text-xs ${materials?.quiz ? 'text-green-700' : 'text-gray-400'}`}>
                        {materials?.quiz ? `${materials?.quiz?.questions?.length || 0} вопросов` : 'Не добавлен'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/lessons/${id}/materials`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Просмотреть все материалы
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет материалов</h3>
                <p className="text-gray-500 mb-4">Материалы для этого урока еще не добавлены</p>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/lessons/${id}/materials`)}
                  >
                    Добавить материалы
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Homework */}
          {lesson.homework && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Домашнее задание
              </h2>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900">{lesson.homework.name}</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Срок сдачи: {formatDateTime(lesson.homework.deadline)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Создано: {formatDate(lesson.homework.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => lesson.homework && navigate(`/homework?id=${lesson.homework.id}`)}
                    className="ml-4"
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Открыть
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Study Plan Info */}
          {lesson.studyPlan && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Учебный план
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Название</p>
                  <p className="text-gray-900">{lesson.studyPlan.name}</p>
                </div>
                
                {lesson.studyPlan.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Описание</p>
                    <p className="text-gray-900 text-sm">{lesson.studyPlan.description}</p>
                  </div>
                )}
                
                {lesson.studyPlan.teacher?.user && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Преподаватель</p>
                    <p className="text-gray-900">
                      {lesson.studyPlan.teacher.user.name} {lesson.studyPlan.teacher.user.surname}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Быстрые действия
            </h3>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/lessons/${id}/results`)}
              >
                <Users className="h-4 w-4 mr-2" />
                Результаты студентов
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/homework?lessonId=${id}`)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Домашние задания
              </Button>
              
              {canEdit && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/lessons/${id}/materials`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Управление материалами
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold">
                Редактировать урок
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <LessonEditForm
                lesson={lesson}
                studyPlans={studyPlans}
                onSave={handleSaveEdit}
                onClose={() => setEditModalOpen(false)}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Подтверждение удаления"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Вы уверены, что хотите удалить урок "{lesson.name}"?
          </p>
          <p className="text-sm text-gray-500">
            Это действие нельзя отменить. Все связанные данные также будут удалены.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Edit Form Component
const LessonEditForm: React.FC<{
  lesson: Lesson;
  studyPlans: StudyPlan[];
  onSave: (data: any) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ lesson, studyPlans, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState({
    name: lesson.name || '',
    date: lesson.date ? new Date(lesson.date).toISOString().slice(0, 16) : '',
    studyPlanId: lesson.studyPlanId?.toString() || '',
    description: lesson.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.studyPlanId) return;

    onSave({
      name: formData.name,
      date: new Date(formData.date).toISOString(),
      studyPlanId: parseInt(formData.studyPlanId),
      description: formData.description
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Название *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Введите название урока"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Дата и время *
        </label>
        <input
          type="datetime-local"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Учебный план *
        </label>
        <select
          value={formData.studyPlanId}
          onChange={(e) => setFormData({ ...formData, studyPlanId: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Выберите учебный план</option>
          {studyPlans.map(plan => (
            <option key={plan.id} value={plan.id.toString()}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Введите описание урока"
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={!formData.name || !formData.date || !formData.studyPlanId || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
};

export default LessonDetailPage;
