import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPlus, FaEdit, FaTrash, FaVideo, FaFile,
  FaClipboardCheck, FaHome, FaBookOpen, FaUpload, FaCheck, FaTimes
} from 'react-icons/fa';
import { formatDate } from '../utils';
import QuizMaterialEditor from '../components/QuizMaterialEditor';
import { QuizQuestion } from '../components/QuizEditor';
import RichTextEditor from '../components/RichTextEditor';
import fileService from '../services/fileService';

interface Material {
  id: number;
  type: 'lecture' | 'video' | 'presentation' | 'quiz' | 'homework';
  title: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  videoUrl?: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  quiz?: {
    questions: Array<{
      id: number;
      question: string;
      type: 'single' | 'multiple' | 'text';
      options?: string[];
      correctAnswers?: number[];
      points: number;
    }>;
    timeLimit?: number;
    maxAttempts?: number;
  };
  homework?: {
    dueDate: string;
    maxScore: number;
    instructions: string;
    files?: string[];
  };
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  content?: string;
  scheduledDate: string;
  status: 'draft' | 'published' | 'completed';
  studyPlan?: {
    id: number;
    name: string;
  };
  materials: Material[];
}

const LessonEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'quiz' | 'homework'>('materials');

  // Модальные окна
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialType, setMaterialType] = useState<Material['type']>('lecture');

  useEffect(() => {
    if (id) {
      loadLesson();
    }
  }, [id]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      setError(null);

      // Временные данные - заменить на API вызовы
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockLesson: Lesson = {
        id: parseInt(id || '1'),
        title: 'Введение в математический анализ',
        description: 'Основные понятия и определения математического анализа',
        content: 'Основной контент урока...',
        scheduledDate: '2024-04-05T10:00:00',
        status: 'draft',
        studyPlan: {
          id: 1,
          name: 'Математический анализ'
        },
        materials: [
          {
            id: 1,
            type: 'lecture',
            title: 'Лекция: Основные понятия',
            description: 'Введение в математический анализ',
            content: '<h2>Математический анализ</h2><p>Раздел математики...</p>',
            order: 1,
            isPublished: true,
            createdAt: '2024-04-01T10:00:00'
          },
          {
            id: 2,
            type: 'video',
            title: 'Видеолекция: Пределы функций',
            description: 'Видео о пределах функций',
            videoUrl: 'https://example.com/video.mp4',
            order: 2,
            isPublished: false,
            createdAt: '2024-04-01T11:00:00'
          },
          {
            id: 3,
            type: 'quiz',
            title: 'Тест: Проверка знаний',
            description: 'Тест по пройденному материалу',
            order: 3,
            isPublished: false,
            createdAt: '2024-04-01T12:00:00',
            quiz: {
              questions: [
                {
                  id: 1,
                  question: 'Что такое предел функции?',
                  type: 'single',
                  options: ['Число', 'Функция', 'Граница', 'Множество'],
                  correctAnswers: [0],
                  points: 5
                }
              ],
              timeLimit: 30,
              maxAttempts: 3
            }
          }
        ]
      };

      setLesson(mockLesson);
    } catch (err) {
      setError('Ошибка при загрузке урока');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/lessons');
  };

  const handleSaveLesson = async () => {
    if (!lesson) return;

    try {
      setSaving(true);
      // Здесь будет API вызов для сохранения урока
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Lesson saved:', lesson);
    } catch (err) {
      setError('Ошибка при сохранении урока');
      console.error('Error saving lesson:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishLesson = async () => {
    if (!lesson) return;

    try {
      setSaving(true);
      setLesson({
        ...lesson,
        status: lesson.status === 'published' ? 'draft' : 'published'
      });
      // Здесь будет API вызов
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError('Ошибка при публикации урока');
      console.error('Error publishing lesson:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMaterial = (type: Material['type']) => {
    setMaterialType(type);
    setEditingMaterial(null);
    setShowCreateMaterial(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialType(material.type);
    setShowCreateMaterial(true);
  };

  const handleDeleteMaterial = (materialId: number) => {
    if (!lesson) return;

    setLesson({
      ...lesson,
      materials: lesson.materials.filter(m => m.id !== materialId)
    });
  };

  const handleSaveMaterial = (materialData: any) => {
    if (!lesson) return;

    if (editingMaterial) {
      // Обновление существующего материала
      setLesson({
        ...lesson,
        materials: lesson.materials.map(m =>
          m.id === editingMaterial.id
            ? { ...m, ...materialData }
            : m
        )
      });
    } else {
      // Создание нового материала
      const newMaterial: Material = {
        id: Date.now(),
        type: materialType,
        order: lesson.materials.length + 1,
        isPublished: false,
        createdAt: new Date().toISOString(),
        ...materialData
      };

      setLesson({
        ...lesson,
        materials: [...lesson.materials, newMaterial]
      });
    }

    setShowCreateMaterial(false);
    setEditingMaterial(null);
  };

  const getMaterialIcon = (type: Material['type']) => {
    switch (type) {
      case 'lecture':
        return <FaBookOpen className="text-blue-500" />;
      case 'video':
        return <FaVideo className="text-red-500" />;
      case 'presentation':
        return <FaFile className="text-green-500" />;
      case 'quiz':
        return <FaClipboardCheck className="text-purple-500" />;
      case 'homework':
        return <FaHome className="text-orange-500" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  const getMaterialTypeName = (type: Material['type']) => {
    switch (type) {
      case 'lecture':
        return 'Лекция';
      case 'video':
        return 'Видео';
      case 'presentation':
        return 'Презентация';
      case 'quiz':
        return 'Тест';
      case 'homework':
        return 'Домашнее задание';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <FaBookOpen className="w-8 h-8 text-corporate-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error || 'Урок не найден'}</p>
          <button
            onClick={handleBack}
            className="mt-2 text-sm text-red-600 hover:text-red-500 button-hover"
          >
            Вернуться к урокам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Шапка */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-corporate-primary hover:text-purple-800 button-hover mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Назад к урокам
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
            <p className="text-gray-600 mb-2">{lesson.description}</p>
            <p className="text-sm text-gray-500">
              Дата проведения: {formatDate(lesson.scheduledDate)}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSaveLesson}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-md hover:bg-purple-700 disabled:opacity-50 button-hover"
            >
              <FaSave className="mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>

            <button
              onClick={handlePublishLesson}
              disabled={saving}
              className={`flex items-center px-4 py-2 rounded-md button-hover ${lesson.status === 'published'
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
                }`}
            >
              {lesson.status === 'published' ? (
                <>
                  <FaTimes className="mr-2" />
                  Снять с публикации
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  Опубликовать
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Статус */}
      <div className="mb-6">
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${lesson.status === 'published'
            ? 'bg-green-100 text-green-800'
            : lesson.status === 'draft'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
          {lesson.status === 'published' ? 'Опубликован' :
            lesson.status === 'draft' ? 'Черновик' : 'Завершен'}
        </span>
      </div>

      {/* Навигация по табам */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('materials')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm button-hover ${activeTab === 'materials'
                ? 'border-corporate-primary text-corporate-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <FaBookOpen className="inline mr-2" />
            Материалы ({lesson.materials.filter(m => ['lecture', 'video', 'presentation'].includes(m.type)).length})
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm button-hover ${activeTab === 'quiz'
                ? 'border-corporate-primary text-corporate-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <FaClipboardCheck className="inline mr-2" />
            Тесты ({lesson.materials.filter(m => m.type === 'quiz').length})
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm button-hover ${activeTab === 'homework'
                ? 'border-corporate-primary text-corporate-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <FaHome className="inline mr-2" />
            Домашние задания ({lesson.materials.filter(m => m.type === 'homework').length})
          </button>
        </nav>
      </div>

      {/* Контент вкладок */}
      <div className="bg-white rounded-lg shadow-notion">
        {/* Материалы */}
        {activeTab === 'materials' && (
          <div className="p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Учебные материалы</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCreateMaterial('lecture')}
                  className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm button-hover"
                >
                  <FaBookOpen className="mr-2" />
                  Лекция
                </button>
                <button
                  onClick={() => handleCreateMaterial('video')}
                  className="flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm button-hover"
                >
                  <FaVideo className="mr-2" />
                  Видео
                </button>
                <button
                  onClick={() => handleCreateMaterial('presentation')}
                  className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm button-hover"
                >
                  <FaFile className="mr-2" />
                  Презентация
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {lesson.materials
                .filter(m => ['lecture', 'video', 'presentation'].includes(m.type))
                .sort((a, b) => a.order - b.order)
                .map((material) => (
                  <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="mr-3">
                          {getMaterialIcon(material.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{material.title}</h4>
                          <p className="text-sm text-gray-500">{material.description}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-400 mr-4">
                              {getMaterialTypeName(material.type)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${material.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {material.isPublished ? 'Опубликован' : 'Черновик'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="text-indigo-600 hover:text-indigo-900 button-hover"
                          title="Редактировать"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-900 button-hover"
                          title="Удалить"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {lesson.materials.filter(m => ['lecture', 'video', 'presentation'].includes(m.type)).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaBookOpen className="mx-auto text-4xl mb-4" />
                  <p>Материалы еще не добавлены</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Тесты */}
        {activeTab === 'quiz' && (
          <div className="p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Тесты и викторины</h3>
              <button
                onClick={() => handleCreateMaterial('quiz')}
                className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 button-hover"
              >
                <FaPlus className="mr-2" />
                Создать тест
              </button>
            </div>

            <div className="space-y-4">
              {lesson.materials
                .filter(m => m.type === 'quiz')
                .sort((a, b) => a.order - b.order)
                .map((material) => (
                  <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="mr-3">
                          <FaClipboardCheck className="text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{material.title}</h4>
                          <p className="text-sm text-gray-500">{material.description}</p>
                          <div className="flex items-center mt-1 space-x-4">
                            <span className="text-xs text-gray-400">
                              {material.quiz?.questions.length || 0} вопросов
                            </span>
                            {material.quiz?.timeLimit && (
                              <span className="text-xs text-gray-400">
                                {material.quiz.timeLimit} мин
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full ${material.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {material.isPublished ? 'Опубликован' : 'Черновик'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="text-indigo-600 hover:text-indigo-900 button-hover"
                          title="Редактировать"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-900 button-hover"
                          title="Удалить"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {lesson.materials.filter(m => m.type === 'quiz').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaClipboardCheck className="mx-auto text-4xl mb-4" />
                  <p>Тесты еще не созданы</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Домашние задания */}
        {activeTab === 'homework' && (
          <div className="p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Домашние задания</h3>
              <button
                onClick={() => handleCreateMaterial('homework')}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 button-hover"
              >
                <FaPlus className="mr-2" />
                Создать задание
              </button>
            </div>

            <div className="space-y-4">
              {lesson.materials
                .filter(m => m.type === 'homework')
                .sort((a, b) => a.order - b.order)
                .map((material) => (
                  <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="mr-3">
                          <FaHome className="text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{material.title}</h4>
                          <p className="text-sm text-gray-500">{material.description}</p>
                          <div className="flex items-center mt-1 space-x-4">
                            {material.homework?.dueDate && (
                              <span className="text-xs text-gray-400">
                                До: {formatDate(material.homework.dueDate)}
                              </span>
                            )}
                            {material.homework?.maxScore && (
                              <span className="text-xs text-gray-400">
                                Макс. балл: {material.homework.maxScore}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full ${material.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {material.isPublished ? 'Опубликован' : 'Черновик'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="text-indigo-600 hover:text-indigo-900 button-hover"
                          title="Редактировать"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-900 button-hover"
                          title="Удалить"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {lesson.materials.filter(m => m.type === 'homework').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaHome className="mx-auto text-4xl mb-4" />
                  <p>Домашние задания еще не созданы</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно создания/редактирования материала */}
      {showCreateMaterial && materialType === 'quiz' && (
        <QuizMaterialEditor
          quiz={editingMaterial?.quiz ? {
            questions: editingMaterial.quiz.questions.map(q => ({
              id: q.id.toString(),
              name: q.question,
              type: q.type === 'single' ? 'SINGLE_CHOICE' as const : 
                    q.type === 'multiple' ? 'MULTIPLE_CHOICE' as const : 'TEXT' as const,
              points: q.points,
              answers: q.options?.map((option, index) => ({
                id: `${q.id}_${index}`,
                name: option,
                isCorrect: q.correctAnswers?.includes(index) || false
              })) || []
            })),
            timeLimit: editingMaterial.quiz.timeLimit,
            maxAttempts: editingMaterial.quiz.maxAttempts
          } : undefined}
          onSave={(quizData) => {
            const materialData = {
              title: editingMaterial?.title || 'Новый тест',
              description: editingMaterial?.description || '',
              isPublished: editingMaterial?.isPublished || false,
              quiz: {
                questions: quizData.questions.map((q, index) => ({
                  id: index + 1,
                  question: q.name,
                  type: q.type === 'SINGLE_CHOICE' ? 'single' as const :
                        q.type === 'MULTIPLE_CHOICE' ? 'multiple' as const : 'text' as const,
                  options: q.answers.map(a => a.name),
                  correctAnswers: q.answers.map((a, i) => a.isCorrect ? i : -1).filter(i => i >= 0),
                  points: q.points || 1
                })),
                timeLimit: quizData.timeLimit,
                maxAttempts: quizData.maxAttempts
              }
            };
            handleSaveMaterial(materialData);
          }}
          onClose={() => {
            setShowCreateMaterial(false);
            setEditingMaterial(null);
          }}
        />
      )}

      {showCreateMaterial && materialType !== 'quiz' && (
        <MaterialEditor
          type={materialType}
          material={editingMaterial}
          onSave={handleSaveMaterial}
          onClose={() => {
            setShowCreateMaterial(false);
            setEditingMaterial(null);
          }}
        />
      )}
    </div>
  );
};

// Компонент редактора материалов
const MaterialEditor: React.FC<{
  type: Material['type'];
  material: Material | null;
  onSave: (data: any) => void;
  onClose: () => void;
}> = ({ type, material, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: material?.title || '',
    description: material?.description || '',
    content: material?.content || '',
    videoUrl: material?.videoUrl || '',
    fileUrl: material?.fileUrl || '',
    isPublished: material?.isPublished || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    onSave(formData);
  };

  const getTitle = () => {
    const action = material ? 'Редактировать' : 'Создать';
    switch (type) {
      case 'lecture':
        return `${action} лекцию`;
      case 'video':
        return `${action} видео`;
      case 'presentation':
        return `${action} презентацию`;
      case 'quiz':
        return `${action} тест`;
      case 'homework':
        return `${action} домашнее задание`;
      default:
        return `${action} материал`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">{getTitle()}</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Введите название"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Введите описание"
              />
            </div>

            {(type === 'lecture') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Контент лекции
                </label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  onImageUpload={async (file) => {
                    try {
                      return await fileService.uploadLessonImage(file);
                    } catch (error) {
                      console.error('Error uploading image:', error);
                      throw error;
                    }
                  }}
                  placeholder="Введите текст лекции..."
                />
              </div>
            )}

            {type === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL видео
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/video.mp4"
                />
              </div>
            )}

            {type === 'presentation' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Файл презентации
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    className="hidden"
                    id="presentation-file"
                  />
                  <label
                    htmlFor="presentation-file"
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer button-hover"
                  >
                    <FaUpload className="mr-2" />
                    Выбрать файл
                  </label>
                  {formData.fileUrl && (
                    <span className="text-sm text-gray-500">{formData.fileUrl}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isPublished" className="text-sm text-gray-700">
                Опубликовать материал
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 button-hover"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!formData.title}
                className="px-4 py-2 bg-corporate-primary text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed button-hover"
              >
                {material ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LessonEditor;
