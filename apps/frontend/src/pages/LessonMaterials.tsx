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
  Play,
  BarChart
} from 'lucide-react';
import { Button, Loading, Modal, Input } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { Lesson } from '../types/lesson';
import { lessonService } from '../services/lessonService';
import { Material, materialService, CreateLessonMaterialsRequest, QuizQuestion } from '../services/materialService';
import VideoPlayer from '../components/VideoPlayer';
import { quizService } from '../services/quizService';
import RichTextEditor from '../components/RichTextEditor';
import MathRenderer from '../components/MathRenderer';
import fileService from '../services/fileService';

type ActiveTab = 'content' | 'video' | 'presentation' | 'test';

// Компонент кнопки для действий с тестом студентов
const QuizActionButton: React.FC<{ quizId?: number }> = ({ quizId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizStatus, setQuizStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quizId && user?.role === 'STUDENT') {
      checkQuizStatus();
    }
  }, [quizId, user]);

  const checkQuizStatus = async () => {
    if (!quizId) return;
    
    try {
      setLoading(true);
      const status = await quizService.getQuizStatus(quizId);
      setQuizStatus(status);
    } catch (error) {
      console.error('Ошибка при проверке статуса теста:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    navigate(`/quiz/${quizId}/take`);
  };

  const handleViewResult = () => {
    if (quizStatus?.attempt?.id) {
      navigate(`/quiz/attempt/${quizStatus.attempt.id}/result`);
    }
  };

  if (!quizId || loading) {
    return (
      <div className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg text-center">
        Загрузка...
      </div>
    );
  }

  if (quizStatus?.hasAttempt) {
    // Студент уже проходил тест
    return (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-900">Тест пройден</h4>
              <p className="text-sm text-green-700 mt-1">
                Результат: {quizStatus.attempt.score || 0} баллов
                {quizStatus.attempt.quiz?.maxScore && (
                  <span className="ml-1">
                    (из {quizStatus.attempt.quiz.maxScore})
                  </span>
                )}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Пройден: {new Date(quizStatus.attempt.startTime).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Завершено
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleViewResult}
          className="w-full"
        >
          <BarChart className="h-4 w-4 mr-2" />
          Посмотреть результат
        </Button>
      </div>
    );
  }

  // Студент еще не проходил тест
  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Тест доступен для прохождения</h4>
        <p className="text-sm text-blue-700">
          Вы можете пройти этот тест только один раз. Убедитесь, что готовы к прохождению.
        </p>
      </div>
      <Button
        variant="primary"
        onClick={handleStartQuiz}
        className="w-full"
      >
        <Play className="h-4 w-4 mr-2" />
        Начать тест
      </Button>
    </div>
  );
};

// Локальный интерфейс для формы с поддержкой вопросов
interface LocalQuizForm {
  name: string;
  duration?: number;
  maxScore?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  questions?: QuizQuestion[];
}

interface LocalMaterialForm {
  lecture?: string;
  videoUrl?: string;
  presentationUrl?: string;
  quiz?: LocalQuizForm;
}

const LessonMaterialsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<Material>({} as Material);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('content');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Форма создания материалов (локальная с поддержкой вопросов)
  const [materialForm, setMaterialForm] = useState<LocalMaterialForm>({
    lecture: '',
    videoUrl: '',
    presentationUrl: '',
    quiz: {
      name: '',
      maxScore: 100,
      duration: 30,
      isActive: true,
      questions: []
    }
  });

  // Добавить вопрос к тесту
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      score: 1,
      multipleAnswers: false
    };

    setMaterialForm({
      ...materialForm,
      quiz: {
        ...materialForm.quiz!,
        questions: [...(materialForm.quiz?.questions || []), newQuestion]
      }
    });
  };

  // Переключить тип вопроса (одиночный/множественный)
  const toggleQuestionType = (index: number) => {
    const questions = [...(materialForm.quiz?.questions || [])];
    const question = questions[index];
    const newMultipleAnswers = !question.multipleAnswers;

    questions[index] = {
      ...question,
      multipleAnswers: newMultipleAnswers,
      correctAnswer: newMultipleAnswers ? [] : 0 // Сброс правильных ответов при смене типа
    };

    setMaterialForm({
      ...materialForm,
      quiz: {
        ...materialForm.quiz!,
        questions
      }
    });
  };

  // Обработка выбора правильного ответа для множественного выбора
  const toggleCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const questions = [...(materialForm.quiz?.questions || [])];
    const question = questions[questionIndex];

    if (question.multipleAnswers) {
      let correctAnswers = Array.isArray(question.correctAnswer) ? [...question.correctAnswer] : [];

      if (correctAnswers.includes(optionIndex)) {
        correctAnswers = correctAnswers.filter(idx => idx !== optionIndex);
      } else {
        correctAnswers.push(optionIndex);
      }

      questions[questionIndex] = { ...question, correctAnswer: correctAnswers };
    } else {
      questions[questionIndex] = { ...question, correctAnswer: optionIndex };
    }

    setMaterialForm({
      ...materialForm,
      quiz: {
        ...materialForm.quiz!,
        questions
      }
    });
  };

  // Удалить вопрос
  const removeQuestion = (index: number) => {
    const questions = materialForm.quiz?.questions || [];
    questions.splice(index, 1);

    setMaterialForm({
      ...materialForm,
      quiz: {
        ...materialForm.quiz!,
        questions: [...questions]
      }
    });
  };

  // Обновить вопрос
  const updateQuestion = (index: number, updatedQuestion: QuizQuestion) => {
    const questions = [...(materialForm.quiz?.questions || [])];
    questions[index] = updatedQuestion;

    setMaterialForm({
      ...materialForm,
      quiz: {
        ...materialForm.quiz!,
        questions
      }
    });
  };

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
      setMaterials(materialsData); // Сохраняем массив материалов

      // Материалы приходят из отдельного запроса к materials API
      const material: any = Array.isArray(materialsData) ? materialsData[0] : materialsData;

      console.log('Loaded lesson data:', lessonData);
      console.log('Loaded materials data (this is our main source):', materialsData);
      console.log('Final material:', material);

      // Заполняем форму материалами
      if (material) {
        // Конвертируем вопросы из формата бекенда в формат фронтенда
        const convertedQuestions = material.quiz?.questions?.map((question: any) => {
          const options = question.answers?.map((answer: any) => answer.name) || ['', '', '', ''];

          // Правильная конвертация правильных ответов
          let correctAnswer: number | number[];

          if (question.type === 'MULTIPLE_CHOICE') {
            // Для множественного выбора - массив индексов правильных ответов
            correctAnswer = question.answers?.map((answer: any, index: number) => answer.isCorrect ? index : -1)
              .filter((index: number) => index !== -1) || [];
          } else {
            // Для одиночного выбора - индекс правильного ответа
            correctAnswer = question.answers?.findIndex((answer: any) => answer.isCorrect);
            if (correctAnswer === -1) correctAnswer = 0; // Если правильный ответ не найден, устанавливаем первый вариант
          }

          return {
            question: question.name, // На бекенде поле называется 'name'
            options,
            correctAnswer,
            score: 1, // По умолчанию
            multipleAnswers: question.type === 'MULTIPLE_CHOICE'
          };
        }) || [];

        console.log('Converted questions:', convertedQuestions); // Для отладки

        setMaterialForm({
          lecture: material.lecture || material.lectureContent || '',
          videoUrl: material.videoUrl || '',
          presentationUrl: material.presentationUrl || '',
          quiz: material.quiz ? {
            name: material.quiz.name || '',
            maxScore: material.quiz.maxScore || 100,
            duration: material.quiz.duration || 30,
            isActive: material.quiz.isActive !== undefined ? material.quiz.isActive : true,
            questions: convertedQuestions,
            startDate: material.quiz.startDate || '',
            endDate: material.quiz.endDate || ''
          } : {
            name: '',
            maxScore: 100,
            duration: 30,
            isActive: true,
            questions: []
          }
        });
      } else {
        // Если материалов нет, устанавливаем пустую форму
        setMaterialForm({
          lecture: '',
          videoUrl: '',
          presentationUrl: '',
          quiz: {
            name: '',
            maxScore: 100,
            duration: 30,
            isActive: true,
            questions: []
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

  // Функция для преобразования Math узлов обратно в LaTeX
  const convertMathNodesToLatex = (html: string): string => {
    // Преобразуем span[data-math] обратно в $formula$
    return html.replace(/<span[^>]*data-math="([^"]*)"[^>]*>.*?<\/span>/g, (match, formula) => {
      return `$${formula}$`;
    });
  };

  const handleSaveMaterials = async () => {
    if (!lesson) return;

    try {
      setSaving(true);

      // Очищаем пустые поля
      const cleanData: CreateLessonMaterialsRequest = {};

      if (materialForm.lecture?.trim()) {
        // Преобразуем Math узлы обратно в LaTeX перед сохранением
        cleanData.lecture = convertMathNodesToLatex(materialForm.lecture.trim());
      }

      if (materialForm.videoUrl?.trim()) {
        cleanData.videoUrl = materialForm.videoUrl.trim();
      }

      if (materialForm.presentationUrl?.trim()) {
        cleanData.presentationUrl = materialForm.presentationUrl.trim();
      }

      if (materialForm.quiz?.name?.trim()) {
        // Отладочная информация
        console.log('Original quiz questions:', materialForm.quiz.questions);
        
        const processedQuestions = materialForm.quiz.questions?.filter(q => {
          const hasQuestion = q.question?.trim();
          const hasOptions = q.options?.some(opt => opt?.trim());
          const hasCorrectAnswer = typeof q.correctAnswer === 'number' || 
            (Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0);
          
          console.log(`Question ${materialForm.quiz?.questions?.indexOf(q)}:`, {
            hasQuestion,
            hasOptions,
            hasCorrectAnswer,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer
          });
          
          return hasQuestion && hasOptions && hasCorrectAnswer;
        }).map(q => ({
          ...q,
          // Преобразуем Math узлы в вопросе и вариантах ответов
          question: convertMathNodesToLatex(q.question),
          options: q.options.map(opt => convertMathNodesToLatex(opt))
        })) || [];

        console.log('Processed questions:', processedQuestions);

        cleanData.quiz = {
          name: materialForm.quiz.name.trim(),
          duration: materialForm.quiz.duration,
          maxScore: materialForm.quiz.maxScore,
          isActive: materialForm.quiz.isActive,
          startDate: materialForm.quiz.startDate ? new Date(materialForm.quiz.startDate).toISOString() : undefined,
          endDate: materialForm.quiz.endDate ? new Date(materialForm.quiz.endDate).toISOString() : undefined,
          questions: processedQuestions
        };
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
                <MathRenderer content={materialForm.lecture} />
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
            <div>
              {materialForm.quiz?.name ? (
                <div className="space-y-6">
                  {/* Quiz Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{materialForm.quiz.name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="font-medium">Вопросов:</span>
                            <span className="ml-2">{materialForm.quiz.questions?.length || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Максимум баллов:</span>
                            <span className="ml-2">{materialForm.quiz.maxScore}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Длительность:</span>
                            <span className="ml-2">{materialForm.quiz.duration || 30} мин</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Статус:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${materialForm.quiz.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {materialForm.quiz.isActive ? 'Активен' : 'Неактивен'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/quiz/results?quizId=${materials?.quiz?.id || materials?.quizId || ''}`)}
                          >
                            <BarChart className="h-4 w-4 mr-2" />
                            Результаты
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowCreateModal(true)}
                          >
                            Редактировать
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quiz Preview */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {!canEdit && (
                      <QuizActionButton quizId={materials?.quiz?.id || materials?.quizId || undefined} />
                    )}
                    {canEdit && materialForm.quiz.questions && materialForm.quiz.questions.length > 0 && (
                      <>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
                          Предпросмотр теста
                        </h4>
                        <div className="space-y-6">
                          {materialForm.quiz.questions.map((question, index) => (
                            <div key={index} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                              {/* Question Header */}
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">
                                  Вопрос {index + 1}
                                  {question.multipleAnswers && (
                                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      Множественный выбор
                                    </span>
                                  )}
                                </h5>
                                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                  {question.score} {question.score === 1 ? 'балл' : 'балла'}
                                </span>
                              </div>

                              {/* Question Text */}
                              <div className="text-gray-800 mb-4 font-medium">
                                <MathRenderer content={question.question || 'Вопрос не задан'} />
                              </div>

                              {/* Options */}
                              <div className="space-y-2">
                                {question.options.map((option, optionIndex) => {
                                  const isCorrect = question.multipleAnswers
                                    ? Array.isArray(question.correctAnswer) && question.correctAnswer.includes(optionIndex)
                                    : question.correctAnswer === optionIndex;

                                  return (
                                    <div
                                      key={optionIndex}
                                      className={`flex items-center p-3 rounded-lg border-2 transition-colors ${isCorrect
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                      <div className="flex items-center">
                                        {question.multipleAnswers ? (
                                          <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300'
                                            }`}>
                                            {isCorrect && (
                                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            )}
                                          </div>
                                        ) : (
                                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300'
                                            }`}>
                                            {isCorrect && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                                          </div>
                                        )}
                                        <div className={`text-sm ${isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                                          <MathRenderer content={option || `Вариант ${optionIndex + 1} не заполнен`} />
                                        </div>
                                      </div>
                                      {isCorrect && (
                                        <span className="ml-auto text-xs text-green-600 font-medium">
                                          ✓ Правильный ответ
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Question Summary */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <span>
                                    {question.multipleAnswers ? (
                                      <>
                                        Правильных ответов: {
                                          Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 0
                                        }
                                      </>
                                    ) : (
                                      <>
                                        Правильный ответ: {
                                          typeof question.correctAnswer === 'number'
                                            ? `Вариант ${question.correctAnswer + 1}`
                                            : 'Не выбран'
                                        }
                                      </>
                                    )}
                                  </span>
                                  <span>Тип: {question.multipleAnswers ? 'Множественный выбор' : 'Одиночный выбор'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Quiz Footer */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>
                              Общий балл за тест: <strong>{materialForm.quiz.questions.reduce((sum, q) => sum + q.score, 0)}</strong>
                            </span>
                            <span>
                              Всего вопросов: <strong>{materialForm.quiz.questions.length}</strong>
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет тестовых заданий</h3>
                  <p className="text-gray-500 mb-4">
                    {materialForm.quiz?.name
                      ? `Тест "${materialForm.quiz.name}" создан, но не содержит вопросов`
                      : 'Создайте тест для урока'
                    }
                  </p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(true)}
                    >
                      {materialForm.quiz?.name ? 'Добавить вопросы' : 'Создать тест'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Materials Modal */}

      {/* Create Materials Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Добавить материалы урока"
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Lecture Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Содержание лекции
            </label>
            <RichTextEditor
              content={materialForm.lecture || ''}
              onChange={(content) => setMaterialForm({ ...materialForm, lecture: content })}
              onImageUpload={async (file) => {
                try {
                  return await fileService.uploadLessonImage(file);
                } catch (error) {
                  console.error('Error uploading image:', error);
                  throw error;
                }
              }}
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
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Максимальный балл
                  </label>
                  <Input
                    type="number"
                    value={materialForm.quiz?.maxScore || 100}
                    onChange={(e) => setMaterialForm({
                      ...materialForm,
                      quiz: { ...materialForm.quiz!, maxScore: parseInt(e.target.value) || 100 }
                    })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Длительность (минуты)
                  </label>
                  <Input
                    type="number"
                    value={materialForm.quiz?.duration || 30}
                    onChange={(e) => setMaterialForm({
                      ...materialForm,
                      quiz: { ...materialForm.quiz!, duration: parseInt(e.target.value) || 30 }
                    })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Дата начала
                  </label>
                  <input
                    type="datetime-local"
                    value={materialForm.quiz?.startDate || ''}
                    onChange={(e) => setMaterialForm({
                      ...materialForm,
                      quiz: { ...materialForm.quiz!, startDate: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Дата окончания
                  </label>
                  <input
                    type="datetime-local"
                    value={materialForm.quiz?.endDate || ''}
                    onChange={(e) => setMaterialForm({
                      ...materialForm,
                      quiz: { ...materialForm.quiz!, endDate: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={materialForm.quiz?.isActive || false}
                  onChange={(e) => setMaterialForm({
                    ...materialForm,
                    quiz: { ...materialForm.quiz!, isActive: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Тест активен
                </label>
              </div>

              {/* Questions Editor */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Вопросы теста</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить вопрос
                  </Button>
                </div>

                {materialForm.quiz?.questions?.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-800">Вопрос {index + 1}</h5>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={question.multipleAnswers || false}
                            onChange={() => toggleQuestionType(index)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label className="text-xs text-gray-600">Множественный выбор</label>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Текст вопроса
                        </label>
                        <RichTextEditor
                          content={question.question}
                          onChange={(content) => updateQuestion(index, { ...question, question: content })}
                          onImageUpload={async (file) => {
                            try {
                              return await fileService.uploadQuizImage(file);
                            } catch (error) {
                              console.error('Error uploading image:', error);
                              throw error;
                            }
                          }}
                          placeholder="Введите текст вопроса..."
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Варианты ответов
                        </label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {question.multipleAnswers ? (
                                  <input
                                    type="checkbox"
                                    checked={Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(optionIndex) : false}
                                    onChange={() => toggleCorrectAnswer(index, optionIndex)}
                                    className="text-green-600 border-gray-300 rounded focus:ring-green-500"
                                  />
                                ) : (
                                  <input
                                    type="radio"
                                    name={`correct-${index}`}
                                    checked={question.correctAnswer === optionIndex}
                                    onChange={() => toggleCorrectAnswer(index, optionIndex)}
                                    className="text-green-600"
                                  />
                                )}
                                <label className="text-xs font-medium text-gray-700">
                                  Вариант {optionIndex + 1}
                                  {((question.multipleAnswers && Array.isArray(question.correctAnswer) && question.correctAnswer.includes(optionIndex)) ||
                                    (!question.multipleAnswers && question.correctAnswer === optionIndex)) && (
                                    <span className="ml-1 text-green-600">✓ Правильный</span>
                                  )}
                                </label>
                              </div>
                            </div>
                            <RichTextEditor
                              content={option}
                              onChange={(content) => {
                                const newOptions = [...question.options];
                                newOptions[optionIndex] = content;
                                updateQuestion(index, { ...question, options: newOptions });
                              }}
                              onImageUpload={async (file) => {
                                try {
                                  return await fileService.uploadQuizImage(file);
                                } catch (error) {
                                  console.error('Error uploading image:', error);
                                  throw error;
                                }
                              }}
                              placeholder={`Введите текст варианта ${optionIndex + 1}...`}
                              compact={true}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600">Баллы:</label>
                          <input
                            type="number"
                            min="1"
                            value={question.score}
                            onChange={(e) => updateQuestion(index, { ...question, score: parseInt(e.target.value) || 1 })}
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {question.multipleAnswers ? (
                            Array.isArray(question.correctAnswer) && question.correctAnswer.length > 0 ? (
                              `Правильные ответы: ${question.correctAnswer.map(idx => `Вариант ${idx + 1}`).join(', ')}`
                            ) : (
                              'Выберите правильные ответы'
                            )
                          ) : (
                            typeof question.correctAnswer === 'number' ? (
                              `Правильный ответ: Вариант ${question.correctAnswer + 1}`
                            ) : (
                              'Выберите правильный ответ'
                            )
                          )}
                        </div>
                      </div>

                      {question.multipleAnswers && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          💡 Для вопросов с множественным выбором студенты могут выбрать несколько правильных ответов
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {(!materialForm.quiz?.questions || materialForm.quiz.questions.length === 0) && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <HelpCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Нет вопросов. Добавьте вопросы для теста.</p>
                  </div>
                )}
              </div>
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
