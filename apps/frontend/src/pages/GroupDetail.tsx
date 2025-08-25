import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Users,
  Calendar,
  BookOpen,
  Mail,
  Phone,
  User,
  TrendingUp,
  Award,
  Clock,
  GraduationCap,
  Edit
} from 'lucide-react';
import { groupService } from '../services/groupService';
import { teacherService } from '../services/teacherService';
import { Modal } from '../components/ui/Modal';
import { studentService } from '../services/studentService';
import { performanceService } from '../services/performanceService';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { PerformanceOverview } from '../types/performance';

interface GroupDetail {
  id: number;
  name: string;
  courseNumber: number;
  description?: string;
  createdAt: string;
  studentsCount?: number;
  curatorTeacherId?: number | null;
  curator?: {
    id: number;
    user: {
      id?: number; // optional to align with API type
      name: string;
      surname: string;
      middlename?: string;
      email: string;
      phone?: string;
    };
  };
}

interface GroupStudent {
  id: number;
  user: {
    id: number;
    name: string;
    surname: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  createdAt: string;
}

const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [performance, setPerformance] = useState<PerformanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
const [form, setForm] = useState({ name: '', courseNumber: '', curatorTeacherId: '' });
const [teachers, setTeachers] = useState<any[]>([]);
const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // Переназначение студента
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignStudent, setReassignStudent] = useState<GroupStudent | null>(null);
  const [allGroups, setAllGroups] = useState<GroupDetail[]>([]);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadGroupDetails();
    }
  }, [id]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [groupResponse, studentsResponse, performanceResponse] = await Promise.all([
        groupService.getGroupById(parseInt(id!)),
        studentService.getStudentsByGroup(parseInt(id!)),
        performanceService.getStatistics({ groupId: id! }).catch(() => null) // Обрабатываем ошибку статистики отдельно
      ]);

      setGroup(groupResponse);
      setStudents(studentsResponse);
      if (performanceResponse) {
        setPerformance(performanceResponse.overview);
      }
    } catch (err) {
      console.error('Error loading group details:', err);
      setError('Не удалось загрузить информацию о группе');
    } finally {
      setLoading(false);
    }
  };

const openEdit = () => {
    if (!group) return;
    setForm({ 
      name: group.name, 
      courseNumber: String(group.courseNumber),
      curatorTeacherId: group.curatorTeacherId ? String(group.curatorTeacherId) : ''
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    setSaving(true);
    setEditError(null);
    try {
      const payload: Partial<{ name: string; courseNumber: number; curatorTeacherId: number | null; }> = {};
      if (form.name && form.name !== group.name) payload.name = form.name.trim();
      const num = Number(form.courseNumber);
      if (!Number.isNaN(num) && num !== group.courseNumber) payload.courseNumber = num;

      // curator logic
      if (form.curatorTeacherId === '' && group.curatorTeacherId != null) {
        payload.curatorTeacherId = null;
      } else if (
        form.curatorTeacherId !== '' && 
        Number(form.curatorTeacherId) !== group.curatorTeacherId
      ) {
        payload.curatorTeacherId = Number(form.curatorTeacherId);
      }

      if (Object.keys(payload).length === 0) {
        setEditOpen(false);
        setSaving(false);
        return;
      }
      const updated = await groupService.updateGroup(group.id, payload);
      setGroup(prev => prev ? { ...prev, ...updated } : updated);
      setEditOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения';
      setEditError(message);
    } finally {
      setSaving(false);
    }
  };

  // --- Переназначение студента логика ---
  interface MinimalGroup { id: number; name: string; courseNumber: number; createdAt?: string }
  const loadAllGroups = useCallback(async () => {
    try {
  const list = await groupService.getAllGroups();
  const mapped: MinimalGroup[] = list.map(g => ({ id: g.id, name: g.name, courseNumber: (g as unknown as { courseNumber: number }).courseNumber, createdAt: (g as unknown as { createdAt?: string }).createdAt }));
  // Приводим к типу GroupDetail (требуются только совпадающие поля)
  setAllGroups(mapped.map(m => ({ id: m.id, name: m.name, courseNumber: m.courseNumber, createdAt: m.createdAt || new Date().toISOString() })));
    } catch (e) {
      // тихо игнорируем
    }
  }, []);

  const openReassign = (student: GroupStudent) => {
    setReassignStudent(student);
    setTargetGroupId('');
    setReassignError(null);
    setReassignSuccess(null);
    setReassignOpen(true);
    void loadAllGroups();
  };

  const handleReassign = async () => {
    if (!reassignStudent || !targetGroupId) return;
    const newGroupId = parseInt(targetGroupId, 10);
    if (!newGroupId || newGroupId === group?.id) {
      setReassignError('Выберите другую группу');
      return;
    }
    setReassignLoading(true);
    setReassignError(null);
    setReassignSuccess(null);
    try {
      await groupService.addStudentToGroup(newGroupId, reassignStudent.id);
      setReassignSuccess('Студент переназначен');
      // Обновляем текущую группу (удаляем студента из списка)
      setStudents(prev => prev.filter(s => s.id !== reassignStudent.id));
      // Если хотим перейти в новую группу: navigate(`/groups/${newGroupId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось переназначить';
      setReassignError(msg);
    } finally {
      setReassignLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  const getCourseColor = (courseNumber: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[(courseNumber - 1) % colors.length];
  };

  // Load teachers when edit modal opens
  useEffect(() => {
    if (editOpen) {
      (async () => {
        setLoadingTeachers(true);
        try {
          const list = await teacherService.getTeachers();
          setTeachers(list);
        } catch {
          setTeachers([]);
        } finally {
          setLoadingTeachers(false);
        }
      })();
    }
  }, [editOpen]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад к группам
          </button>
        </div>
        <Alert variant="error" title="Ошибка">
          {error || 'Группа не найдена'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад к группам
          </button>
          
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCourseColor(group.courseNumber)}`}>
                {group.courseNumber} курс
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Создана {formatDate(group.createdAt)}
            </p>
          </div>
        </div>

        <button onClick={openEdit} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Edit className="w-4 h-4 mr-2" />
          Редактировать
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Студентов</p>
              <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Курс</p>
              <p className="text-2xl font-semibold text-gray-900">{group.courseNumber}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Средний балл</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performance ? performance.averageGrade.toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Посещаемость</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performance ? `${performance.attendanceRate}%` : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2" />
            Список студентов ({students.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {students.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет студентов</h3>
              <p className="text-gray-600">В этой группе пока нет зачисленных студентов</p>
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {student.user.avatar ? (
                        <img
                          src={student.user.avatar}
                          alt={`${student.user.name} ${student.user.surname}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {getInitials(student.user.name, student.user.surname)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {student.user.name} {student.user.surname}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {student.user.email}
                        </div>
                        {student.user.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {student.user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Зачислен {formatDate(student.createdAt)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReassign(student);
                      }}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                    >
                      Переназначить
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Group Description */}
      {group.description && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Описание группы</h3>
          <p className="text-gray-600">{group.description}</p>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => !saving && setEditOpen(false)} title="Редактирование группы" size="lg">
        <form onSubmit={handleSave} className="space-y-6">
          {editError && (
            <div className="p-3 rounded bg-red-50 text-sm text-red-700 border border-red-200">{editError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={50}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Напр. 10А"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Номер курса</label>
              <input
                name="courseNumber"
                type="number"
                min={1}
                max={12}
                value={form.courseNumber}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Куратор</label>
              <select
                name="curatorTeacherId"
                value={form.curatorTeacherId}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={loadingTeachers || saving}
              >
                <option value="">— Не выбран —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.user.surname} {t.user.name}{t.user.middlename ? ` ${t.user.middlename}` : ''}
                  </option>
                ))}
              </select>
              {loadingTeachers && (
                <p className="mt-1 text-xs text-gray-500">Загрузка преподавателей...</p>
              )}
              {group.curatorTeacherId && !form.curatorTeacherId && (
                <p className="mt-1 text-xs text-gray-500">
                  Текущий куратор будет снят
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => !saving && setEditOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              disabled={saving}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {saving && <Spinner size="sm" />}
              <span className={saving ? 'ml-2' : ''}>{saving ? 'Сохранение...' : 'Сохранить'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Reassign Student Modal */}
      <Modal
        isOpen={reassignOpen}
        onClose={() => !reassignLoading && setReassignOpen(false)}
        title={reassignStudent ? `Переназначить: ${reassignStudent.user.name} ${reassignStudent.user.surname}` : 'Переназначить студента'}
        size="lg"
      >
        {reassignError && (
          <div className="mb-4 p-3 rounded bg-red-50 text-sm text-red-700 border border-red-200">{reassignError}</div>
        )}
        {reassignSuccess && (
          <div className="mb-4 p-3 rounded bg-green-50 text-sm text-green-700 border border-green-200">{reassignSuccess}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Новая группа</label>
            <select
              value={targetGroupId}
              onChange={e => setTargetGroupId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={reassignLoading}
            >
              <option value="">-- Выберите группу --</option>
              {allGroups
                .filter(g => g.id !== group.id)
                .map(g => (
                  <option key={g.id} value={g.id}>{g.name} (курс {g.courseNumber})</option>
                ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => !reassignLoading && setReassignOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              disabled={reassignLoading}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleReassign}
              disabled={reassignLoading || !targetGroupId}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {reassignLoading && <Spinner size="sm" />}
              <span className={reassignLoading ? 'ml-2' : ''}>{reassignLoading ? 'Переназначение...' : 'Сохранить'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GroupDetail;

// Вспомогательные функции / хэндлеры (добавим перед export по факту — но для компактности оставляем здесь)
