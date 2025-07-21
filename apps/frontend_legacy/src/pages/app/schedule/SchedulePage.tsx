/**
 * @page SchedulePage
 * @description Страница управления расписанием занятий
 * @author Бурабай Диас
 * @last_updated 2024-03-23
 * 
 * @backend_requirements
 * 
 * 1. API Endpoints:
 * 
 * GET /api/v1/schedule
 * - Получение расписания
 * - Параметры запроса:
 *   - startDate: string (YYYY-MM-DD)
 *   - endDate: string (YYYY-MM-DD)
 *   - group?: string
 *   - teacher?: string
 *   - room?: string
 *   - subject?: string
 * 
 * POST /api/v1/schedule
 * - Создание занятия в расписании
 * - Body:
 *   - subject: string
 *   - group: string
 *   - teacher: string
 *   - room: string
 *   - startTime: string (HH:mm)
 *   - endTime: string (HH:mm)
 *   - dayOfWeek: number (1-7)
 *   - type: 'lecture' | 'practice' | 'lab'
 *   - startDate: string (YYYY-MM-DD)
 *   - endDate: string (YYYY-MM-DD)
 *   - recurrence?: {
 *       frequency: 'weekly';
 *       interval?: number;
 *       excludeDates?: string[];
 *     }
 * 
 * PUT /api/v1/schedule/{scheduleId}
 * - Обновление занятия
 * - Body: аналогично POST
 * 
 * DELETE /api/v1/schedule/{scheduleId}
 * - Удаление занятия
 * - Query параметры:
 *   - deleteAll?: boolean (для серии занятий)
 * 
 * GET /api/v1/schedule/conflicts
 * - Проверка конфликтов в расписании
 * - Параметры запроса:
 *   - startDate: string
 *   - endDate: string
 *   - group?: string
 *   - teacher?: string
 *   - room?: string
 * 
 * GET /api/v1/schedule/available-slots
 * - Получение свободных слотов
 * - Параметры запроса:
 *   - date: string
 *   - duration: number (минуты)
 *   - group?: string
 *   - teacher?: string
 *   - room?: string
 * 
 * 2. Модели данных:
 * 
 * interface ScheduleEntry {
 *   id: string;
 *   subject: {
 *     id: string;
 *     name: string;
 *     code: string;
 *   };
 *   group: {
 *     id: string;
 *     name: string;
 *     students: number;
 *   };
 *   teacher: {
 *     id: string;
 *     name: string;
 *     department: string;
 *   };
 *   room: {
 *     id: string;
 *     name: string;
 *     capacity: number;
 *     type: string;
 *   };
 *   startTime: string;
 *   endTime: string;
 *   dayOfWeek: number;
 *   type: 'lecture' | 'practice' | 'lab';
 *   startDate: string;
 *   endDate: string;
 *   recurrence?: {
 *     frequency: 'weekly';
 *     interval: number;
 *     excludeDates: string[];
 *   };
 *   createdAt: string;
 *   updatedAt: string;
 * }
 * 
 * interface Conflict {
 *   type: 'teacher' | 'group' | 'room';
 *   message: string;
 *   entries: ScheduleEntry[];
 * }
 * 
 * interface AvailableSlot {
 *   startTime: string;
 *   endTime: string;
 *   date: string;
 *   rooms?: Array<{
 *     id: string;
 *     name: string;
 *   }>;
 * }
 * 
 * 3. WebSocket события:
 * - schedule:create - создание занятия
 * - schedule:update - обновление занятия
 * - schedule:delete - удаление занятия
 * - schedule:conflict - обнаружен конфликт
 * 
 * 4. Требования к безопасности:
 * - Проверка прав доступа к расписанию
 * - Валидация временных интервалов
 * - Проверка конфликтов
 * - Ограничение количества изменений
 * - Логирование всех изменений
 * 
 * 5. Кэширование:
 * - Кэширование расписания на неделю
 * - Кэширование списков групп/преподавателей/аудиторий
 * - Инвалидация кэша при изменениях
 * 
 * 6. Дополнительные требования:
 * - Автоматическое распределение аудиторий
 * - Учет типов аудиторий (лекционные, компьютерные и т.д.)
 * - Проверка вместимости аудиторий
 * - Учет рабочей нагрузки преподавателей
 * - Экспорт расписания в Excel/PDF
 * - Массовый импорт занятий
 * - Уведомления об изменениях
 * - История изменений
 */

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ru';
import { Button, Select, DatePicker, Modal, Form, Input, TimePicker, message } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import styles from './SchedulePage.module.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Локализация календаря
moment.locale('ru');
const localizer = momentLocalizer(moment);

// Типы данных
interface ScheduleEntry {
  id: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  group: {
    id: string;
    name: string;
    students: number;
  };
  teacher: {
    id: string;
    name: string;
    department: string;
  };
  room: {
    id: string;
    name: string;
    capacity: number;
    type: string;
  };
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  type: 'lecture' | 'practice' | 'lab';
  startDate: string;
  endDate: string;
  recurrence?: {
    frequency: 'weekly';
    interval: number;
    excludeDates: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduleEntry;
}

const SchedulePage: React.FC = () => {
  // Состояния
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();

  // Загрузка данных
  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await axios.get('/api/v1/schedule', {
        params: {
          startDate: moment().startOf('month').format('YYYY-MM-DD'),
          endDate: moment().endOf('month').format('YYYY-MM-DD')
        }
      });

      const calendarEvents = response.data.map((entry: ScheduleEntry) => ({
        id: entry.id,
        title: `${entry.subject.name} - ${entry.group.name}`,
        start: new Date(`${entry.startDate}T${entry.startTime}`),
        end: new Date(`${entry.startDate}T${entry.endTime}`),
        resource: entry
      }));

      setEvents(calendarEvents);
    } catch (error) {
      message.error('Ошибка при загрузке расписания');
    }
  };

  // Обработчики событий
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent(null);
    setIsEditMode(false);
    form.resetFields();
    form.setFieldsValue({
      startTime: moment(start),
      endTime: moment(end),
      startDate: moment(start),
      endDate: moment(end)
    });
    setIsModalVisible(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditMode(true);
    form.setFieldsValue({
      subject: event.resource.subject.id,
      group: event.resource.group.id,
      teacher: event.resource.teacher.id,
      room: event.resource.room.id,
      type: event.resource.type,
      startTime: moment(event.start),
      endTime: moment(event.end),
      startDate: moment(event.start),
      endDate: moment(event.resource.endDate),
      recurrence: event.resource.recurrence
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        dayOfWeek: values.startDate.day()
      };

      if (isEditMode && selectedEvent) {
        await axios.put(`/api/v1/schedule/${selectedEvent.id}`, data);
        message.success('Занятие обновлено');
      } else {
        await axios.post('/api/v1/schedule', data);
        message.success('Занятие создано');
      }

      setIsModalVisible(false);
      fetchSchedule();
    } catch (error) {
      message.error('Ошибка при сохранении занятия');
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    try {
      await axios.delete(`/api/v1/schedule/${selectedEvent.id}`);
      message.success('Занятие удалено');
      setIsModalVisible(false);
      fetchSchedule();
    } catch (error) {
      message.error('Ошибка при удалении занятия');
    }
  };

  return (
    <div className={styles['schedule-page']}>
      <div className={styles['schedule-header']}>
        <h1>Расписание занятий</h1>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          Добавить занятие
        </Button>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 200px)' }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={(event) => ({
          className: event.type?.toLowerCase() || ''
        })}
      />

      <Modal
        title={isEditMode ? 'Редактировать занятие' : 'Добавить занятие'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          isEditMode && (
            <Button key="delete" danger onClick={handleDelete}>
              Удалить
            </Button>
          ),
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {isEditMode ? 'Сохранить' : 'Создать'}
          </Button>
        ].filter(Boolean)}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="subject"
            label="Предмет"
            rules={[{ required: true, message: 'Выберите предмет' }]}
          >
            <Select placeholder="Выберите предмет" />
          </Form.Item>

          <Form.Item
            name="group"
            label="Группа"
            rules={[{ required: true, message: 'Выберите группу' }]}
          >
            <Select placeholder="Выберите группу" />
          </Form.Item>

          <Form.Item
            name="teacher"
            label="Преподаватель"
            rules={[{ required: true, message: 'Выберите преподавателя' }]}
          >
            <Select placeholder="Выберите преподавателя" />
          </Form.Item>

          <Form.Item
            name="room"
            label="Аудитория"
            rules={[{ required: true, message: 'Выберите аудиторию' }]}
          >
            <Select placeholder="Выберите аудиторию" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Тип занятия"
            rules={[{ required: true, message: 'Выберите тип занятия' }]}
          >
            <Select>
              <Select.Option value="lecture">Лекция</Select.Option>
              <Select.Option value="practice">Практика</Select.Option>
              <Select.Option value="lab">Лабораторная</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="startTime"
            label="Время начала"
            rules={[{ required: true, message: 'Укажите время начала' }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="Время окончания"
            rules={[{ required: true, message: 'Укажите время окончания' }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Дата начала"
            rules={[{ required: true, message: 'Укажите дату начала' }]}
          >
            <DatePicker />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="Дата окончания"
            rules={[{ required: true, message: 'Укажите дату окончания' }]}
          >
            <DatePicker />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchedulePage; 