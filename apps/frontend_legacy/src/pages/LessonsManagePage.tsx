import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaPlay, FaFileAlt, FaQuestionCircle, FaSave, FaTimes, FaCog, FaUpload, FaVideo, FaImage } from 'react-icons/fa';
import { useAuth } from '../providers/AuthProvider';
import { lessonsService, studyPlansService, Lesson, CreateLessonDto, UpdateLessonDto, StudyPlan } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const LessonsManagePage: React.FC = () => {
  const { studyPlanId } = useParams<{ studyPlanId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Форма для создания/редактирования урока
  const [formData, setFormData] = useState<CreateLessonDto>({
    name: '',
    description: '',
    date: '',
    studyPlanId: parseInt(studyPlanId || '0'),
  });

  // Загрузка данных
  useEffect(() => {
    if (studyPlanId) {
      loadData();
    }
  }, [studyPlanId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [planData, lessonsData] = await Promise.all([
        studyPlansService.getById(parseInt(studyPlanId!)),
        lessonsService.getByStudyPlan(parseInt(studyPlanId!))
      ]);

      setStudyPlan(planData);
      setLessons(lessonsData);

      // Проверяем права доступа
      if (user?.role === 'TEACHER' && planData.teacher?.user.id !== user.id) {
        setError('У вас нет прав для редактирования этого учебного плана');
        return;
      }
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Создание урока
  const handleCreateLesson = async () => {
    try {
      setLoading(true);
      const newLesson = await lessonsService.create(formData);
      setLessons([...lessons, newLesson]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError('Ошибка при создании урока');
      console.error('Error creating lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  // Редактирование урока
  const handleEditLesson = async () => {
    if (!editingLesson) return;

    try {
      setLoading(true);
      const updatedLesson = await lessonsService.update(editingLesson.id, formData);
      setLessons(lessons.map(lesson => 
        lesson.id === editingLesson.id ? updatedLesson : lesson
      ));
      setShowEditModal(false);
      setEditingLesson(null);
      resetForm();
    } catch (err) {
      setError('Ошибка при обновлении урока');
      console.error('Error updating lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  // Удаление урока
  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот урок?')) return;

    try {
      setLoading(true);
      await lessonsService.delete(lessonId);
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
    } catch (err) {
      setError('Ошибка при удалении урока');
      console.error('Error deleting lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  // Открытие модального окна редактирования
  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      name: lesson.name,
      description: lesson.description || '',
      date: new Date(lesson.date).toISOString().slice(0, 16),
      studyPlanId: lesson.studyPlanId,
    });
    setShowEditModal(true);
  };

  // Сброс формы
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      date: '',
      studyPlanId: parseInt(studyPlanId || '0'),
    });
  };

  // Открытие модального окна создания
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !studyPlan) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={() => navigate('/study-plans')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Вернуться к учебным планам
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button 
            onClick={() => navigate('/study-plans')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Вернуться к учебным планам
          </button>
          <h1 className="text-2xl font-bold">Управление уроками</h1>
          {studyPlan && (
            <p className="text-gray-600 mt-1">
              {studyPlan.name} - {studyPlan.teacher?.user.surname} {studyPlan.teacher?.user.name}
            </p>
          )}
        </div>
        {user?.role === 'ADMIN' || (user?.role === 'TEACHER' && studyPlan?.teacher?.user.id === user.id) ? (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
          >
            <FaPlus className="mr-2" />
            Добавить урок
          </button>
        ) : null}
      </div>

      {/* Статистика */}
      {studyPlan && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{lessons.length}</div>
            <div className="text-gray-600">Всего уроков</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {lessons.filter(l => l.materials?.videoUrl).length}
            </div>
            <div className="text-gray-600">С видео</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {lessons.filter(l => l.materials?.quiz).length}
            </div>
            <div className="text-gray-600">С тестами</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              {lessons.filter(l => l.homework).length}
            </div>
            <div className="text-gray-600">С ДЗ</div>
          </div>
        </div>
      )}

      {/* Список уроков */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {lessons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaCalendarAlt className="mx-auto text-4xl mb-4" />
            <p className="text-lg">Уроки еще не созданы</p>
            <p>Нажмите "Добавить урок" чтобы создать первый урок</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата/Время</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Материалы</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lessons.map((lesson, index) => (
                  <motion.tr 
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{lesson.name}</div>
                      {lesson.description && (
                        <div className="text-gray-500 text-xs mt-1">{lesson.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-blue-500" />
                        {formatDate(lesson.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        {lesson.materials?.videoUrl && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <FaPlay className="mr-1" />
                            Видео
                          </span>
                        )}
                        {lesson.materials?.presentationUrl && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            <FaFileAlt className="mr-1" />
                            Презентация
                          </span>
                        )}
                        {lesson.materials?.quiz && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            <FaQuestionCircle className="mr-1" />
                            Тест
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        new Date(lesson.date) > new Date() 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {new Date(lesson.date) > new Date() ? 'Запланирован' : 'Завершен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(user?.role === 'ADMIN' || (user?.role === 'TEACHER' && studyPlan?.teacher?.user.id === user.id)) && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(lesson)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Редактировать урок"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => navigate(`/lessons/${lesson.id}/materials`)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Управление материалами"
                          >
                            <FaCog />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Удалить урок"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно создания урока */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Создать новый урок</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название урока *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Введите название урока"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Описание урока"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <FaTimes className="mr-2 inline" />
                    Отмена
                  </button>
                  <button
                    onClick={handleCreateLesson}
                    disabled={!formData.name || !formData.date}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave className="mr-2 inline" />
                    Создать
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно редактирования урока */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Редактировать урок</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название урока *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Введите название урока"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Описание урока"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingLesson(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <FaTimes className="mr-2 inline" />
                    Отмена
                  </button>
                  <button
                    onClick={handleEditLesson}
                    disabled={!formData.name || !formData.date}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave className="mr-2 inline" />
                    Сохранить
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonsManagePage;
