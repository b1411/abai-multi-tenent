import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlumniDetail } from '../hooks/useAlumni';
import { Alumni, AlumniStatus } from '../types/alumni';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  Briefcase, 
  GraduationCap,
  Award,
  ExternalLink,
  Star,
  User,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const AlumniDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const alumniId = parseInt(id || '0');
  const { alumni, loading, error, updateAlumni } = useAlumniDetail(alumniId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Alumni>>({});
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    if (alumni) {
      setEditForm({
        email: alumni.email || '',
        phone: alumni.phone || '',
        currentJob: alumni.currentJob || '',
        currentCompany: alumni.currentCompany || '',
        industry: alumni.industry || '',
        linkedin: alumni.linkedin || '',
        status: alumni.status
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateAlumni(editForm);
      if (updated) {
        setIsEditing(false);
        success('Данные выпускника успешно обновлены');
      } else {
        showError('Ошибка при обновлении данных');
      }
    } catch (err) {
      showError('Ошибка при обновлении данных');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const formatGraduationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: AlumniStatus) => {
    switch (status) {
      case AlumniStatus.ACTIVE:
        return 'bg-green-100 text-green-800 border-green-200';
      case AlumniStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: AlumniStatus) => {
    switch (status) {
      case AlumniStatus.ACTIVE:
        return 'Активный';
      case AlumniStatus.INACTIVE:
        return 'Неактивный';
      default:
        return 'Неизвестно';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Загрузка данных выпускника...</span>
        </div>
      </div>
    );
  }

  if (error || !alumni) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Ошибка загрузки данных
            </h2>
            <p className="text-red-600 mb-4">
              {error || 'Выпускник не найден'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/alumni')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Вернуться к списку
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Заголовок с навигацией */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/alumni')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Вернуться к списку выпускников
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {alumni.name} {alumni.surname}
                {alumni.middlename && ` ${alumni.middlename}`}
              </h1>
              <p className="text-gray-600 mt-2">
                Выпускник группы {alumni.groupName} • {alumni.graduationYear}
              </p>
            </div>
            
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-5 w-5 mr-2" />
                Редактировать
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Профиль */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Профиль выпускника
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Аватар и основная инфо */}
                <div className="md:col-span-2 flex items-center space-x-6 mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {alumni.avatar ? (
                      <img 
                        src={alumni.avatar} 
                        alt={`${alumni.name} ${alumni.surname}`}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      `${alumni.name[0]}${alumni.surname[0]}`
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {alumni.name} {alumni.surname}
                    </h3>
                    {alumni.middlename && (
                      <p className="text-gray-600">{alumni.middlename}</p>
                    )}
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(alumni.status)}`}>
                        {getStatusText(alumni.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Академическая информация */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Академическая информация</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <GraduationCap className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">Группа: {alumni.groupName}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">
                        Выпуск: {formatGraduationDate(alumni.graduationDate)}
                      </span>
                    </div>
                    {alumni.gpa && (
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-700">GPA: {alumni.gpa}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Карьерная информация */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Карьерная информация</h4>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Компания
                        </label>
                        <input
                          type="text"
                          value={editForm.currentCompany || ''}
                          onChange={(e) => setEditForm({...editForm, currentCompany: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Название компании"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Должность
                        </label>
                        <input
                          type="text"
                          value={editForm.currentJob || ''}
                          onChange={(e) => setEditForm({...editForm, currentJob: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Должность"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Индустрия
                        </label>
                        <input
                          type="text"
                          value={editForm.industry || ''}
                          onChange={(e) => setEditForm({...editForm, industry: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Индустрия"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alumni.currentCompany ? (
                        <>
                          <div className="flex items-center">
                            <Building className="h-5 w-5 text-gray-400 mr-3" />
                            <span className="text-gray-700">{alumni.currentCompany}</span>
                          </div>
                          {alumni.currentJob && (
                            <div className="flex items-center">
                              <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                              <span className="text-gray-700">{alumni.currentJob}</span>
                            </div>
                          )}
                          {alumni.industry && (
                            <div className="mt-2">
                              <span className="inline-block px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                                {alumni.industry}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-500 italic">Информация о работе не указана</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Достижения */}
            {alumni.achievements && alumni.achievements.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Award className="h-6 w-6 mr-2" />
                  Достижения
                </h2>
                <div className="space-y-3">
                  {alumni.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Контактная информация */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Контактная информация
              </h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+7 XXX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={editForm.linkedin || ''}
                      onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Статус
                    </label>
                    <select
                      value={editForm.status || alumni.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value as AlumniStatus})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={AlumniStatus.ACTIVE}>Активный</option>
                      <option value={AlumniStatus.INACTIVE}>Неактивный</option>
                    </select>
                  </div>
                  
                  {/* Кнопки сохранения */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Сохранить
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {alumni.email ? (
                    <a
                      href={`mailto:${alumni.email}`}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Mail className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{alumni.email}</span>
                    </a>
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-500 italic">Email не указан</span>
                    </div>
                  )}

                  {alumni.phone ? (
                    <a
                      href={`tel:${alumni.phone}`}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Phone className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-gray-700">{alumni.phone}</span>
                    </a>
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-500 italic">Телефон не указан</span>
                    </div>
                  )}

                  {alumni.linkedin ? (
                    <a
                      href={alumni.linkedin.startsWith('http') ? alumni.linkedin : `https://${alumni.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-gray-700">LinkedIn профиль</span>
                    </a>
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <ExternalLink className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-500 italic">LinkedIn не указан</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Дополнительная информация */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Дополнительная информация
              </h2>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Добавлен в систему:</span>
                  <br />
                  {new Date(alumni.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div>
                  <span className="font-medium">Последнее обновление:</span>
                  <br />
                  {new Date(alumni.updatedAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniDetail;
