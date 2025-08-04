import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrophy, FaGraduationCap, FaCertificate, FaUsers, FaProjectDiagram, FaUpload, FaFile } from 'react-icons/fa';
import { kpiService } from '../services/kpiService';
import { Spinner } from './ui/Spinner';

interface Student {
  id: number;
  name: string;
  email?: string;
}

interface KpiAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: number;
  teacherName: string;
  onSuccess: () => void;
}

const KpiAchievementModal: React.FC<KpiAchievementModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<string>('olympiad');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: string}>({});

  // Формы для разных типов достижений
  const [olympiadForm, setOlympiadForm] = useState({
    studentId: '',
    olympiadName: '',
    subject: '',
    level: '',
    place: '',
    date: '',
    certificateUrl: '',
  });

  const [admissionForm, setAdmissionForm] = useState({
    studentId: '',
    schoolType: '',
    schoolName: '',
    admissionYear: new Date().getFullYear().toString(),
    documentUrl: '',
  });

  const [achievementForm, setAchievementForm] = useState({
    type: 'QUALIFICATION',
    title: '',
    description: '',
    date: '',
    points: '',
    evidenceUrl: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen, teacherId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await kpiService.getStudents(teacherId);
      // API возвращает массив студентов напрямую
      const studentsData = Array.isArray(response) ? response : (response as any)?.data || [];
      
      // Преобразуем в нужный формат
      const formattedStudents = studentsData.map((student: any) => {
        const user = student.user || {};
        const firstName = user.name || user.firstName || '';
        const lastName = user.lastName || user.surname || '';
        const fullName = `${firstName} ${lastName}`.trim() || student.name || 'Неизвестный студент';
        
        return {
          id: student.id,
          name: fullName,
          email: user.email || student.email
        };
      });
      
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Ошибка при загрузке студентов:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, fieldName: string, formType: string) => {
    if (!file) return;

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Разрешены только файлы форматов: JPG, PNG, PDF');
      return;
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    try {
      setUploadingFile(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'kpi-certificate');

      // Используем существующий API загрузки файлов
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки файла');
      }

      const result = await response.json();
      const fileUrl = result.url || result.path;

      // Обновляем соответствующую форму
      const fileKey = `${formType}_${fieldName}`;
      setUploadedFiles(prev => ({ ...prev, [fileKey]: fileUrl }));

      if (formType === 'olympiad') {
        setOlympiadForm(prev => ({ ...prev, [fieldName]: fileUrl }));
      } else if (formType === 'admission') {
        setAdmissionForm(prev => ({ ...prev, [fieldName]: fileUrl }));
      } else if (formType === 'achievement') {
        setAchievementForm(prev => ({ ...prev, [fieldName]: fileUrl }));
      }

      alert('Файл успешно загружен!');
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      alert('Произошла ошибка при загрузке файла');
    } finally {
      setUploadingFile(false);
    }
  };

  const FileUploadField = ({ 
    label, 
    fieldName, 
    formType, 
    currentUrl, 
    placeholder = "Или вставьте ссылку" 
  }: {
    label: string;
    fieldName: string;
    formType: string;
    currentUrl: string;
    placeholder?: string;
  }) => {
    const fileKey = `${formType}_${fieldName}`;
    const uploadedUrl = uploadedFiles[fileKey];
    const displayUrl = uploadedUrl || currentUrl;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        
        {/* Показываем загруженный файл */}
        {displayUrl && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <FaFile className="text-green-600 mr-2" />
              <span className="text-sm text-green-700">
                {displayUrl.includes('/') ? displayUrl.split('/').pop() : 'Файл загружен'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const newFiles = { ...uploadedFiles };
                delete newFiles[fileKey];
                setUploadedFiles(newFiles);
                
                // Очищаем URL в форме
                if (formType === 'olympiad') {
                  setOlympiadForm(prev => ({ ...prev, [fieldName]: '' }));
                } else if (formType === 'admission') {
                  setAdmissionForm(prev => ({ ...prev, [fieldName]: '' }));
                } else if (formType === 'achievement') {
                  setAchievementForm(prev => ({ ...prev, [fieldName]: '' }));
                }
              }}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              <FaTimes />
            </button>
          </div>
        )}

        <div className="flex space-x-2">
          {/* Кнопка загрузки файла */}
          <label className="flex-1 relative cursor-pointer">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file, fieldName, formType);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingFile}
            />
            <div className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors">
              {uploadingFile ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <FaUpload className="mr-2 text-gray-600" />
                  <span className="text-sm text-gray-700">Загрузить файл</span>
                </>
              )}
            </div>
          </label>

          {/* Поле для ввода URL */}
          <input
            type="url"
            value={currentUrl}
            onChange={(e) => {
              const url = e.target.value;
              if (formType === 'olympiad') {
                setOlympiadForm(prev => ({ ...prev, [fieldName]: url }));
              } else if (formType === 'admission') {
                setAdmissionForm(prev => ({ ...prev, [fieldName]: url }));
              } else if (formType === 'achievement') {
                setAchievementForm(prev => ({ ...prev, [fieldName]: url }));
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholder}
          />
        </div>

        <p className="text-xs text-gray-500 mt-1">
          Поддерживаемые форматы: JPG, PNG, PDF. Максимальный размер: 5MB
        </p>
      </div>
    );
  };

  const resetForms = () => {
    setOlympiadForm({
      studentId: '',
      olympiadName: '',
      subject: '',
      level: '',
      place: '',
      date: '',
      certificateUrl: '',
    });

    setAdmissionForm({
      studentId: '',
      schoolType: '',
      schoolName: '',
      admissionYear: new Date().getFullYear().toString(),
      documentUrl: '',
    });

    setAchievementForm({
      type: 'QUALIFICATION',
      title: '',
      description: '',
      date: '',
      points: '',
      evidenceUrl: '',
    });

    setSelectedStudent(null);
    setUploadedFiles({});
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  const handleOlympiadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!olympiadForm.studentId || !olympiadForm.olympiadName || !olympiadForm.subject || !olympiadForm.level || !olympiadForm.place || !olympiadForm.date) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      await kpiService.createOlympiadResult({
        studentId: parseInt(olympiadForm.studentId),
        teacherId: teacherId,
        olympiadName: olympiadForm.olympiadName,
        subject: olympiadForm.subject,
        level: olympiadForm.level,
        place: parseInt(olympiadForm.place),
        date: olympiadForm.date,
        certificateUrl: olympiadForm.certificateUrl || undefined,
      });

      alert('Результат олимпиады успешно добавлен!');
      resetForms();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка при добавлении результата олимпиады:', error);
      alert('Произошла ошибка при добавлении результата олимпиады');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionForm.studentId || !admissionForm.schoolType || !admissionForm.schoolName || !admissionForm.admissionYear) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      await kpiService.createStudentAdmission({
        studentId: parseInt(admissionForm.studentId),
        teacherId: teacherId,
        schoolType: admissionForm.schoolType,
        schoolName: admissionForm.schoolName,
        admissionYear: parseInt(admissionForm.admissionYear),
        documentUrl: admissionForm.documentUrl || undefined,
      });

      alert('Поступление студента успешно добавлено!');
      resetForms();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка при добавлении поступления:', error);
      alert('Произошла ошибка при добавлении поступления');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAchievementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementForm.title || !achievementForm.date) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      await kpiService.createAchievement({
        teacherId: teacherId,
        type: achievementForm.type,
        title: achievementForm.title,
        description: achievementForm.description || undefined,
        date: achievementForm.date,
        points: achievementForm.points ? parseInt(achievementForm.points) : undefined,
        evidenceUrl: achievementForm.evidenceUrl || undefined,
      });

      alert('Достижение успешно добавлено!');
      resetForms();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка при добавлении достижения:', error);
      alert('Произошла ошибка при добавлении достижения');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'olympiad', label: 'Олимпиады', icon: FaTrophy },
    { id: 'admission', label: 'Поступления', icon: FaGraduationCap },
    { id: 'qualification', label: 'Квалификация', icon: FaCertificate },
    { id: 'events', label: 'Мероприятия', icon: FaUsers },
    { id: 'projects', label: 'Проекты', icon: FaProjectDiagram },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Добавить достижение</h2>
            <p className="text-sm text-gray-600">Преподаватель: {teacherName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={submitting}
          >
            <FaTimes />
          </button>
        </div>

        {/* Табы */}
        <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 md:px-4 py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="mr-1 md:mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Содержимое */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <>
              {/* Форма олимпиады */}
              {activeTab === 'olympiad' && (
                <form onSubmit={handleOlympiadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Студент *
                      </label>
                      <select
                        value={olympiadForm.studentId}
                        onChange={(e) => setOlympiadForm({ ...olympiadForm, studentId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Выберите студента</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название олимпиады *
                      </label>
                      <input
                        type="text"
                        value={olympiadForm.olympiadName}
                        onChange={(e) => setOlympiadForm({ ...olympiadForm, olympiadName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Например: Республиканская олимпиада по математике"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Предмет *
                      </label>
                      <input
                        type="text"
                        value={olympiadForm.subject}
                        onChange={(e) => setOlympiadForm({ ...olympiadForm, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Математика, Физика, Химия..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Уровень олимпиады *
                      </label>
                      <select
                        value={olympiadForm.level}
                        onChange={(e) => setOlympiadForm({ ...olympiadForm, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Выберите уровень</option>
                        <option value="Международный">Международный</option>
                        <option value="Республиканский">Республиканский</option>
                        <option value="Городской">Городской</option>
                        <option value="Школьный">Школьный</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Место *
                      </label>
                      <select
                        value={olympiadForm.place}
                        onChange={(e) => setOlympiadForm({ ...olympiadForm, place: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Выберите место</option>
                        <option value="1">1 место</option>
                        <option value="2">2 место</option>
                        <option value="3">3 место</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата олимпиады *
                      </label>
                      <input
                        type="date"
                        value={olympiadForm.date}
                        onChange={(e) => setOlympiadForm({ ...olympiadForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <FileUploadField
                    label="Сертификат или документ об участии"
                    fieldName="certificateUrl"
                    formType="olympiad"
                    currentUrl={olympiadForm.certificateUrl}
                    placeholder="https://..."
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                      disabled={submitting}
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? <Spinner size="sm" /> : 'Добавить'}
                    </button>
                  </div>
                </form>
              )}

              {/* Форма поступления */}
              {activeTab === 'admission' && (
                <form onSubmit={handleAdmissionSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Студент *
                      </label>
                      <select
                        value={admissionForm.studentId}
                        onChange={(e) => setAdmissionForm({ ...admissionForm, studentId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Выберите студента</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Тип школы *
                      </label>
                      <select
                        value={admissionForm.schoolType}
                        onChange={(e) => setAdmissionForm({ ...admissionForm, schoolType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Выберите тип школы</option>
                        <option value="RFMSH">РФМШ</option>
                        <option value="NISH">НИШ</option>
                        <option value="BIL">БИЛ</option>
                        <option value="LYCEUM">Лицей</option>
                        <option value="PRIVATE_SCHOOL">Частная школа</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название школы *
                      </label>
                      <input
                        type="text"
                        value={admissionForm.schoolName}
                        onChange={(e) => setAdmissionForm({ ...admissionForm, schoolName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Например: РФМШ им. Жаутыкова"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Год поступления *
                      </label>
                      <input
                        type="number"
                        value={admissionForm.admissionYear}
                        onChange={(e) => setAdmissionForm({ ...admissionForm, admissionYear: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="2020"
                        max={new Date().getFullYear() + 1}
                        required
                      />
                    </div>
                  </div>

                  <FileUploadField
                    label="Документ о поступлении"
                    fieldName="documentUrl"
                    formType="admission"
                    currentUrl={admissionForm.documentUrl}
                    placeholder="https://..."
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                      disabled={submitting}
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? <Spinner size="sm" /> : 'Добавить'}
                    </button>
                  </div>
                </form>
              )}

              {/* Общая форма достижений */}
              {(['qualification', 'events', 'projects'].includes(activeTab)) && (
                <form onSubmit={handleAchievementSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Тип достижения *
                      </label>
                      <select
                        value={achievementForm.type}
                        onChange={(e) => setAchievementForm({ ...achievementForm, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {activeTab === 'qualification' && (
                          <option value="QUALIFICATION">Повышение квалификации</option>
                        )}
                        {activeTab === 'events' && (
                          <option value="TEAM_EVENT">Командное мероприятие</option>
                        )}
                        {activeTab === 'projects' && (
                          <option value="PROJECT_HELP">Помощь в проекте</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата *
                      </label>
                      <input
                        type="date"
                        value={achievementForm.date}
                        onChange={(e) => setAchievementForm({ ...achievementForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название *
                    </label>
                    <input
                      type="text"
                      value={achievementForm.title}
                      onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        activeTab === 'qualification'
                          ? 'Например: Курс повышения квалификации по математике'
                          : activeTab === 'events'
                          ? 'Например: Участие в педагогической конференции'
                          : 'Например: Разработка учебных материалов'
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={achievementForm.description}
                      onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Подробное описание достижения..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Баллы
                      </label>
                      <input
                        type="number"
                        value={achievementForm.points}
                        onChange={(e) => setAchievementForm({ ...achievementForm, points: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Например: 10"
                        min="0"
                      />
                    </div>

                    <FileUploadField
                      label="Документ подтверждения"
                      fieldName="evidenceUrl"
                      formType="achievement"
                      currentUrl={achievementForm.evidenceUrl}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                      disabled={submitting}
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? <Spinner size="sm" /> : 'Добавить'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KpiAchievementModal;
