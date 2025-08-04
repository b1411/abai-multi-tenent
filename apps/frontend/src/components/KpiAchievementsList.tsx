import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrophy, FaSchool, FaCertificate, FaTrash, FaEye } from 'react-icons/fa';
import { kpiService } from '../services/kpiService';
import KpiEditModal from './KpiEditModal';
import { Spinner } from './ui/Spinner';

interface KpiAchievementsListProps {
  teacherId: number;
  teacherName: string;
  isOpen: boolean;
  onClose: () => void;
}

const KpiAchievementsList: React.FC<KpiAchievementsListProps> = ({
  teacherId,
  teacherName,
  isOpen,
  onClose,
}) => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [olympiadResults, setOlympiadResults] = useState<any[]>([]);
  const [studentAdmissions, setStudentAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'olympiads' | 'admissions'>('achievements');

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [editRecordType, setEditRecordType] = useState<'achievement' | 'olympiad' | 'admission'>('achievement');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, teacherId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [achievementsRes, olympiadsRes, admissionsRes] = await Promise.all([
        kpiService.getAchievements(teacherId),
        kpiService.getOlympiadResults(teacherId),
        kpiService.getStudentAdmissions(teacherId),
      ]) as [
        { achievements: any[] },
        { results: any[] },
        { admissions: any[] }
      ];

      setAchievements(achievementsRes.achievements || []);
      setOlympiadResults(olympiadsRes.results || []);
      setStudentAdmissions(admissionsRes.admissions || []);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: any, type: 'achievement' | 'olympiad' | 'admission') => {
    setEditRecord(record);
    setEditRecordType(type);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    loadData(); // Перезагружаем данные после успешного редактирования
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'PROFESSIONAL_DEVELOPMENT': 'Повышение квалификации',
      'TEAM_ACTIVITY': 'Командные мероприятия',
      'PROJECT_HELP': 'Помощь в проектах',
      'OLYMPIAD_WIN': 'Олимпиада',
      'SCHOOL_ADMISSION': 'Поступление',
      'OTHER': 'Другое',
    };
    return labels[type] || type;
  };

  const getSchoolTypeLabel = (schoolType: string) => {
    const labels: Record<string, string> = {
      'RFMSH': 'РФМШ',
      'NISH': 'НИШ',
      'BIL': 'БИЛ',
      'LYCEUM': 'Лицей',
      'PRIVATE_SCHOOL': 'Частная школа',
    };
    return labels[schoolType] || schoolType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const renderAchievements = () => (
    <div className="space-y-4">
      {achievements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaCertificate className="mx-auto text-4xl mb-2 opacity-50" />
          <p>Нет достижений</p>
        </div>
      ) : (
        achievements.map((achievement) => (
          <div key={achievement.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <FaCertificate className="text-yellow-500 mr-2" />
                  <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {getTypeLabel(achievement.type)}
                  </span>
                </div>
                
                {achievement.description && (
                  <p className="text-gray-600 text-sm mb-2">{achievement.description}</p>
                )}
                
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>📅 {formatDate(achievement.date)}</span>
                  {achievement.points > 0 && (
                    <span className="text-green-600 font-medium">+{achievement.points} баллов</span>
                  )}
                  {achievement.isVerified && (
                    <span className="text-green-600">✓ Подтверждено</span>
                  )}
                </div>

                {achievement.evidenceUrl && (
                  <div className="mt-2">
                    <a
                      href={achievement.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center"
                    >
                      <FaEye className="mr-1" />
                      Посмотреть сертификат
                    </a>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(achievement, 'achievement')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <FaEdit />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderOlympiads = () => (
    <div className="space-y-4">
      {olympiadResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaTrophy className="mx-auto text-4xl mb-2 opacity-50" />
          <p>Нет результатов олимпиад</p>
        </div>
      ) : (
        olympiadResults.map((result) => (
          <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <FaTrophy className="text-yellow-500 mr-2" />
                  <h4 className="font-semibold text-gray-900">{result.olympiadName}</h4>
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {result.level}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <p><strong>Предмет:</strong> {result.subject}</p>
                  <p><strong>Ученик:</strong> {result.studentName}</p>
                  <p><strong>Место:</strong> {result.place}</p>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <span>📅 {formatDate(result.date)}</span>
                </div>

                {result.certificateUrl && (
                  <div className="mt-2">
                    <a
                      href={result.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center"
                    >
                      <FaEye className="mr-1" />
                      Посмотреть сертификат
                    </a>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(result, 'olympiad')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <FaEdit />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderAdmissions = () => (
    <div className="space-y-4">
      {studentAdmissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaSchool className="mx-auto text-4xl mb-2 opacity-50" />
          <p>Нет записей о поступлениях</p>
        </div>
      ) : (
        studentAdmissions.map((admission) => (
          <div key={admission.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <FaSchool className="text-green-500 mr-2" />
                  <h4 className="font-semibold text-gray-900">{admission.schoolName}</h4>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {getSchoolTypeLabel(admission.schoolType)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <p><strong>Ученик:</strong> {admission.studentName}</p>
                  <p><strong>Год поступления:</strong> {admission.admissionYear}</p>
                </div>

                {admission.documentUrl && (
                  <div className="mt-2">
                    <a
                      href={admission.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center"
                    >
                      <FaEye className="mr-1" />
                      Посмотреть документ
                    </a>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(admission, 'admission')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <FaEdit />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Управление KPI записями: {teacherName}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Табы */}
            <div className="flex space-x-4 mt-4">
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'achievements'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaCertificate className="inline mr-2" />
                Достижения ({achievements.length})
              </button>
              <button
                onClick={() => setActiveTab('olympiads')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'olympiads'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaTrophy className="inline mr-2" />
                Олимпиады ({olympiadResults.length})
              </button>
              <button
                onClick={() => setActiveTab('admissions')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'admissions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaSchool className="inline mr-2" />
                Поступления ({studentAdmissions.length})
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {activeTab === 'achievements' && renderAchievements()}
                {activeTab === 'olympiads' && renderOlympiads()}
                {activeTab === 'admissions' && renderAdmissions()}
              </>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                💡 Нажмите на кнопку редактирования рядом с записью для изменения данных или загрузки сертификатов
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editRecord && (
        <KpiEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          recordType={editRecordType}
          recordId={editRecord.id}
          recordData={editRecord}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default KpiAchievementsList;
