import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Video,
  FileText,
  HelpCircle,
  Save,
  X,
  ExternalLink,
  Play
} from 'lucide-react';
import { Button, Loading, Modal, Input } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { Lesson } from '../types/lesson';
import { lessonService } from '../services/lessonService';
import { Material, materialService, CreateLessonMaterialsRequest } from '../services/materialService';
import VideoPlayer from '../components/VideoPlayer';

type ActiveTab = 'content' | 'video' | 'presentation' | 'test';

const LessonMaterialsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('content');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Форма создания материалов
  const [materialForm, setMaterialForm] = useState<CreateLessonMaterialsRequest>({
    lecture: '',
    videoUrl: '',
    presentationUrl: '',
    quiz: {
      name: '',
      maxScore: 100,
      duration: 30,
      isActive: true
    },
    homework: {
      name: '',
      description: ''
    }
  });

  useEffect(() => {
    if (id) {
      loadLessonData();
    }
  }, [id]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [lessonData, materialsData] = await Promise.all([
        lessonService.getLesson(parseInt(id!)),
        materialService.getMaterialsByLesson(parseInt(id!))
      ]);

      setLesson(lessonData);
      setMaterials(materialsData);

      // Если есть материалы, заполняем форму
      if (materialsData.length > 0) {
        const material = materialsData[0];
        setMaterialForm({
          lecture: material.lectureContent || '',
          videoUrl: material.videoUrl || '',
          presentationUrl: material.presentationUrl || '',
          quiz: material.quiz ? {
            name: material.quiz.name,
            maxScore: material.quiz.maxScore || 100,
            duration: material.quiz.duration || 30,
            isActive: material.quiz.isActive || true
          } : {
            name: '',
            maxScore: 100,
            duration: 30,
            isActive: true
          },
          homework: {
            name: '',
            description: ''
          }
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Не удалось загрузить данные урока');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaterials = async () => {
    if (!lesson) return;

    try {
      setSaving(true);

      // Очищаем пустые поля
      const cleanData: CreateLessonMaterialsRequest = {};

      if (materialForm.lecture?.trim()) {
        cleanData.lecture = materialForm.lecture.trim();
      }

      if (materialForm.videoUrl?.trim()) {
        cleanData.videoUrl = materialForm.videoUrl.trim();
      }

      if (materialForm.presentationUrl?.trim()) {
        cleanData.presentationUrl = materialForm.presentationUrl.trim();
      }

      if (materialForm.quiz?.name?.trim()) {
        cleanData.quiz = materialForm.quiz;
      }

      if (materialForm.homework?.name?.trim()) {
        cleanData.homework = materialForm.homework;
      }

      await materialService.createLessonMaterials(lesson.id, cleanData);
      await loadLessonData(); // Перезагружаем данные
      setShowCreateModal(false);
    } catch (error) {
      console.error('Ошибка при сохранении материалов:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Загрузка материалов..." />
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/lessons/${id}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к уроку
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Материалы урока</h1>
            <p className="text-gray-500 mt-1">{lesson.name}</p>
          </div>
        </div>

        {canEdit && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить материалы
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'content'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Лекция
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'video'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <Video className="h-4 w-4 inline mr-2" />
            Видео
          </button>
          <button
            onClick={() => setActiveTab('presentation')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'presentation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Презентация
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'test'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <HelpCircle className="h-4 w-4 inline mr-2" />
            Тест
          </button>
        </div>

        <div className="p-6">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div>
              {materialForm.lecture ? (
                <div className="prose max-w-none">
                  <div>{materialForm.lecture}</div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет контента лекции</h3>
                  <p className="text-gray-500 mb-4">Добавьте материалы для отображения содержимого лекции</p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Добавить контент
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Video Tab */}
          {activeTab === 'video' && (
            <div>
              {materialForm.videoUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <VideoPlayer
                      url={materialForm.videoUrl}
                      controls={true}
                      onPlay={() => console.log('Video started playing')}
                      onPause={() => console.log('Video paused')}
                      onEnded={() => console.log('Video ended')}
                    />
                  </div>

                  {/* Video Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Источник видео:</p>
                        <p className="text-sm text-gray-600 break-all">{materialForm.videoUrl}</p>
                      </div>
                      <button
                        onClick={() => window.open(materialForm.videoUrl, '_blank')}
                        className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Открыть
                      </button>
                    </div>
                  </div>

                  {/* Supported formats info */}
                  <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Поддерживаемые форматы:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="font-medium">Платформы:</p>
                        <ul className="list-disc list-inside">
                          <li>YouTube</li>
                          <li>Vimeo</li>
                          <li>DailyMotion</li>
                          <li>Twitch</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Файлы:</p>
                        <ul className="list-disc list-inside">
                          <li>MP4</li>
                          <li>WebM</li>
                          <li>OGV</li>
                          <li>HLS (.m3u8)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет видео</h3>
                  <p className="text-gray-500 mb-4">Добавьте ссылку на видео для урока</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Поддерживаются YouTube, Vimeo, файлы MP4 и другие форматы
                  </p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Добавить видео
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Presentation Tab */}
          {activeTab === 'presentation' && (
            <div>
              {materialForm.presentationUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <iframe
                      src={materialForm.presentationUrl}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет презентации</h3>
                  <p className="text-gray-500 mb-4">Добавьте ссылку на презентацию для урока</p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Добавить презентацию
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Test Tab */}
          {activeTab === 'test' && (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Тест</h3>
              <p className="text-gray-500 mb-4">
                {materialForm.quiz?.name ? `Тест: ${materialForm.quiz.name}` : 'Нет тестовых заданий'}
              </p>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(true)}
                >
                  {materialForm.quiz?.name ? 'Редактировать тест' : 'Создать тест'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Materials Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Добавить материалы урока"
        size="xl"
      >
        <div className="space-y-6">
          {/* Lecture Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Содержание лекции
            </label>
            <textarea
              value={materialForm.lecture || ''}
              onChange={(e) => setMaterialForm({ ...materialForm, lecture: e.target.value })}
              className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите содержание лекции..."
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL видео
            </label>
            <Input
              value={materialForm.videoUrl || ''}
              onChange={(e) => setMaterialForm({ ...materialForm, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            />
            <div className="mt-2 text-xs text-gray-500">
              <p className="font-medium mb-1">Примеры поддерживаемых URL:</p>
              <ul className="space-y-1">
                <li>• YouTube: https://www.youtube.com/watch?v=VIDEO_ID</li>
                <li>• Vimeo: https://vimeo.com/VIDEO_ID</li>
                <li>• Прямая ссылка: https://example.com/video.mp4</li>
                <li>• HLS поток: https://example.com/stream.m3u8</li>
              </ul>
            </div>
          </div>

          {/* Presentation URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL презентации
            </label>
            <Input
              value={materialForm.presentationUrl || ''}
              onChange={(e) => setMaterialForm({ ...materialForm, presentationUrl: e.target.value })}
              placeholder="https://example.com/presentation.pdf"
            />
          </div>

          {/* Quiz */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тест
            </label>
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <Input
                value={materialForm.quiz?.name || ''}
                onChange={(e) => setMaterialForm({
                  ...materialForm,
                  quiz: { ...materialForm.quiz!, name: e.target.value }
                })}
                placeholder="Название теста"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  value={materialForm.quiz?.maxScore || 100}
                  onChange={(e) => setMaterialForm({
                    ...materialForm,
                    quiz: { ...materialForm.quiz!, maxScore: parseInt(e.target.value) || 100 }
                  })}
                  placeholder="Максимальный балл"
                />
                <Input
                  type="number"
                  value={materialForm.quiz?.duration || 30}
                  onChange={(e) => setMaterialForm({
                    ...materialForm,
                    quiz: { ...materialForm.quiz!, duration: parseInt(e.target.value) || 30 }
                  })}
                  placeholder="Длительность (мин)"
                />
              </div>
            </div>
          </div>

          {/* Homework */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Домашнее задание
            </label>
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <Input
                value={materialForm.homework?.name || ''}
                onChange={(e) => setMaterialForm({
                  ...materialForm,
                  homework: { ...materialForm.homework!, name: e.target.value }
                })}
                placeholder="Название домашнего задания"
              />
              <textarea
                value={materialForm.homework?.description || ''}
                onChange={(e) => setMaterialForm({
                  ...materialForm,
                  homework: { ...materialForm.homework!, description: e.target.value }
                })}
                className="w-full h-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Описание домашнего задания..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveMaterials}
              loading={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LessonMaterialsPage;
