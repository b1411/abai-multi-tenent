import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaUpload, FaFileAlt,
  FaQuestionCircle, FaPlus, FaEdit, FaTrash, FaTimes, FaCheck,
  FaClock, FaGraduationCap, FaBookOpen, FaClipboardList
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import { formatDate } from '../utils';

interface Question {
  id?: number;
  text: string;
  type: 'single' | 'multiple' | 'text';
  answers: Answer[];
}

interface Answer {
  id?: number;
  text: string;
  isCorrect: boolean;
}

interface Quiz {
  id?: number;
  name: string;
  duration: number; // минуты
  maxScore: number;
  questions: Question[];
  isActive: boolean;
}

interface Homework {
  id?: number;
  name: string;
  description: string;
  deadline: string;
  files: File[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  presentationUrl?: string;
  testUrl?: string;
  scheduledDate: string;
  studyPlan?: {
    id: number;
    name: string;
    teacher?: {
      user: {
        id: number;
        name: string;
        surname: string;
      };
    };
  };
}

const LessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'quiz' | 'homework'>('materials');

  // Состояние материалов
  const [materials, setMaterials] = useState({
    lecture: '',
    videoUrl: '',
    presentationUrl: '',
  });

  // Состояние квиза
  const [quiz, setQuiz] = useState<Quiz>({
    name: '',
    duration: 30,
    maxScore: 100,
    questions: [],
    isActive: false,
  });

  // Состояние домашнего задания
  const [homework, setHomework] = useState<Homework>({
    name: '',
    description: '',
    deadline: '',
    files: [],
  });

  // Состояние для редактирования вопроса
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Refs для загрузки файлов
  const videoFileInputRef = React.useRef<HTMLInputElement>(null);
  const presentationFileInputRef = React.useRef<HTMLInputElement>(null);
  const homeworkFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      setError(null);

      // Временные данные - заменить на API вызовы
      const lessonData: Lesson = {
        id: lessonId || '1',
        title: 'Теорема Виета',
        description: 'Связь между корнями квадратного уравнения и его коэффициентами',
        content: `
          <h2>Теорема Виета</h2>
          <p>Если квадратное уравнение ax² + bx + c = 0 имеет корни x₁ и x₂, то:</p>
          <div>
            <p>x₁ + x₂ = -b/a</p>
            <p>x₁ · x₂ = c/a</p>
          </div>
          <h3>Применение теоремы</h3>
          <p>Теорема Виета позволяет:</p>
          <ul>
            <li>Находить сумму и произведение корней без решения уравнения</li>
            <li>Составлять квадратное уравнение по известным корням</li>
            <li>Решать задачи на нахождение корней уравнения</li>
          </ul>
        `,
        videoUrl: 'https://example.com/video.mp4',
        presentationUrl: 'https://example.com/presentation.pdf',
        testUrl: 'https://example.com/test',
        scheduledDate: '2024-04-05T12:15:00',
        studyPlan: {
          id: 1,
          name: 'Математический анализ',
          teacher: {
            user: {
              id: 1,
              name: 'Иван',
              surname: 'Иванов'
            }
          }
        }
      };

      setLesson(lessonData);

      // Устанавливаем материалы
      setMaterials({
        lecture: lessonData.content || '',
        videoUrl: lessonData.videoUrl || '',
        presentationUrl: lessonData.presentationUrl || '',
      });

      // Проверяем права доступа - заменено на RBAC проверку на уровне компонентов
      // Проверки владения будут выполняться через PermissionGuard компоненты
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

  const handleSaveMaterials = async () => {
    if (!lesson) return;

    try {
      setLoading(true);
      // Здесь будет API вызов для сохранения материалов
      alert('Материалы успешно сохранены!');
      await loadLesson();
    } catch (err) {
      setError('Ошибка при сохранении материалов');
      console.error('Error saving materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!lesson) return;

    try {
      setLoading(true);

      if (!quiz.name.trim()) {
        setError('Название теста обязательно для заполнения');
        return;
      }

      // Здесь будет API вызов для сохранения квиза
      alert('Тест успешно сохранен!');
      await loadLesson();
    } catch (err) {
      setError('Ошибка при сохранении теста');
      console.error('Error saving quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHomework = async () => {
    if (!lesson) return;

    try {
      setLoading(true);

      if (!homework.name.trim()) {
        setError('Название домашнего задания обязательно для заполнения');
        return;
      }

      // Здесь будет API вызов для сохранения ДЗ
      alert('Домашнее задание успешно сохранено!');
      await loadLesson();
    } catch (err) {
      setError('Ошибка при сохранении домашнего задания');
      console.error('Error saving homework:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoFileUpload = () => {
    videoFileInputRef.current?.click();
  };

  const handlePresentationFileUpload = () => {
    presentationFileInputRef.current?.click();
  };

  const handleHomeworkFileUpload = () => {
    homeworkFileInputRef.current?.click();
  };

  const onVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Здесь будет загрузка видео файла
      console.log('Selected video file:', file);
    }
  };

  const onPresentationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Здесь будет загрузка презентации
      console.log('Selected presentation file:', file);
    }
  };

  const onHomeworkFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setHomework({ ...homework, files: [...homework.files, ...files] });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setHomework({ ...homework, files: [...homework.files, ...files] });
    }
  };

  // Функции для работы с квизом
  const addQuestion = () => {
    const newQuestion: Question = {
      text: '',
      type: 'single',
      answers: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]
    };
    setEditingQuestion(newQuestion);
    setShowQuestionModal(true);
  };

  const editQuestion = (index: number) => {
    setEditingQuestion({ ...quiz.questions[index] });
    setShowQuestionModal(true);
  };

  const deleteQuestion = (index: number) => {
    if (confirm('Удалить этот вопрос?')) {
      const updatedQuestions = quiz.questions.filter((_, i) => i !== index);
      setQuiz({ ...quiz, questions: updatedQuestions });
    }
  };

  const saveQuestion = () => {
    if (!editingQuestion) return;

    if (!editingQuestion.text.trim()) {
      alert('Введите текст вопроса');
      return;
    }

    if (editingQuestion.type !== 'text' && editingQuestion.answers.every(a => !a.text.trim())) {
      alert('Добавьте хотя бы один вариант ответа');
      return;
    }

    if (editingQuestion.type !== 'text' && !editingQuestion.answers.some(a => a.isCorrect)) {
      alert('Отметьте правильный ответ');
      return;
    }

    let updatedQuestions;
    if (editingQuestion.id) {
      // Редактирование существующего вопроса
      updatedQuestions = quiz.questions.map(q =>
        q.id === editingQuestion.id ? editingQuestion : q
      );
    } else {
      // Добавление нового вопроса
      const newQuestion = { ...editingQuestion, id: Date.now() };
      updatedQuestions = [...quiz.questions, newQuestion];
    }

    setQuiz({ ...quiz, questions: updatedQuestions });
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const addAnswer = () => {
    if (!editingQuestion) return;
    
    const newAnswer: Answer = { text: '', isCorrect: false };
    setEditingQuestion({
      ...editingQuestion,
      answers: [...editingQuestion.answers, newAnswer]
    });
  };

  const removeAnswer = (index: number) => {
    if (!editingQuestion || editingQuestion.answers.length <= 2) return;
    
    const updatedAnswers = editingQuestion.answers.filter((_, i) => i !== index);
    setEditingQuestion({ ...editingQuestion, answers: updatedAnswers });
  };

  const updateAnswer = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    if (!editingQuestion) return;

    const updatedAnswers = editingQuestion.answers.map((answer, i) => {
      if (i === index) {
        if (field === 'isCorrect' && value && editingQuestion.type === 'single') {
          // Для одиночного выбора снимаем отметки с других ответов
          return { ...answer, [field]: Boolean(value) };
        }
        return { ...answer, [field]: field === 'isCorrect' ? Boolean(value) : value };
      } else if (field === 'isCorrect' && value && editingQuestion.type === 'single') {
        // Для одиночного выбора снимаем отметки с других ответов
        return { ...answer, isCorrect: false };
      }
      return answer;
    });

    setEditingQuestion({ ...editingQuestion, answers: updatedAnswers });
  };

  if (loading && !lesson) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <FaGraduationCap className="w-8 h-8 text-corporate-primary animate-spin" />
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

        <div className="bg-white rounded-lg shadow-notion p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
              <p className="text-gray-600 mb-2">{lesson.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <FaClock className="mr-2" />
                Дата проведения: {formatDate(lesson.scheduledDate)}
              </div>
            </div>
            {lesson.studyPlan && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Учебный план</div>
                <div className="font-medium">{lesson.studyPlan.name}</div>
                {lesson.studyPlan.teacher && (
                  <div className="text-sm text-gray-500">
                    {lesson.studyPlan.teacher.user.surname} {lesson.studyPlan.teacher.user.name}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="bg-white rounded-lg shadow-notion">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('materials')}
              className={`py-4 px-1 border-b-2 font-medium text-sm button-hover ${
                activeTab === 'materials'
                  ? 'border-corporate-primary text-corporate-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaBookOpen className="inline mr-2" />
              Материалы урока
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`py-4 px-1 border-b-2 font-medium text-sm button-hover ${
                activeTab === 'quiz'
                  ? 'border-corporate-primary text-corporate-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaQuestionCircle className="inline mr-2" />
              Тест
            </button>
            <button
              onClick={() => setActiveTab('homework')}
              className={`py-4 px-1 border-b-2 font-medium text-sm button-hover ${
                activeTab === 'homework'
                  ? 'border-corporate-primary text-corporate-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaClipboardList className="inline mr-2" />
              Домашнее задание
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Контент материалов */}
          {activeTab === 'materials' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Лекционный материал */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Лекционный материал</h3>
                <textarea
                  value={materials.lecture}
                  onChange={(e) => setMaterials({ ...materials, lecture: e.target.value })}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Введите текст лекции..."
                />
              </div>

              {/* Видео */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Видеоматериалы</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL видео
                    </label>
                    <input
                      type="url"
                      value={materials.videoUrl}
                      onChange={(e) => setMaterials({ ...materials, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div className="text-center">
                    <button
                      onClick={handleVideoFileUpload}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 button-hover"
                    >
                      <FaUpload className="mr-2 inline" />
                      Загрузить видео файл
                    </button>
                  </div>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={onVideoFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Презентация */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Презентация</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL презентации
                    </label>
                    <input
                      type="url"
                      value={materials.presentationUrl}
                      onChange={(e) => setMaterials({ ...materials, presentationUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com/presentation.pdf"
                    />
                  </div>
                  <div className="text-center">
                    <button
                      onClick={handlePresentationFileUpload}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 button-hover"
                    >
                      <FaUpload className="mr-2 inline" />
                      Загрузить презентацию
                    </button>
                  </div>
                  <input
                    ref={presentationFileInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={onPresentationFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <PermissionGuard module="materials" action="update">
                  <button
                    onClick={handleSaveMaterials}
                    disabled={loading}
                    className="px-6 py-2 bg-corporate-primary text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center button-hover"
                  >
                    <FaSave className="mr-2" />
                    Сохранить материалы
                  </button>
                </PermissionGuard>
              </div>
            </div>
          )}

          {/* Контент квиза */}
          {activeTab === 'quiz' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Настройки теста</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название теста
                    </label>
                    <input
                      type="text"
                      value={quiz.name}
                      onChange={(e) => setQuiz({ ...quiz, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Введите название теста"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Время (минуты)
                    </label>
                    <input
                      type="number"
                      value={quiz.duration}
                      onChange={(e) => setQuiz({ ...quiz, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Максимальный балл
                    </label>
                    <input
                      type="number"
                      value={quiz.maxScore}
                      onChange={(e) => setQuiz({ ...quiz, maxScore: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quiz.isActive}
                      onChange={(e) => setQuiz({ ...quiz, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Тест активен</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Вопросы</h3>
                  <button
                    onClick={addQuestion}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 button-hover"
                  >
                    <FaPlus className="mr-2 inline" />
                    Добавить вопрос
                  </button>
                </div>

                {quiz.questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaQuestionCircle className="mx-auto text-4xl mb-4" />
                    <p>Вопросы еще не добавлены</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quiz.questions.map((question, index) => (
                      <div key={question.id || index} className="bg-white p-4 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">
                              {index + 1}. {question.text}
                            </div>
                            <div className="text-sm text-gray-500">
                              Тип: {question.type === 'single' ? 'Один ответ' : 
                                    question.type === 'multiple' ? 'Несколько ответов' : 'Текстовый ответ'}
                            </div>
                            {question.type !== 'text' && (
                              <div className="mt-2 text-sm">
                                {question.answers.map((answer, answerIndex) => (
                                  <div key={answerIndex} className="flex items-center">
                                    <span className={answer.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                      • {answer.text}
                                    </span>
                                    {answer.isCorrect && <FaCheck className="ml-2 text-green-600" />}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => editQuestion(index)}
                              className="text-blue-600 hover:text-blue-800 button-hover"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteQuestion(index)}
                              className="text-red-600 hover:text-red-800 button-hover"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <PermissionGuard module="quiz" action="create">
                  <button
                    onClick={handleSaveQuiz}
                    disabled={loading}
                    className="px-6 py-2 bg-corporate-primary text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center button-hover"
                  >
                    <FaSave className="mr-2" />
                    Сохранить тест
                  </button>
                </PermissionGuard>
              </div>
            </div>
          )}

          {/* Контент домашнего задания */}
          {activeTab === 'homework' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Домашнее задание</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название задания
                    </label>
                    <input
                      type="text"
                      value={homework.name}
                      onChange={(e) => setHomework({ ...homework, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Введите название домашнего задания"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Описание задания
                    </label>
                    <textarea
                      value={homework.description}
                      onChange={(e) => setHomework({ ...homework, description: e.target.value })}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Опишите что нужно сделать в домашнем задании..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Срок сдачи
                    </label>
                    <input
                      type="datetime-local"
                      value={homework.deadline}
                      onChange={(e) => setHomework({ ...homework, deadline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Дополнительные файлы</h3>
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <FaFileAlt className="mx-auto text-3xl text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Перетащите файлы сюда или</p>
                    <button
                      onClick={handleHomeworkFileUpload}
                      className="px-4 py-2 bg-corporate-primary text-white rounded-md hover:bg-purple-700 button-hover"
                    >
                      Выберите файлы
                    </button>
                    <p className="text-sm text-gray-500 mt-2">Поддерживаются: PDF, DOC, DOCX, изображения</p>
                  </div>

                  {/* Отображение загруженных файлов */}
                  {homework.files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Загруженные файлы:</h4>
                      <div className="space-y-2">
                        {homework.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md">
                            <div className="flex items-center">
                              <FaFileAlt className="text-corporate-primary mr-2" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const updatedFiles = homework.files.filter((_, i) => i !== index);
                                setHomework({ ...homework, files: updatedFiles });
                              }}
                              className="text-red-500 hover:text-red-700 button-hover"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Скрытый input для файлов ДЗ */}
                  <input
                    ref={homeworkFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    multiple
                    onChange={onHomeworkFilesChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <PermissionGuard module="homework" action="create">
                  <button
                    onClick={handleSaveHomework}
                    disabled={loading}
                    className="px-6 py-2 bg-corporate-primary text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center button-hover"
                  >
                    <FaSave className="mr-2" />
                    Сохранить задание
                  </button>
                </PermissionGuard>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно редактирования вопроса */}
      {showQuestionModal && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingQuestion.id ? 'Редактировать вопрос' : 'Добавить вопрос'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Текст вопроса
                  </label>
                  <textarea
                    value={editingQuestion.text}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Введите текст вопроса"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип вопроса
                  </label>
                  <select
                    value={editingQuestion.type}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      type: e.target.value as 'single' | 'multiple' | 'text'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="single">Один правильный ответ</option>
                    <option value="multiple">Несколько правильных ответов</option>
                    <option value="text">Текстовый ответ</option>
                  </select>
                </div>

                {editingQuestion.type !== 'text' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Варианты ответов
                      </label>
                      <button
                        onClick={addAnswer}
                        className="text-sm text-corporate-primary hover:text-purple-800 button-hover"
                      >
                        + Добавить вариант
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editingQuestion.answers.map((answer, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type={editingQuestion.type === 'single' ? 'radio' : 'checkbox'}
                            name="correct-answer"
                            checked={answer.isCorrect}
                            onChange={(e) => updateAnswer(index, 'isCorrect', e.target.checked)}
                            className="flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={answer.text}
                            onChange={(e) => updateAnswer(index, 'text', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder={`Вариант ответа ${index + 1}`}
                          />
                          {editingQuestion.answers.length > 2 && (
                            <button
                              onClick={() => removeAnswer(index)}
                              className="text-red-600 hover:text-red-800 flex-shrink-0 button-hover"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {editingQuestion.type === 'single'
                        ? 'Отметьте один правильный ответ'
                        : 'Отметьте все правильные ответы'
                      }
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 button-hover"
                >
                  <FaTimes className="mr-2 inline" />
                  Отмена
                </button>
                <button
                  onClick={saveQuestion}
                  disabled={!editingQuestion.text || (editingQuestion.type !== 'text' && editingQuestion.answers.every(a => !a.text))}
                  className="px-4 py-2 bg-corporate-primary text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed button-hover"
                >
                  <FaCheck className="mr-2 inline" />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPage;
