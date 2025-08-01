import React, { useState, useCallback } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaImage, 
  FaSave, 
  FaTimes,
  FaGripVertical,
  FaCheck
} from 'react-icons/fa';
import RichTextEditor from './RichTextEditor';

export interface QuizQuestion {
  id: string;
  name: string;
  description?: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';
  imageUrl?: string;
  points?: number;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  name: string;
  isCorrect: boolean;
  imageUrl?: string;
}

interface QuizEditorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  onImageUpload?: (file: File) => Promise<string>;
  className?: string;
}

const QuizEditor: React.FC<QuizEditorProps> = ({
  questions,
  onChange,
  onImageUpload,
  className = ''
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const generateId = () => Date.now().toString();

  const addQuestion = useCallback(() => {
    const newQuestion: QuizQuestion = {
      id: generateId(),
      name: '',
      type: 'SINGLE_CHOICE',
      points: 1,
      answers: [
        { id: generateId(), name: '', isCorrect: true, },
        { id: generateId(), name: '', isCorrect: false, },
      ]
    };

    onChange([...questions, newQuestion]);
  }, [questions, onChange]);

  const updateQuestion = useCallback((questionId: string, updates: Partial<QuizQuestion>) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    onChange(updatedQuestions);
  }, [questions, onChange]);

  const deleteQuestion = useCallback((questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    onChange(updatedQuestions);
  }, [questions, onChange]);

  const addAnswer = useCallback((questionId: string) => {
    const newAnswer: QuizAnswer = {
      id: generateId(),
      name: '',
      isCorrect: false,
    };

    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { ...q, answers: [...q.answers, newAnswer] }
        : q
    );
    onChange(updatedQuestions);
  }, [questions, onChange]);

  const updateAnswer = useCallback((questionId: string, answerId: string, updates: Partial<QuizAnswer>) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            answers: q.answers.map(a => 
              a.id === answerId ? { ...a, ...updates } : a
            )
          }
        : q
    );
    onChange(updatedQuestions);
  }, [questions, onChange]);

  const deleteAnswer = useCallback((questionId: string, answerId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
        : q
    );
    onChange(updatedQuestions);
  }, [questions, onChange]);

  const toggleCorrectAnswer = useCallback((questionId: string, answerId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const updatedQuestions = questions.map(q => {
      if (q.id !== questionId) return q;

      if (q.type === 'SINGLE_CHOICE') {
        // Для одиночного выбора - только один правильный ответ
        return {
          ...q,
          answers: q.answers.map(a => ({
            ...a,
            isCorrect: a.id === answerId
          }))
        };
      } else if (q.type === 'MULTIPLE_CHOICE') {
        // Для множественного выбора - переключаем статус
        return {
          ...q,
          answers: q.answers.map(a => 
            a.id === answerId ? { ...a, isCorrect: !a.isCorrect } : a
          )
        };
      }

      return q;
    });

    onChange(updatedQuestions);
  }, [questions, onChange]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(targetIndex, 0, draggedQuestion);

    onChange(newQuestions);
    setDraggedIndex(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Список вопросов */}
      {questions.map((question, questionIndex) => (
        <div
          key={question.id}
          draggable
          onDragStart={(e) => handleDragStart(e, questionIndex)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, questionIndex)}
          className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
        >
          {/* Заголовок вопроса */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FaGripVertical className="text-gray-400 cursor-move" />
              <span className="text-sm font-medium text-gray-500">
                Вопрос {questionIndex + 1}
              </span>
            </div>
            <button
              onClick={() => deleteQuestion(question.id)}
              className="text-red-600 hover:text-red-800 p-1"
              title="Удалить вопрос"
            >
              <FaTrash />
            </button>
          </div>

          {/* Тип вопроса и баллы */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип вопроса
              </label>
              <select
                value={question.type}
                onChange={(e) => updateQuestion(question.id, { 
                  type: e.target.value as QuizQuestion['type'] 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="SINGLE_CHOICE">Один правильный ответ</option>
                <option value="MULTIPLE_CHOICE">Несколько правильных ответов</option>
                <option value="TEXT">Текстовый ответ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Баллы
              </label>
              <input
                type="number"
                min="1"
                value={question.points || 1}
                onChange={(e) => updateQuestion(question.id, { 
                  points: parseInt(e.target.value) || 1 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Текст вопроса */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст вопроса *
            </label>
            <RichTextEditor
              content={question.name}
              onChange={(content) => updateQuestion(question.id, { name: content })}
              placeholder="Введите текст вопроса..."
              onImageUpload={onImageUpload}
            />
          </div>

          {/* Описание вопроса */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание или пояснение (необязательно)
            </label>
            <RichTextEditor
              content={question.description || ''}
              onChange={(content) => updateQuestion(question.id, { description: content })}
              placeholder="Добавьте пояснение к вопросу..."
              onImageUpload={onImageUpload}
              className="h-32"
            />
          </div>

          {/* Изображение вопроса */}
          {question.imageUrl && (
            <div className="mb-4">
              <div className="relative inline-block">
                <img
                  src={question.imageUrl}
                  alt="Изображение вопроса"
                  className="max-w-xs max-h-48 object-cover rounded-lg border"
                />
                <button
                  onClick={() => updateQuestion(question.id, { imageUrl: undefined })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  title="Удалить изображение"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Варианты ответов */}
          {question.type !== 'TEXT' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Варианты ответов
                </label>
                <button
                  onClick={() => addAnswer(question.id)}
                  className="flex items-center px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  <FaPlus className="mr-1" size={12} />
                  Добавить вариант
                </button>
              </div>

              {question.answers.map((answer, answerIndex) => (
                <div key={answer.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                  {/* Чекбокс правильности */}
                  <div className="flex items-center mt-2">
                    <button
                      onClick={() => toggleCorrectAnswer(question.id, answer.id)}
                      className={`p-1 rounded ${
                        answer.isCorrect 
                          ? 'bg-green-500 text-white' 
                          : 'bg-white border-2 border-gray-300'
                      }`}
                      title={answer.isCorrect ? 'Правильный ответ' : 'Неправильный ответ'}
                    >
                      {answer.isCorrect && <FaCheck size={12} />}
                    </button>
                  </div>

                  {/* Содержимое ответа */}
                  <div className="flex-1 space-y-2">
                    <span className="text-xs text-gray-500">
                      Вариант {answerIndex + 1}
                    </span>
                    
                    <RichTextEditor
                      content={answer.name}
                      onChange={(content) => updateAnswer(question.id, answer.id, { name: content })}
                      placeholder="Введите вариант ответа..."
                      onImageUpload={onImageUpload}
                      className="h-24"
                    />

                    {answer.imageUrl && (
                      <div className="relative inline-block">
                        <img
                          src={answer.imageUrl}
                          alt="Изображение ответа"
                          className="max-w-32 max-h-24 object-cover rounded border"
                        />
                        <button
                          onClick={() => updateAnswer(question.id, answer.id, { imageUrl: undefined })}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          title="Удалить изображение"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Кнопка удаления ответа */}
                  {question.answers.length > 2 && (
                    <button
                      onClick={() => deleteAnswer(question.id, answer.id)}
                      className="text-red-600 hover:text-red-800 p-1 mt-2"
                      title="Удалить вариант"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              ))}

              {question.type === 'SINGLE_CHOICE' && (
                <p className="text-xs text-gray-500 italic">
                  Выберите один правильный ответ, нажав на кружок слева
                </p>
              )}

              {question.type === 'MULTIPLE_CHOICE' && (
                <p className="text-xs text-gray-500 italic">
                  Можно выбрать несколько правильных ответов
                </p>
              )}
            </div>
          )}

          {question.type === 'TEXT' && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Текстовый вопрос:</strong> Студенты будут вводить ответ в текстовом поле.
                Проверка ответов будет производиться вручную.
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Кнопка добавления вопроса */}
      <div className="text-center">
        <button
          onClick={addQuestion}
          className="flex items-center mx-auto px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <FaPlus className="mr-2" />
          Добавить вопрос
        </button>
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FaPlus className="mx-auto text-4xl mb-4 opacity-50" />
          <p className="text-lg mb-2">Нет вопросов</p>
          <p className="text-sm">Добавьте первый вопрос для начала создания теста</p>
        </div>
      )}
    </div>
  );
};

export default QuizEditor;
