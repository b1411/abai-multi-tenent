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

interface AIStudyPlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: any) => void;
  groups?: any[];
  teachers?: any[];
  studyPlans?: any[];
}

const AIStudyPlanGeneratorModal: React.FC<AIStudyPlanGeneratorModalProps> = ({
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

  const [formData, setFormData] = useState({
    studyPlanIds: [] as number[],
    groupIds: [] as number[],
    teacherIds: [] as number[],
    startDate: '',
    endDate: '',
    constraints: {
      workingHours: {
        start: '08:00',
        end: '18:00'
      },
      maxConsecutiveHours: 3,
      lessonsPerDayLimit: 5,
    }
  });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Сброс состояния при открытии модального окна
      setStep(1);
      setError(null);
      setIsGenerating(false);
      
      // Установка даты по умолчанию
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const endMonth = new Date(today);
      endMonth.setMonth(today.getMonth() + 1);
      
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
      if (formData.studyPlanIds.length === 0 && formData.groupIds.length === 0 && formData.teacherIds.length === 0) {
        throw new Error('Выберите хотя бы один учебный план, группу или преподавателя');
      }
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Укажите период планирования');
      }

      onGenerate(formData);
      // Дальнейшая обработка (шаги 2 и 3) будет в родительском компоненте
    } catch (err) {
      console.error('Ошибка подготовки данных для генерации:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setIsGenerating(false);
    }
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
            <h3 className="text-xl font-semibold">AI Генератор расписания</h3>
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
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
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
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Фильтры (выберите хотя бы один)
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Учебные планы
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {studyPlans.map(plan => (
                      <label key={plan.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.studyPlanIds.includes(plan.id)}
                          onChange={(e) => {
                            const id = plan.id;
                            setFormData(prev => ({
                              ...prev,
                              studyPlanIds: e.target.checked
                                ? [...prev.studyPlanIds, id]
                                : prev.studyPlanIds.filter(pId => pId !== id)
                            }));
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">{plan.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Группы
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {groups.map(group => (
                      <label key={group.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.groupIds.includes(group.id)}
                          onChange={(e) => {
                            const id = group.id;
                            setFormData(prev => ({
                              ...prev,
                              groupIds: e.target.checked
                                ? [...prev.groupIds, id]
                                : prev.groupIds.filter(gId => gId !== id)
                            }));
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">{group.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Преподаватели
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {teachers.map(teacher => (
                      <label key={teacher.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.teacherIds.includes(teacher.id)}
                          onChange={(e) => {
                            const id = teacher.id;
                            setFormData(prev => ({
                              ...prev,
                              teacherIds: e.target.checked
                                ? [...prev.teacherIds, id]
                                : prev.teacherIds.filter(tId => tId !== id)
                            }));
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">{teacher.name} {teacher.surname}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Настройте параметры генерации
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isGenerating}
            >
              Отмена
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isGenerating || (formData.studyPlanIds.length === 0 && formData.groupIds.length === 0 && formData.teacherIds.length === 0) || !formData.startDate || !formData.endDate}
            >
              {isGenerating ? <Loading text="Генерация..." /> : 'Генерировать'}
            </Button>
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
                  <h3 className="text-lg font-semibold">Ошибка</h3>
                </div>
                <p className="text-gray-700 mb-4">{error}</p>
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => setError(null)}
                    variant="outline"
                  >
                    Закрыть
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

export default AIStudyPlanGeneratorModal;
