import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { FaPlus, FaSave, FaCog, FaArrowUp, FaArrowDown, FaExpand, FaCompress } from 'react-icons/fa';
import { AddWidgetModal } from '../components/AddWidgetModal';
import { TemplatesManager } from '../components/TemplatesManager';
import * as EducationWidgets from '../components/widgets/EducationWidgets';
import * as FinanceWidgets from '../components/widgets/FinanceWidgets';
import * as HRWidgets from '../components/widgets/HRWidgets';
import * as ERPSecurityWidgets from '../components/widgets/ERPSecurityWidgets';
import * as AIAnalyticsWidgets from '../components/widgets/AIAnalyticsWidgets';
import * as CommunicationsWidgets from '../components/widgets/CommunicationsWidgets';
import * as TodoWidgets from '../components/widgets/TodoWidgets';
import * as EventsDeadlinesWidgets from '../components/widgets/EventsDeadlinesWidgets';

interface Widget {
  id: string;
  type: string;
  category: string;
  component: React.ComponentType;
  size: 'small' | 'medium' | 'large';
}

const widgetComponents: { [key: string]: React.ComponentType } = {
  // Education Widgets
  'Успеваемость по классам': EducationWidgets.ClassPerformanceWidget,
  'Прогресс по программе': EducationWidgets.CurriculumProgressWidget,
  'Топ студентов': EducationWidgets.TopStudentsWidget,
  'Активность преподавателей': EducationWidgets.TeacherActivityWidget,
  'Динамика посещаемости': EducationWidgets.AttendanceTrendsWidget,

  // Finance Widgets
  'Доход за неделю': FinanceWidgets.WeeklyIncomeWidget,
  'Долги по классам': FinanceWidgets.ClassDebtsWidget,
  'AI-прогноз доходов': FinanceWidgets.AIRevenueProjectionWidget,
  'Фонд зарплат': FinanceWidgets.SalaryFundWidget,
  'Отклонения расходов': FinanceWidgets.ExpenseDeviationsWidget,

  // HR Widgets
  'Сейчас работают': HRWidgets.CurrentlyWorkingWidget,
  'Нагрузка учителей': HRWidgets.TeacherLoadWidget,
  'KPI персонала': HRWidgets.StaffKPIWidget,
  'Фиктивные позиции': HRWidgets.FictivePositionsWidget,
  'Отсутствующие сотрудники': HRWidgets.AbsentEmployeesWidget,

  // ERP/Security Widgets
  'Инциденты безопасности': ERPSecurityWidgets.SecurityIncidentsWidget,
  'Здоровье систем': ERPSecurityWidgets.SystemHealthWidget,
  'Контроль доступа': ERPSecurityWidgets.AccessControlWidget,
  'Мониторинг сети': ERPSecurityWidgets.NetworkMonitoringWidget,
  'Статус резервных копий': ERPSecurityWidgets.BackupStatusWidget,

  // AI Analytics Widgets
  'Прогноз успеваемости': AIAnalyticsWidgets.StudentPerformancePredictionWidget,
  'Прогноз посещаемости': AIAnalyticsWidgets.AttendancePredictionWidget,
  'Анализ обучения': AIAnalyticsWidgets.LearningPatternAnalysisWidget,
  'Оптимизация ресурсов': AIAnalyticsWidgets.ResourceOptimizationWidget,
  'Анализ методик': AIAnalyticsWidgets.TeachingMethodsAnalysisWidget,

  // Communications Widgets
  'Сообщения': CommunicationsWidgets.MessagesWidget,
  'Общение с родителями': CommunicationsWidgets.ParentCommunicationWidget,
  'Уведомления': CommunicationsWidgets.NotificationsWidget,
  'Расписание встреч': CommunicationsWidgets.MeetingsScheduleWidget,
  'Групповые чаты': CommunicationsWidgets.ChatWidget,

  // Todo Widgets
  'Личные задачи': TodoWidgets.PersonalTasksWidget,
  'Командные задачи': TodoWidgets.TeamTasksWidget,
  'Дедлайны': TodoWidgets.DeadlinesWidget,
  'Приоритеты': TodoWidgets.TaskPriorityWidget,
  'Прогресс': TodoWidgets.TaskProgressWidget,

  // Events/Deadlines Widgets
  'Ближайшие события': EventsDeadlinesWidgets.UpcomingEventsWidget,
  'Отслеживание дедлайнов': EventsDeadlinesWidgets.DeadlineTrackerWidget,
  'Напоминания': EventsDeadlinesWidgets.EventReminderWidget,
  'Посещаемость событий': EventsDeadlinesWidgets.EventAttendanceWidget,
  'Анализ трендов': EventsDeadlinesWidgets.EventTrendAnalysisWidget,
};

const Dashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const handleAddWidget = (category: string, widgetName: string) => {
    if (!widgetComponents[widgetName]) {
      console.error(`Виджет ${widgetName} не найден`);
      return;
    }

    const newWidget: Widget = {
      id: `${category}-${widgetName}-${Date.now()}`,
      type: widgetName,
      category,
      component: widgetComponents[widgetName],
      size: 'medium',
    };

    setWidgets(prev => [...prev, newWidget]);
  };

  const toggleWidgetSize = (index: number) => {
    const newWidgets = [...widgets];
    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
    const currentSizeIndex = sizes.indexOf(newWidgets[index].size);
    newWidgets[index].size = sizes[(currentSizeIndex + 1) % sizes.length];
    setWidgets(newWidgets);
  };

  const handleDragStart = (id: string) => {
    setDraggedWidget(id);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedWidget || draggedWidget === targetId) return;

    const newWidgets = [...widgets];
    const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = newWidgets.findIndex(w => w.id === targetId);

    const [draggedItem] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedItem);

    setWidgets(newWidgets);
  };

  const handleSaveTemplate = (template: any) => {
    // Здесь будет логика сохранения шаблона
    console.log('Saving template:', template);
  };

  const handleApplyTemplate = (layout: any) => {
    // Здесь будет логика применения шаблона
    console.log('Applying template:', layout);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Верхняя панель */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Панель управления</h1>
        <div className="flex flex-wrap items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingWidget(true)}
            className="px-4 py-2 bg-corporate-primary text-white rounded-lg flex items-center space-x-2"
          >
            <FaPlus />
            <span>Добавить виджет</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsManagingTemplates(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center space-x-2"
          >
            <FaSave />
            <span>Шаблоны</span>
          </motion.button>
        </div>
      </div>

      {/* Сетка виджетов */}
      <Reorder.Group as="div" axis="y" values={widgets} onReorder={setWidgets} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            as="div"
            dragListener={false}
            className={`
              relative bg-white rounded-xl p-4 shadow-notion transition-all duration-200
              ${widget.size === 'small' ? 'col-span-1' : 
                widget.size === 'medium' ? 'col-span-1 md:col-span-2' : 
                'col-span-1 md:col-span-2 lg:col-span-3'}
              ${draggedWidget === widget.id ? 'ring-2 ring-corporate-primary' : ''}
            `}
            onDragStart={() => handleDragStart(widget.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(widget.id)}
            draggable
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{widget.type}</h3>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleWidgetSize(widgets.indexOf(widget))}
                  className="p-2 text-gray-400 hover:text-corporate-primary"
                >
                  {widget.size === 'small' ? <FaExpand size={14} /> : <FaCompress size={14} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-corporate-primary"
                >
                  <FaCog size={14} />
                </motion.button>
              </div>
            </div>
            <div className="relative w-full h-full min-h-[200px]">
              <widget.component />
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Модальные окна */}
      <AnimatePresence>
        {isAddingWidget && (
          <AddWidgetModal
            isOpen={isAddingWidget}
            onClose={() => setIsAddingWidget(false)}
            onAddWidget={handleAddWidget}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isManagingTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsManagingTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <TemplatesManager
                currentLayout={widgets}
                onApplyTemplate={layout => setWidgets(layout)}
                onSaveTemplate={template => console.log('Saving template:', template)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard; 