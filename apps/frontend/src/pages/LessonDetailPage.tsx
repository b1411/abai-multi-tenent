import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaVideo, FaFile, FaClipboardCheck, FaSpinner, FaPlay, FaPause, FaExpand } from 'react-icons/fa';
import MathRenderer from '../components/MathRenderer';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  presentationUrl?: string;
  testUrl?: string;
  scheduledDate: string;
  presentation?: {
    slides: Array<{
      id: number;
      imageUrl: string;
      title: string;
    }>;
  };
  test?: {
    questions: Array<{
      id: number;
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
  };
}

const LessonDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id, lessonId } = useParams();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'presentation' | 'test'>('content');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    const loadLesson = async () => {
      setIsLoading(true);
      try {
        // Имитация загрузки данных
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Тестовые данные
        setLesson({
          id: lessonId || '1',
          title: 'Теорема Виета',
          description: 'Связь между корнями квадратного уравнения и его коэффициентами',
          content: `
            <h2>Теорема Виета</h2>
            <p>Если квадратное уравнение $ax^2 + bx + c = 0$ имеет корни $x_1$ и $x_2$, то:</p>
            <div>
              <p>$x_1 + x_2 = -\\frac{b}{a}$</p>
              <p>$x_1 \\cdot x_2 = \\frac{c}{a}$</p>
            </div>
            <h3>Применение теоремы</h3>
            <p>Теорема Виета позволяет:</p>
            <ul>
              <li>Находить сумму и произведение корней без решения уравнения</li>
              <li>Составлять квадратное уравнение по известным корням</li>
              <li>Решать задачи на нахождение корней уравнения</li>
            </ul>
            <h3>Примеры решения</h3>
            <p>Рассмотрим уравнение: $x^2 - 5x + 6 = 0$</p>
            <p>По теореме Виета:</p>
            <div>
              <p>$x_1 + x_2 = 5$</p>
              <p>$x_1 \\cdot x_2 = 6$</p>
            </div>
            <p>Отсюда можно определить, что корни уравнения: $x_1 = 2$ и $x_2 = 3$</p>
          `,
          videoUrl: 'https://example.com/video.mp4',
          presentationUrl: 'https://example.com/presentation.pdf',
          testUrl: 'https://example.com/test',
          scheduledDate: '2024-04-05T12:15:00',
          presentation: {
            slides: [
              { id: 1, imageUrl: '/slides/1.jpg', title: 'Введение в теорему Виета' },
              { id: 2, imageUrl: '/slides/2.jpg', title: 'Формулировка теоремы' },
              { id: 3, imageUrl: '/slides/3.jpg', title: 'Примеры применения' },
              { id: 4, imageUrl: '/slides/4.jpg', title: 'Практические задачи' }
            ]
          },
          test: {
            questions: [
              {
                id: 1,
                question: 'Чему равна сумма корней уравнения $x^2 - 5x + 6 = 0$?',
                options: ['3', '4', '5', '6'],
                correctAnswer: 2
              },
              {
                id: 2,
                question: 'Чему равно произведение корней уравнения $x^2 - 5x + 6 = 0$?',
                options: ['4', '5', '6', '7'],
                correctAnswer: 2
              }
            ]
          }
        });
        setError(null);
      } catch (err) {
        setError('Ошибка при загрузке урока');
        console.error('Error loading lesson:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  const handleBack = () => {
    const basePath = location.pathname.includes('/academic') ? '/academic/study-plans' : '/study-plans';
    navigate(`${basePath}/${id}`);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
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
            className="mt-2 text-sm text-red-600 hover:text-red-500"
          >
            Вернуться к учебному плану
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft className="mr-2" />
          Назад к учебному плану
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
              <p className="text-gray-600">{lesson.description}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center px-4 py-2 rounded-md ${
                  activeTab === 'video' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <FaVideo className="mr-2" />
                <span>Видео</span>
              </button>
              <button
                onClick={() => setActiveTab('presentation')}
                className={`flex items-center px-4 py-2 rounded-md ${
                  activeTab === 'presentation' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                <FaFile className="mr-2" />
                <span>Презентация</span>
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`flex items-center px-4 py-2 rounded-md ${
                  activeTab === 'test' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                <FaClipboardCheck className="mr-2" />
                <span>Тест</span>
              </button>
            </div>
          </div>

          {activeTab === 'content' && (
            <div className="prose max-w-none">
              <MathRenderer content={lesson.content} />
            </div>
          )}

          {activeTab === 'video' && (
            <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
              <div className="relative">
                <video
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  controls
                  poster="/video-poster.jpg"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <button
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                      className="p-2 hover:bg-white/20 rounded-full"
                    >
                      {isVideoPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button className="p-2 hover:bg-white/20 rounded-full">
                      <FaExpand />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presentation' && lesson.presentation && (
            <div className="space-y-4">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={lesson.presentation.slides[currentSlide].imageUrl}
                  alt={`Слайд ${currentSlide + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md disabled:opacity-50"
                >
                  Предыдущий слайд
                </button>
                <span className="text-gray-600">
                  Слайд {currentSlide + 1} из {lesson.presentation.slides.length}
                </span>
                <button
                  onClick={() => setCurrentSlide(Math.min((lesson.presentation?.slides.length || 0) - 1, currentSlide + 1))}
                  disabled={currentSlide === (lesson.presentation?.slides.length || 0) - 1}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md disabled:opacity-50"
                >
                  Следующий слайд
                </button>
              </div>
            </div>
          )}

          {activeTab === 'test' && lesson.test && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">
                  Вопрос {currentQuestion + 1} из {lesson.test?.questions.length}
                </h3>
                <div className="text-lg mb-4">
                  <MathRenderer content={lesson.test?.questions[currentQuestion].question || ''} />
                </div>
                <div className="space-y-2">
                  {lesson.test?.questions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setAnswers({ ...answers, [currentQuestion]: index })}
                      className={`w-full text-left p-4 rounded-lg border ${
                        answers[currentQuestion] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      <MathRenderer content={option} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md disabled:opacity-50"
                >
                  Предыдущий вопрос
                </button>
                <button
                  onClick={() => setCurrentQuestion(Math.min((lesson.test?.questions.length || 0) - 1, currentQuestion + 1))}
                  disabled={currentQuestion === (lesson.test?.questions.length || 0) - 1}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
                >
                  Следующий вопрос
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetailPage; 