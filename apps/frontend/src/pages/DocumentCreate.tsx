import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  Users,
  Calendar,
  AlertCircle,
  Type,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import { edoService, type DocumentTemplate, type User, type Student } from '../services/edoService';
import FileUpload from '../components/FileUpload';

const DocumentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    content: '',
    templateId: '',
    responsibleId: '',
    studentId: '',
    deadline: '',
    approverIds: [] as number[],
    fileIds: [] as number[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contentInputMode, setContentInputMode] = useState<'file' | 'text'>('file');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (formData.templateId) {
      loadTemplate(formData.templateId);
    }
  }, [formData.templateId]);

  const fetchTemplates = async () => {
    try {
      const data = await edoService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Загружаем пользователей...');
      const data = await edoService.getApprovers();
      console.log('Полученные пользователи:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await edoService.getStudents();
      setStudents(data || []);
    } catch (error) {
      console.error('Ошибка загрузки студентов:', error);
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const template = await edoService.getTemplate(templateId);
      setFormData(prev => ({
        ...prev,
        type: template.type,
        content: template.content,
        title: template.name,
      }));
    } catch (error) {
      console.error('Ошибка загрузки шаблона:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleApproverToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      approverIds: prev.approverIds.includes(userId)
        ? prev.approverIds.filter(id => id !== userId)
        : [...prev.approverIds, userId],
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название документа обязательно';
    }

    if (!formData.type) {
      newErrors.type = 'Тип документа обязателен';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Содержание документа обязательно';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (asDraft = true) => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        type: formData.type,
        content: formData.content,
        responsibleId: formData.responsibleId ? parseInt(formData.responsibleId) : undefined,
        studentId: formData.studentId ? parseInt(formData.studentId) : undefined,
        deadline: formData.deadline || undefined,
        approverIds: asDraft ? [] : formData.approverIds, // Согласующие только при отправке
        fileIds: formData.fileIds,
      };

      const document = await edoService.createDocument(payload);
      navigate(`/edo/${document.id}`);
    } catch (error) {
      console.error('Ошибка создания документа:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (content: string, fileName: string, fileId?: number) => {
    handleInputChange('content', content);
    setUploadedFileName(fileName);
    
    // Сохраняем ID файла
    if (fileId) {
      handleInputChange('fileIds', [fileId]);
    }
    
    // Если название документа пустое, используем имя файла
    if (!formData.title.trim() && fileName) {
      const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
      handleInputChange('title', nameWithoutExtension);
    }
  };

  const handleFileUploadError = (error: string) => {
    setErrors(prev => ({
      ...prev,
      content: error,
    }));
  };

  const getTypeText = (type: string) => {
    return edoService.getTypeText(type);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/edo')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Создание документа</h1>
          <p className="text-gray-600 mt-1">
            Заполните информацию для создания нового документа
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная форма */}
        <div className="lg:col-span-2 space-y-6">
          {/* Основная информация */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Основная информация
            </h2>

            <div className="space-y-4">
              {/* Шаблон */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Шаблон документа
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => handleInputChange('templateId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите шаблон (необязательно)</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {getTypeText(template.type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Название */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название документа *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Введите название документа"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Тип документа */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип документа *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите тип документа</option>
                  <option value="STUDENT_CERTIFICATE">Справка об обучении</option>
                  <option value="ADMINISTRATIVE_ORDER">Административный приказ</option>
                  <option value="FINANCIAL_CONTRACT">Финансовый договор</option>
                  <option value="ENROLLMENT_ORDER">Приказ о зачислении</option>
                  <option value="ACADEMIC_TRANSCRIPT">Академическая справка</option>
                </select>
                {errors.type && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.type}
                  </p>
                )}
              </div>

              {/* Содержание */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Содержание документа *
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setContentInputMode('file')}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        contentInputMode === 'file'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FileText className="w-3 h-3 inline mr-1" />
                      Файл
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentInputMode('text')}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        contentInputMode === 'text'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Type className="w-3 h-3 inline mr-1" />
                      Текст
                    </button>
                  </div>
                </div>

                {contentInputMode === 'file' ? (
                  <FileUpload
                    onFileUpload={handleFileUpload}
                    onError={handleFileUploadError}
                    acceptedTypes={['.doc', '.docx', '.pdf', '.txt']}
                    maxSize={50}
                    className={errors.content ? 'border-red-500' : ''}
                  />
                ) : (
                  <textarea
                    rows={10}
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Введите содержание документа"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.content ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                )}

                {errors.content && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.content}
                  </p>
                )}

                {uploadedFileName && contentInputMode === 'file' && (
                  <p className="text-sm text-green-600 mt-2">
                    Загружен файл: {uploadedFileName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Согласующие */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Согласующие лица
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Выберите пользователей, которые должны согласовать документ
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Загрузка пользователей...</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Всего пользователей: {users.length}
                  </p>
                </div>
              ) : (
                users
                  .filter(user => ['ADMIN', 'HR', 'TEACHER'].includes(user.role))
                  .map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.approverIds.includes(user.id)}
                        onChange={() => handleApproverToggle(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name} {user.surname}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {user.role}
                      </span>
                    </label>
                  ))
              )}
              
              {users.length > 0 && users.filter(user => ['ADMIN', 'HR', 'TEACHER'].includes(user.role)).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">Нет пользователей с правами согласования</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Всего пользователей: {users.length}, подходящих: 0
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Дополнительные настройки */}
        <div className="space-y-6">
          {/* Связанные данные */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Дополнительно
            </h2>

            <div className="space-y-4">
              {/* Ответственный */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ответственный
                </label>
                <select
                  value={formData.responsibleId}
                  onChange={(e) => handleInputChange('responsibleId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Не назначен</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.surname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Студент */}
              {['STUDENT_CERTIFICATE', 'ENROLLMENT_ORDER', 'ACADEMIC_TRANSCRIPT'].includes(formData.type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Студент
                  </label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Выберите студента</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user.name} {student.user.surname} - {student.group.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Срок */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Срок выполнения
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Действия */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="space-y-3">
              <PermissionGuard module="edo" action="create">
                <button
                  onClick={() => handleSave(true)}
                  disabled={loading}
                  className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Сохранение...' : 'Сохранить как черновик'}
                </button>
              </PermissionGuard>

              <PermissionGuard module="edo" action="create">
                <button
                  onClick={() => handleSave(false)}
                  disabled={loading || formData.approverIds.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Отправка...' : 'Отправить на согласование'}
                </button>
              </PermissionGuard>

              {formData.approverIds.length === 0 && (
                <p className="text-xs text-gray-500 text-center">
                  Для отправки на согласование выберите согласующих лиц
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCreatePage;
