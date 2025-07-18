import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaSave, FaUpload, FaVideo, FaImage, FaFileAlt, 
  FaQuestionCircle, FaPlus, FaEdit, FaTrash, FaTimes, FaCheck,
  FaClock, FaGraduationCap, FaBookOpen, FaClipboardList, FaChartBar
} from 'react-icons/fa';
import { useAuth } from '../providers/AuthProvider';
import { 
  lessonsService, 
  Lesson, 
  filesService, 
  FileUploadResponse,
  materialsService,
  Materials,
  CreateLessonMaterialsDto,
  Question as ApiQuestion,
  Answer as ApiAnswer,
  Quiz as ApiQuiz,
  Homework as ApiHomework,
  quizService,
  AnswerType,
  CreateQuestionDto,
  QuestionResponse
} from '../api';
import { motion, AnimatePresence } from 'framer-motion';

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

const LessonMaterialsPage: React.FC = () => {
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
      
      const lessonData = await lessonsService.getById(parseInt(lessonId!));
      setLesson(lessonData);

      // Загружаем существующие материалы урока
      try {
        const existingMaterials = await materialsService.getLessonMaterials(lessonData.id);
        
        if (existingMaterials) {
          // Устанавливаем материалы
          setMaterials({
            lecture: existingMaterials.lecture || '',
            videoUrl: existingMaterials.videoUrl || '',
            presentationUrl: existingMaterials.presentationUrl || '',
          });

          // Устанавливаем квиз, если есть
          if (existingMaterials.quiz) {
            // Конвертируем типы API в локальные типы
            const convertedQuestions: Question[] = (existingMaterials.quiz.questions || []).map(q => ({
              id: q.id,
              text: q.name, // API использует 'name', а локально 'text'
              type: q.type === 'SINGLE_CHOICE' ? 'single' : 
                    q.type === 'MULTIPLE_CHOICE' ? 'multiple' : 'text',
              answers: (q.answers || []).map(a => ({
                id: a.id,
                text: a.name, // API использует 'name', а локально 'text'
                isCorrect: a.isCorrect,
              })),
            }));

            setQuiz({
              id: existingMaterials.quiz.id,
              name: existingMaterials.quiz.name || '',
              duration: existingMaterials.quiz.duration || 30,
              maxScore: existingMaterials.quiz.maxScore || 100,
              questions: convertedQuestions,
              isActive: existingMaterials.quiz.isActive || false,
            });
          }

          // Устанавливаем домашнее задание, если есть
          if (existingMaterials.homework) {
            // Форматируем дату для input datetime-local
            const deadline = existingMaterials.homework.deadline 
              ? new Date(existingMaterials.homework.deadline).toISOString().slice(0, 16)
              : '';
              
            setHomework({
              id: existingMaterials.homework.id,
              name: existingMaterials.homework.name || '',
              description: '', // TODO: добавить description в схему homework
              deadline: deadline,
              files: [], // Файлы будут загружены отдельно
            });
          }
        }
      } catch (materialsError) {
        // Материалы еще не созданы - это нормально
        console.log('No existing materials found for lesson:', lessonData.id);
      }

      // Проверяем права доступа
      if (user?.role === 'TEACHER' && lessonData.studyPlan?.teacher?.user.id !== user.id) {
        setError('У вас нет прав для редактирования материалов этого урока');
        return;
      }
    } catch (err) {
      setError('Ошибка при загрузке урока');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaterials = async () => {
    if (!lesson) return;

    try {
      setLoading(true);
      
      const materialData: CreateLessonMaterialsDto = {
        lecture: materials.lecture || undefined,
        videoUrl: materials.videoUrl || undefined,
        presentationUrl: materials.presentationUrl || undefined,
      };

      await materialsService.createLessonMaterials(lesson.id, materialData);
      alert('Материалы успешно сохранены!');
      
      // Перезагружаем урок, чтобы получить обновленные данные
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

      const quizData = {
        name: quiz.name,
        duration: quiz.duration,
        maxScore: quiz.maxScore,
        isActive: quiz.isActive,
      };

      const materialData: CreateLessonMaterialsDto = {
        quiz: quizData,
      };

      await materialsService.createLessonMaterials(lesson.id, materialData);
      alert('Тест успешно сохранен!');
      
      // Перезагружаем урок
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

      if (!homework.deadline) {
        setError('Срок сдачи обязателен для заполнения');
        return;
      }

      const homeworkData = {
        name: homework.name,
        deadline: homework.deadline,
      };

      const materialData: CreateLessonMaterialsDto = {
        homework: homeworkData,
      };

      await materialsService.createLessonMaterials(lesson.id, materialData);
      alert('Домашнее задание успешно сохранено!');
      
      // Перезагружаем урок
      await loadLesson();
    } catch (err) {
      setError('Ошибка при сохранении домашнего задания');
      console.error('Error saving homework:', err);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setEditingQuestion({
      text: '',
      type: 'single',
      answers: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ],
    });
    setShowQuestionModal(true);
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion({ ...question });
    setShowQuestionModal(true);
  };

  const saveQuestion = async () => {
    if (!editingQuestion || !quiz.id) {
      // Если квиз еще не создан, сохраняем локально
      const questionIndex = quiz.questions.findIndex(q => q.id === editingQuestion?.id);
      if (questionIndex >= 0) {
        // Редактирование существующего вопроса
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[questionIndex] = editingQuestion!;
        setQuiz({ ...quiz, questions: updatedQuestions });
      } else {
        // Добавление нового вопроса
        const newQuestion = { ...editingQuestion!, id: Date.now() };
        setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
      }

      setShowQuestionModal(false);
      setEditingQuestion(null);
      return;
    }

    try {
      setLoading(true);

      // Конвертируем локальные типы в API типы
      const apiQuestion: CreateQuestionDto = {
        name: editingQuestion.text,
        type: editingQuestion.type === 'single' ? AnswerType.SINGLE_CHOICE :
              editingQuestion.type === 'multiple' ? AnswerType.MULTIPLE_CHOICE :
              AnswerType.TEXT,
        answers: editingQuestion.type !== 'text' ? editingQuestion.answers.map(a => ({
          name: a.text,
          isCorrect: a.isCorrect,
        })) : undefined,
      };

      // Добавляем вопрос к существующему квизу
      const savedQuestion = await quizService.addQuestion(quiz.id, apiQuestion);

      // Конвертируем обратно в локальный тип и добавляем к состоянию
      const localQuestion: Question = {
        id: savedQuestion.id,
        text: savedQuestion.name,
        type: savedQuestion.type === AnswerType.SINGLE_CHOICE ? 'single' :
              savedQuestion.type === AnswerType.MULTIPLE_CHOICE ? 'multiple' : 'text',
        answers: savedQuestion.answers.map(a => ({
          id: a.id,
          text: a.name,
          isCorrect: a.isCorrect,
        })),
      };

      setQuiz({ ...quiz, questions: [...quiz.questions, localQuestion] });
      alert('Вопрос успешно сохранен в базу данных!');

    } catch (error) {
      console.error('Error saving question:', error);
      setError('Ошибка при сохранении вопроса');
    } finally {
      setLoading(false);
      setShowQuestionModal(false);
      setEditingQuestion(null);
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('Удалить этот вопрос?')) {
      return;
    }

    // Если у вопроса есть реальный ID (он сохранен в БД), удаляем из БД
    if (questionId > 1000000) { // Временные ID больше 1млн (Date.now())
      // Локальное удаление для несохраненных вопросов
      setQuiz({
        ...quiz,
        questions: quiz.questions.filter(q => q.id !== questionId),
      });
      return;
    }

    try {
      setLoading(true);
      
      // Удаляем вопрос из базы данных
      await quizService.removeQuestion(questionId);
      
      // Убираем вопрос из локального состояния
      setQuiz({
        ...quiz,
        questions: quiz.questions.filter(q => q.id !== questionId),
      });
      
      alert('Вопрос успешно удален из базы данных!');
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Ошибка при удалении вопроса');
    } finally {
      setLoading(false);
    }
  };

  const addAnswer = () => {
    if (editingQuestion) {
      setEditingQuestion({
        ...editingQuestion,
        answers: [...editingQuestion.answers, { text: '', isCorrect: false }],
      });
    }
  };

  const updateAnswer = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    if (editingQuestion) {
      const updatedAnswers = [...editingQuestion.answers];
      updatedAnswers[index] = { ...updatedAnswers[index], [field]: value };

      // Для single choice - только один правильный ответ
      if (field === 'isCorrect' && value === true && editingQuestion.type === 'single') {
        updatedAnswers.forEach((answer, i) => {
          if (i !== index) answer.isCorrect = false;
        });
      }

      setEditingQuestion({ ...editingQuestion, answers: updatedAnswers });
    }
  };

  const removeAnswer = (index: number) => {
    if (editingQuestion && editingQuestion.answers.length > 2) {
      const updatedAnswers = editingQuestion.answers.filter((_, i) => i !== index);
      setEditingQuestion({ ...editingQuestion, answers: updatedAnswers });
    }
  };

  // Функции для загрузки файлов
  const handleVideoUpload = () => {
    videoFileInputRef.current?.click();
  };

  const handlePresentationUpload = () => {
    presentationFileInputRef.current?.click();
  };

  const handleHomeworkFileUpload = () => {
    homeworkFileInputRef.current?.click();
  };

  const onVideoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const uploadedFile = await filesService.uploadFile(file, 'video');
        setMaterials({ 
          ...materials, 
          videoUrl: uploadedFile.url 
        });
        alert(`Видео успешно загружено: ${uploadedFile.originalName}`);
      } catch (error) {
        console.error('Error uploading video:', error);
        setError('Ошибка при загрузке видео файла');
      } finally {
        setLoading(false);
      }
    }
  };

  const onPresentationFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const uploadedFile = await filesService.uploadFile(file, 'presentation');
        setMaterials({ 
          ...materials, 
          presentationUrl: uploadedFile.url 
        });
        alert(`Презентация успешно загружена: ${uploadedFile.originalName}`);
      } catch (error) {
        console.error('Error uploading presentation:', error);
        setError('Ошибка при загрузке презентации');
      } finally {
        setLoading(false);
      }
    }
  };

  const onHomeworkFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      try {
        setLoading(true);
        const uploadedFiles = await filesService.uploadFiles(files, 'homework');
        
        // Добавляем загруженные файлы к существующим
        setHomework({ 
          ...homework, 
          files: [...homework.files, ...files]
        });
        
        const fileNames = uploadedFiles.map(f => f.originalName).join(', ');
        alert(`Файлы успешно загружены: ${fileNames}`);
      } catch (error) {
        console.error('Error uploading homework files:', error);
        setError('Ошибка при загрузке файлов домашнего задания');
      } finally {
        setLoading(false);
      }
    }
  };

  // Drag & Drop для файлов ДЗ
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      try {
        setLoading(true);
        const uploadedFiles = await filesService.uploadFiles(files, 'homework');
        
        // Добавляем файлы к существующим
        setHomework({ 
          ...homework, 
          files: [...homework.files, ...files]
        });
        
        const fileNames = uploadedFiles.map(f => f.originalName).join(', ');
        alert(`Файлы успешно загружены: ${fileNames}`);
      } catch (error) {
        console.error('Error uploading dropped files:', error);
        setError('Ошибка при загрузке файлов');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !lesson) {
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
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 mr-4"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Материалы урока</h1>
          {lesson && (
            <p className="text-gray-600 mt-1">
              {lesson.name} - {new Date(lesson.date).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>
      </div>

      {/* Табы */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'materials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaBookOpen className="inline mr-2" />
            Материалы
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'quiz'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaQuestionCircle className="inline mr-2" />
            Тесты и квизы
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'homework'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaClipboardList className="inline mr-2" />
            Домашние задания
          </button>
        </nav>
      </div>

      {/* Контент табов */}
      <AnimatePresence mode="wait">
        {activeTab === 'materials' && (
          <motion.div
            key="materials"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Лекция</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Текст лекции
                  </label>
                  <textarea
                    value={materials.lecture}
                    onChange={(e) => setMaterials({ ...materials, lecture: e.target.value })}
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите содержание лекции..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Видео материалы</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaVideo className="inline mr-2" />
                    URL видео
                  </label>
                  <input
                    type="url"
                    value={materials.videoUrl}
                    onChange={(e) => setMaterials({ ...materials, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={handleVideoUpload}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                  >
                    <FaUpload className="mr-2" />
                    Загрузить видео
                  </button>
                  <span className="text-sm text-gray-500">или укажите URL видео выше</span>
                </div>
                {/* Скрытый input для видео */}
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={onVideoFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Презентация</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaImage className="inline mr-2" />
                    URL презентации
                  </label>
                  <input
                    type="url"
                    value={materials.presentationUrl}
                    onChange={(e) => setMaterials({ ...materials, presentationUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://docs.google.com/presentation/d/..."
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={handlePresentationUpload}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                  >
                    <FaUpload className="mr-2" />
                    Загрузить презентацию
                  </button>
                  <span className="text-sm text-gray-500">Поддерживаются: PDF, PPT, PPTX</span>
                </div>
                {/* Скрытый input для презентации */}
                <input
                  ref={presentationFileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx,.odp"
                  onChange={onPresentationFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveMaterials}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
              >
                <FaSave className="mr-2" />
                Сохранить материалы
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow p-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите название теста"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaClock className="inline mr-2" />
                    Время (минуты)
                  </label>
                  <input
                    type="number"
                    value={quiz.duration}
                    onChange={(e) => setQuiz({ ...quiz, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaGraduationCap className="inline mr-2" />
                    Максимальный балл
                  </label>
                  <input
                    type="number"
                    value={quiz.maxScore}
                    onChange={(e) => setQuiz({ ...quiz, maxScore: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Тест активен (доступен студентам)
                </label>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Вопросы ({quiz.questions.length})</h3>
                <button
                  onClick={addQuestion}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Добавить вопрос
                </button>
              </div>

              {quiz.questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaQuestionCircle className="mx-auto text-4xl mb-4" />
                  <p>Вопросы еще не добавлены</p>
                  <p className="text-sm">Нажмите "Добавить вопрос" чтобы создать первый вопрос</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                              Вопрос {index + 1}
                            </span>
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              {question.type === 'single' ? 'Один ответ' : 
                               question.type === 'multiple' ? 'Несколько ответов' : 'Текстовый'}
                            </span>
                          </div>
                          <p className="font-medium">{question.text}</p>
                          {question.type !== 'text' && (
                            <ul className="mt-2 space-y-1">
                              {question.answers.map((answer, ansIndex) => (
                                <li key={ansIndex} className="flex items-center text-sm">
                                  <span className={`mr-2 ${answer.isCorrect ? 'text-green-600' : 'text-gray-400'}`}>
                                    {answer.isCorrect ? '✓' : '○'}
                                  </span>
                                  {answer.text}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editQuestion(question)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => deleteQuestion(question.id!)}
                            className="text-red-600 hover:text-red-800"
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

            <div className="flex justify-between">
              <div>
                {quiz.id && (
                  <button
                    onClick={() => navigate(`/quiz/${quiz.id}/statistics`)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                  >
                    <FaChartBar className="mr-2" />
                    Посмотреть статистику
                  </button>
                )}
              </div>
              <button
                onClick={handleSaveQuiz}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
              >
                <FaSave className="mr-2" />
                Сохранить тест
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'homework' && (
          <motion.div
            key="homework"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow p-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Дополнительные файлы</h3>
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <FaFileAlt className="mx-auto text-3xl text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Перетащите файлы сюда или</p>
                  <button 
                    onClick={handleHomeworkFileUpload}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
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
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center">
                            <FaFileAlt className="text-blue-500 mr-2" />
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
                            className="text-red-500 hover:text-red-700"
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
              <button
                onClick={handleSaveHomework}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
              >
                <FaSave className="mr-2" />
                Сохранить задание
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно редактирования вопроса */}
      <AnimatePresence>
        {showQuestionModal && editingQuestion && (
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
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="text-sm text-blue-600 hover:text-blue-800"
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
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder={`Вариант ответа ${index + 1}`}
                            />
                            {editingQuestion.answers.length > 2 && (
                              <button
                                onClick={() => removeAnswer(index)}
                                className="text-red-600 hover:text-red-800 flex-shrink-0"
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
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <FaTimes className="mr-2 inline" />
                    Отмена
                  </button>
                  <button
                    onClick={saveQuestion}
                    disabled={!editingQuestion.text || (editingQuestion.type !== 'text' && editingQuestion.answers.every(a => !a.text))}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaCheck className="mr-2 inline" />
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

export default LessonMaterialsPage;
