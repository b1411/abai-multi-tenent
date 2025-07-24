import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bot,
  Calendar,
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader,
  Settings,
  Plus,
  Minus
} from 'lucide-react';
import { Button, Loading } from './ui';
import { GenerateLessonsParams, AILessonsResponse } from '../services/lessonScheduleService';

interface AILessonGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (result: AILessonsResponse) => void;
  groups?: any[];
  teachers?: any[];
  studyPlans?: any[];
}

const AILessonGeneratorModal: React.FC<AILessonGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  groups = [],
  teachers = [],
  studyPlans = []
}) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<AILessonsResponse | null>(null);

  const [formData, setFormData] = useState<GenerateLessonsParams>({
    groupIds: [],
    teacherIds: [],
    subjectIds: [],
    startDate: '',
    endDate: '',
    academicYear: '2024-2025',
    semester: 1,
    lessonDuration: 45,
    weeklyHoursPerSubject: {},
    excludeDates: [],
    additionalInstructions: '',
    constraints: {
      workingHours: {
        start: '08:00',
        end: '18:00'
      },
      maxConsecutiveHours: 6,
      preferredBreaks: ['12:00-13:00']
    }
  });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Сброс состояния при открытии модального окна
      setStep(1);
      setError(null);
      setGenerationResult(null);
      setIsGenerating(false);
      
      // Установка даты по умолчанию
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const endMonth = new Date(today);
      endMonth.setMonth(today.getMonth() + 3);
      
      setFormData(prev => ({
        ...prev,
        startDate: nextWeek.toISOString().split('T')[0],
        endDate: endMonth.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Валидация
      if (formData.groupIds.length === 0) {
        throw new Error('Выберите хотя бы одну группу');
      }
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Укажите период планирования');
      }

      // Импортируем сервис динамически
      const { lessonScheduleService } = await import('../services/lessonScheduleService');
      
      const result = await lessonScheduleService.generateLessonsWithAI(formData);
      setGenerationResult(result);
      setStep(3);
    } catch (err) {
      console.error('Ошибка генерации уроков:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при генерации уроков');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (generationResult && generationResult.generatedLessons) {
      try {
        setIsGenerating(true);
        
        // Применяем расписание к базе данных
        const { lessonScheduleService } = await import('../services/lessonScheduleService');
        const result = await lessonScheduleService.applyLessonSchedule(generationResult.generatedLessons);
        
        console.log('Расписание применено:', result);
        
        onGenerate(generationResult);
        onClose();
      } catch (err) {
        console.error('Ошибка применения расписания:', err);
        setError(err instanceof Error ? err.message : 'Ошибка при применении расписания');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const addExcludeDate = () => {
    setFormData(prev => ({
      ...prev,
      excludeDates: [...prev.excludeDates!, '']
    }));
  };

  const removeExcludeDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      excludeDates: prev.excludeDates!.filter((_, i) => i !== index)
    }));
  };

  const updateExcludeDate = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      excludeDates: prev.excludeDates!.map((date, i) => i === index ? value : date)
    }));
  };

  const updateWeeklyHours = (studyPlanId: number, hours: number) => {
    setFormData(prev => ({
      ...prev,
      weeklyHoursPerSubject: {
        ...prev.weeklyHoursPerSubject,
        [studyPlanId]: hours
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-semibold">AI Генератор уроков</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNumber ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${step > stepNumber ? 'bg-purple-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Параметры</span>
            <span>Генерация</span>
            <span>Результат</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Parameters */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Основные параметры
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Период планирования
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Учебный год
                        </label>
                        <input
                          type="text"
                          value={formData.academicYear}
                          onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                          placeholder="2024-2025"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Семестр
                        </label>
                        <select
                          value={formData.semester}
                          onChange={(e) => setFormData(prev => ({ ...prev, semester: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={1}>1 семестр</option>
                          <option value={2}>2 семестр</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Длительность урока (минуты)
                      </label>
                      <input
                        type="number"
                        value={formData.lessonDuration}
                        onChange={(e) => setFormData(prev => ({ ...prev, lessonDuration: parseInt(e.target.value) }))}
                        min="30"
                        max="120"
                        step="15"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Groups and Subjects */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-600" />
                    Группы и предметы
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Группы *
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {groups.map(group => (
                        <label key={group.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={formData.groupIds.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  groupIds: [...prev.groupIds, group.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  groupIds: prev.groupIds.filter(id => id !== group.id)
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">{group.name} (курс {group.courseNumber})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Предметы (опционально)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {studyPlans.map(plan => (
                        <label key={plan.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={formData.subjectIds?.includes(plan.id) || false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  subjectIds: [...(prev.subjectIds || []), plan.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  subjectIds: (prev.subjectIds || []).filter(id => id !== plan.id)
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">{plan.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Hours */}
              {formData.subjectIds && formData.subjectIds.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium flex items-center mb-3">
                    <Clock className="h-5 w-5 mr-2 text-orange-600" />
                    Недельная нагрузка по предметам
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {formData.subjectIds.map(planId => {
                      const plan = studyPlans.find(p => p.id === planId);
                      return plan ? (
                        <div key={planId} className="flex items-center space-x-2">
                          <span className="text-sm flex-1">{plan.name}:</span>
                          <input
                            type="number"
                            value={formData.weeklyHoursPerSubject?.[planId] || 2}
                            onChange={(e) => updateWeeklyHours(planId, parseInt(e.target.value))}
                            min="1"
                            max="10"
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                          <span className="text-sm text-gray-500">ч/нед</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Exclude Dates */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Исключенные даты (каникулы, праздники)
                  </h4>
                  <Button
                    onClick={addExcludeDate}
                    size="sm"
                    variant="outline"
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.excludeDates?.map((date, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => updateExcludeDate(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <Button
                        onClick={() => removeExcludeDate(index)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div>
                <h4 className="text-lg font-medium flex items-center mb-3">
                  <Settings className="h-5 w-5 mr-2 text-gray-600" />
                  Дополнительные параметры
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дополнительные инструкции для AI
                    </label>
                    <textarea
                      value={formData.additionalInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                      rows={3}
                      placeholder="Например: Уделить больше внимания практическим занятиям, включить контрольные работы каждые 2 недели..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Generation */}
          {step === 2 && (
            <div className="p-6 flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Bot className="h-16 w-16 text-purple-600" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  Генерация календарно-тематического планирования
                </h3>
                <p className="text-gray-600 mb-4">
                  AI анализирует ваши параметры и создает оптимальное расписание уроков...
                </p>
                <Loading text="Это может занять несколько минут" />
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && generationResult && (
            <div className="p-6 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="text-lg font-semibold text-green-800">
                    Планирование сгенерировано успешно!
                  </h4>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Всего уроков:</span>
                      <div className="font-semibold text-green-700">
                        {generationResult.statistics?.totalLessons || generationResult.summary?.totalLessons || 0}
                      </div>
                    </div>
                  <div>
                    <span className="text-gray-600">Общая оценка:</span>
                    <div className="font-semibold text-green-700">
                      {generationResult.analysis?.overallScore || 0}/100
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Эффективность:</span>
                    <div className="font-semibold text-green-700">
                      {generationResult.analysis?.efficiency || 0}/100
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Использование ресурсов:</span>
                    <div className="font-semibold text-green-700">
                      {generationResult.analysis?.resourceUtilization || 0}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary by Subject */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Сгенерированные уроки</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Подсчитываем уроки по предметам из массива generatedLessons */}
                  {Object.entries(
                    (generationResult.generatedLessons || []).reduce((acc, lesson) => {
                      acc[lesson.studyPlanName] = (acc[lesson.studyPlanName] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([subject, count]) => (
                    <div key={subject} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{subject}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {count} уроков
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {generationResult.recommendations.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Рекомендации</h4>
                  <ul className="space-y-2">
                    {generationResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conflicts/Warnings */}
              {(generationResult.conflicts.length > 0 || (generationResult.warnings && generationResult.warnings.length > 0)) && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Важные замечания</h4>
                  <div className="space-y-2">
                    {generationResult.conflicts.map((conflict, index) => (
                      <div key={`conflict-${index}`} className="flex items-start space-x-2 text-red-700">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{conflict}</span>
                      </div>
                    ))}
                    {(generationResult.warnings || []).map((warning, index) => (
                      <div key={`warning-${index}`} className="flex items-start space-x-2 text-yellow-700">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {step === 1 && 'Настройте параметры генерации'}
            {step === 2 && 'Генерация в процессе...'}
            {step === 3 && 'Результат готов к применению'}
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isGenerating}
            >
              Отмена
            </Button>
            
            {step === 1 && (
              <Button
                onClick={() => {
                  setStep(2);
                  setTimeout(handleSubmit, 500);
                }}
                disabled={formData.groupIds.length === 0 || !formData.startDate || !formData.endDate}
              >
                Генерировать уроки
              </Button>
            )}
            
            {step === 3 && (
              <Button
                onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700"
              >
                Применить планирование
              </Button>
            )}
          </div>
        </div>

        {/* Error Modal */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-lg p-6 max-w-md mx-4"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold">Ошибка генерации</h3>
                </div>
                <p className="text-gray-700 mb-4">{error}</p>
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => {
                      setError(null);
                      setStep(1);
                    }}
                    variant="outline"
                  >
                    Вернуться к настройкам
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AILessonGeneratorModal;
