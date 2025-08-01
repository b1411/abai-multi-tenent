import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaClock, FaRedo } from 'react-icons/fa';
import QuizEditor, { QuizQuestion } from './QuizEditor';
import fileService from '../services/fileService';

interface QuizMaterialEditorProps {
  quiz?: {
    questions: QuizQuestion[];
    timeLimit?: number;
    maxAttempts?: number;
  };
  onSave: (quizData: {
    questions: QuizQuestion[];
    timeLimit?: number;
    maxAttempts?: number;
  }) => void;
  onClose: () => void;
}

const QuizMaterialEditor: React.FC<QuizMaterialEditorProps> = ({
  quiz,
  onSave,
  onClose
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz?.questions || []);
  const [timeLimit, setTimeLimit] = useState<number>(quiz?.timeLimit || 0);
  const [maxAttempts, setMaxAttempts] = useState<number>(quiz?.maxAttempts || 1);
  const [saving, setSaving] = useState(false);

  // Инициализация пустого вопроса если нет вопросов
  useEffect(() => {
    if (questions.length === 0) {
      const initialQuestion: QuizQuestion = {
        id: Date.now().toString(),
        name: '',
        type: 'SINGLE_CHOICE',
        points: 1,
        answers: [
          { id: Date.now().toString() + '1', name: '', isCorrect: true },
          { id: Date.now().toString() + '2', name: '', isCorrect: false },
        ]
      };
      setQuestions([initialQuestion]);
    }
  }, []);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const validation = fileService.validateFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      return await fileService.uploadQuizImage(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    // Валидация
    if (questions.length === 0) {
      alert('Необходимо добавить хотя бы один вопрос');
      return;
    }

    const hasEmptyQuestions = questions.some(q => !q.name.trim());
    if (hasEmptyQuestions) {
      alert('Все вопросы должны содержать текст');
      return;
    }

    const hasQuestionsWithoutAnswers = questions.some(q => 
      q.type !== 'TEXT' && (!q.answers || q.answers.length === 0)
    );
    if (hasQuestionsWithoutAnswers) {
      alert('Все вопросы должны содержать варианты ответов');
      return;
    }

    const hasQuestionsWithoutCorrectAnswers = questions.some(q => 
      q.type !== 'TEXT' && !q.answers.some(a => a.isCorrect)
    );
    if (hasQuestionsWithoutCorrectAnswers) {
      alert('Для каждого вопроса должен быть выбран правильный ответ');
      return;
    }

    const hasEmptyAnswers = questions.some(q => 
      q.type !== 'TEXT' && q.answers.some(a => !a.name.trim())
    );
    if (hasEmptyAnswers) {
      alert('Все варианты ответов должны содержать текст');
      return;
    }

    setSaving(true);
    
    try {
      const quizData = {
        questions,
        timeLimit: timeLimit > 0 ? timeLimit : undefined,
        maxAttempts: maxAttempts > 0 ? maxAttempts : undefined,
      };

      onSave(quizData);
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Ошибка при сохранении теста');
    } finally {
      setSaving(false);
    }
  };

  const getTotalPoints = () => {
    return questions.reduce((total, question) => total + (question.points || 1), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden animate-fadeIn">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {quiz ? 'Редактировать тест' : 'Создать тест'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Вопросов: {questions.length} • Всего баллов: {getTotalPoints()}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            title="Закрыть"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Настройки теста */}
        <div className="p-6 border-b border-gray-200 bg-blue-50">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Настройки теста</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaClock className="inline mr-2" />
                Ограничение по времени (минуты)
              </label>
              <input
                type="number"
                min="0"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0 = без ограничения"
              />
              <p className="text-xs text-gray-500 mt-1">
                0 означает отсутствие ограничения по времени
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaRedo className="inline mr-2" />
                Максимальное количество попыток
              </label>
              <input
                type="number"
                min="1"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Количество попыток прохождения теста для каждого студента
              </p>
            </div>
          </div>
        </div>

        {/* Контент - редактор вопросов */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(95vh - 200px)' }}>
          <QuizEditor
            questions={questions}
            onChange={setQuestions}
            onImageUpload={handleImageUpload}
          />
        </div>

        {/* Футер с кнопками */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Статистика:</span>
            <span className="ml-2">
              {questions.length} {questions.length === 1 ? 'вопрос' : 
                questions.length <= 4 ? 'вопроса' : 'вопросов'} • 
              {getTotalPoints()} {getTotalPoints() === 1 ? 'балл' : 
                getTotalPoints() <= 4 ? 'балла' : 'баллов'}
            </span>
            {timeLimit > 0 && (
              <span className="ml-2">• {timeLimit} мин</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Отмена
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || questions.length === 0}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaSave className="mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить тест'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizMaterialEditor;
