import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Calendar, Users, Clock, Settings, Wand2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button, Loading, Alert } from './ui';
import scheduleService from '../services/scheduleService';

interface AIScheduleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (result: any) => void;
}

interface RoomPreference {
  roomId: number;
  roomType: string;
  priority: number;
}

interface GenerationParams {
  startDate: string;
  endDate: string;
  groupIds: number[];
  constraints: {
    workingHours: {
      start: string;
      end: string;
    };
    maxConsecutiveHours: number;
    preferredBreaks: number[];
    excludeWeekends: boolean;
    minBreakDuration: number;
    roomPreferences?: RoomPreference[];
  };
  generationType: 'full' | 'partial' | 'optimize';
  teacherIds?: number[];
  subjectIds?: number[];
  additionalInstructions?: string;
}

const AIScheduleGeneratorModal: React.FC<AIScheduleGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Данные для выпадающих списков
  const [groups, setGroups] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  // Параметры генерации
  const [params, setParams] = useState<GenerationParams>({
    startDate: '',
    endDate: '',
    groupIds: [],
    constraints: {
      workingHours: {
        start: '08:00',
        end: '18:00'
      },
      maxConsecutiveHours: 4,
      preferredBreaks: [12, 13],
      excludeWeekends: true,
      minBreakDuration: 15
    },
    generationType: 'full',
    additionalInstructions: ''
  });

  // Загрузка данных при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadData();
      // Устанавливаем даты по умолчанию
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      setParams(prev => ({
        ...prev,
        startDate: nextWeek.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [groupsData, teachersData, classroomsData] = await Promise.all([
        scheduleService.getGroups(),
        scheduleService.getTeachers(),
        scheduleService.getClassrooms()
      ]);
      setGroups(groupsData);
      setTeachers(teachersData);
      setClassrooms(classroomsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Ошибка загрузки данных');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await scheduleService.generateWithAI(params);
      setGenerationResult(result);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error generating schedule:', error);
      setError(error instanceof Error ? error.message : 'Ошибка генерации расписания');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyResult = () => {
    if (generationResult) {
      onGenerate(generationResult);
      onClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setGenerationResult(null);
    setError(null);
    setIsGenerating(false);
    onClose();
  };

  const steps = [
    { number: 1, title: 'Параметры', description: 'Настройка параметров генерации' },
    { number: 2, title: 'Ограничения', description: 'Временные и ресурсные ограничения' },
    { number: 3, title: 'Результат', description: 'Просмотр и применение' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg w-[800px] max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">ИИ Генерация Расписания</h2>
                <p className="text-purple-100">Создание оптимального расписания с помощью искусственного интеллекта</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center space-x-2 ${index > 0 ? 'ml-4' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep >= step.number 
                        ? 'bg-white text-purple-600' 
                        : 'bg-white bg-opacity-20 text-white'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <div className={`text-sm font-medium ${currentStep >= step.number ? 'text-white' : 'text-purple-200'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-purple-200">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-white' : 'bg-white bg-opacity-20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <Alert variant="error" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              {error}
            </Alert>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Basic Parameters */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Основные параметры
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дата начала
                      </label>
                      <input
                        type="date"
                        value={params.startDate}
                        onChange={(e) => setParams({ ...params, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дата окончания
                      </label>
                      <input
                        type="date"
                        value={params.endDate}
                        onChange={(e) => setParams({ ...params, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип генерации
                    </label>
                    <select
                      value={params.generationType}
                      onChange={(e) => setParams({ ...params, generationType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full">Полная генерация (создать новое расписание)</option>
                      <option value="partial">Частичная генерация (дополнить существующее)</option>
                      <option value="optimize">Оптимизация (улучшить существующее)</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Группы
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                      {groups.map(group => (
                        <label key={group.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={params.groupIds.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setParams({ ...params, groupIds: [...params.groupIds, group.id] });
                              } else {
                                setParams({ ...params, groupIds: params.groupIds.filter(id => id !== group.id) });
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{group.name} (курс {group.courseNumber})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Constraints */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Ограничения и предпочтения
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Начало рабочего дня
                      </label>
                      <input
                        type="time"
                        value={params.constraints.workingHours.start}
                        onChange={(e) => setParams({
                          ...params,
                          constraints: {
                            ...params.constraints,
                            workingHours: { ...params.constraints.workingHours, start: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Окончание рабочего дня
                      </label>
                      <input
                        type="time"
                        value={params.constraints.workingHours.end}
                        onChange={(e) => setParams({
                          ...params,
                          constraints: {
                            ...params.constraints,
                            workingHours: { ...params.constraints.workingHours, end: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Максимальное количество занятий подряд
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={params.constraints.maxConsecutiveHours}
                        onChange={(e) => setParams({
                          ...params,
                          constraints: { ...params.constraints, maxConsecutiveHours: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Минимальная длительность перерыва (минуты)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={params.constraints.minBreakDuration}
                        onChange={(e) => setParams({
                          ...params,
                          constraints: { ...params.constraints, minBreakDuration: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={params.constraints.excludeWeekends}
                        onChange={(e) => setParams({
                          ...params,
                          constraints: { ...params.constraints, excludeWeekends: e.target.checked }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Исключить выходные дни</span>
                    </label>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Предпочтения по аудиториям
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                      {classrooms.map(classroom => (
                        <label key={classroom.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={params.constraints.roomPreferences?.some(rp => rp.roomId === classroom.id) || false}
                              onChange={(e) => {
                                const currentPrefs = params.constraints.roomPreferences || [];
                                if (e.target.checked) {
                                  setParams({
                                    ...params,
                                    constraints: {
                                      ...params.constraints,
                                      roomPreferences: [
                                        ...currentPrefs,
                                        { roomId: classroom.id, roomType: classroom.type, priority: 3 }
                                      ]
                                    }
                                  });
                                } else {
                                  setParams({
                                    ...params,
                                    constraints: {
                                      ...params.constraints,
                                      roomPreferences: currentPrefs.filter(rp => rp.roomId !== classroom.id)
                                    }
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{classroom.name}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              classroom.type === 'LECTURE_HALL' ? 'bg-blue-100 text-blue-800' :
                              classroom.type === 'LABORATORY' ? 'bg-green-100 text-green-800' :
                              classroom.type === 'COMPUTER_LAB' ? 'bg-purple-100 text-purple-800' :
                              classroom.type === 'SEMINAR_ROOM' ? 'bg-yellow-100 text-yellow-800' :
                              classroom.type === 'GYMNASIUM' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {classroom.type}
                            </span>
                          </div>
                          {params.constraints.roomPreferences?.find(rp => rp.roomId === classroom.id) && (
                            <select
                              value={params.constraints.roomPreferences.find(rp => rp.roomId === classroom.id)?.priority || 3}
                              onChange={(e) => {
                                const priority = parseInt(e.target.value);
                                const currentPrefs = params.constraints.roomPreferences || [];
                                setParams({
                                  ...params,
                                  constraints: {
                                    ...params.constraints,
                                    roomPreferences: currentPrefs.map(rp => 
                                      rp.roomId === classroom.id ? { ...rp, priority } : rp
                                    )
                                  }
                                });
                              }}
                              className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value={1}>Низкий</option>
                              <option value={2}>Ниже среднего</option>
                              <option value={3}>Средний</option>
                              <option value={4}>Высокий</option>
                              <option value={5}>Очень высокий</option>
                            </select>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дополнительные инструкции для ИИ
                    </label>
                    <textarea
                      value={params.additionalInstructions}
                      onChange={(e) => setParams({ ...params, additionalInstructions: e.target.value })}
                      placeholder="Например: 'Лекции предпочтительно в первой половине дня', 'Для информатики использовать только компьютерные классы', 'Физкультуру проводить в спортзале'..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Results */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                {isGenerating ? (
                  <div className="text-center py-12">
                    <Loading text="ИИ создает оптимальное расписание..." />
                    <div className="mt-4 text-sm text-gray-600">
                      Анализируем ограничения, распределяем нагрузку, оптимизируем конфликты...
                    </div>
                  </div>
                ) : generationResult ? (
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Результат генерации
                    </h3>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Статистика</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Занятий создано: {generationResult.generatedSchedule?.length || 0}</div>
                        <div>Уровень уверенности: {Math.round((generationResult.confidence || 0) * 100)}%</div>
                        <div>Конфликтов обнаружено: {generationResult.conflicts?.length || 0}</div>
                        <div>Предложений по улучшению: {generationResult.suggestions?.length || 0}</div>
                      </div>
                    </div>

                    {generationResult.conflicts?.length > 0 && (
                      <Alert variant="warning" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        Обнаружены конфликты в расписании. Рекомендуется их устранить перед применением.
                      </Alert>
                    )}

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-2">Объяснение ИИ:</h4>
                      <p className="text-sm text-gray-700">{generationResult.reasoning}</p>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center flex-shrink-0 border-t border-gray-200">
          <div className="flex space-x-2">
            {currentStep > 1 && currentStep < 3 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Назад
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Отмена
            </Button>

            {currentStep < 2 && (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && params.groupIds.length === 0}
              >
                Далее
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Генерировать
              </Button>
            )}

            {currentStep === 3 && generationResult && (
              <Button
                onClick={handleApplyResult}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Применить результат
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AIScheduleGeneratorModal;
