import React, { useState, useEffect } from 'react';
import { FaTimes, FaUpload, FaCheck, FaSpinner } from 'react-icons/fa';
import { kpiService } from '../services/kpiService';

interface KpiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: 'achievement' | 'olympiad' | 'admission';
  recordId: number;
  recordData: any;
  onSuccess: () => void;
}

const KpiEditModal: React.FC<KpiEditModalProps> = ({
  isOpen,
  onClose,
  recordType,
  recordId,
  recordData,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  useEffect(() => {
    if (isOpen && recordData) {
      setFormData({ ...recordData });
      setCertificateUrl(recordData.evidenceUrl || recordData.certificateUrl || recordData.documentUrl || '');
    }
  }, [isOpen, recordData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверка размера файла (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }

      // Проверка типа файла
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Разрешены только файлы JPG, PNG и PDF');
        return;
      }

      setCertificateFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // Здесь должен быть реальный API для загрузки файлов
    // Пока используем заглушку
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`/uploads/certificates/${Date.now()}-${file.name}`);
      }, 1000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalFormData = { ...formData };

      // Обработка сертификата/документа
      if (uploadMethod === 'file' && certificateFile) {
        const uploadedUrl = await uploadFile(certificateFile);
        if (recordType === 'achievement') {
          finalFormData.evidenceUrl = uploadedUrl;
        } else if (recordType === 'olympiad') {
          finalFormData.certificateUrl = uploadedUrl;
        } else if (recordType === 'admission') {
          finalFormData.documentUrl = uploadedUrl;
        }
      } else if (uploadMethod === 'url' && certificateUrl) {
        if (recordType === 'achievement') {
          finalFormData.evidenceUrl = certificateUrl;
        } else if (recordType === 'olympiad') {
          finalFormData.certificateUrl = certificateUrl;
        } else if (recordType === 'admission') {
          finalFormData.documentUrl = certificateUrl;
        }
      }

      // Отправка обновленных данных
      let response;
      if (recordType === 'achievement') {
        response = await kpiService.updateAchievement(recordId, finalFormData);
      } else if (recordType === 'olympiad') {
        response = await kpiService.updateOlympiadResult(recordId, finalFormData);
      } else if (recordType === 'admission') {
        response = await kpiService.updateStudentAdmission(recordId, finalFormData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка при обновлении записи:', error);
      alert('Произошла ошибка при обновлении записи');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    switch (recordType) {
      case 'achievement':
        return 'Редактировать достижение';
      case 'olympiad':
        return 'Редактировать результат олимпиады';
      case 'admission':
        return 'Редактировать поступление';
      default:
        return 'Редактировать запись';
    }
  };

  const renderAchievementForm = () => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Тип достижения
        </label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.type || ''}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
        >
          <option value="">Выберите тип</option>
          <option value="PROFESSIONAL_DEVELOPMENT">Повышение квалификации</option>
          <option value="TEAM_ACTIVITY">Участие в командных мероприятиях</option>
          <option value="PROJECT_HELP">Помощь в проектах</option>
          <option value="OTHER">Другое</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название достижения
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Описание
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Дата
        </label>
        <input
          type="date"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Баллы
        </label>
        <input
          type="number"
          min="0"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.points || ''}
          onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
        />
      </div>
    </>
  );

  const renderOlympiadForm = () => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название олимпиады
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.olympiadName || ''}
          onChange={(e) => setFormData({ ...formData, olympiadName: e.target.value })}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Предмет
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.subject || ''}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Уровень
          </label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.level || ''}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Место
          </label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.place || ''}
            onChange={(e) => setFormData({ ...formData, place: parseInt(e.target.value) })}
            required
          >
            <option value="">Выберите место</option>
            <option value="1">1 место</option>
            <option value="2">2 место</option>
            <option value="3">3 место</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Дата
        </label>
        <input
          type="date"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>
    </>
  );

  const renderAdmissionForm = () => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Тип школы
        </label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.schoolType || ''}
          onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
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

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название школы
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.schoolName || ''}
          onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Год поступления
        </label>
        <input
          type="number"
          min="2020"
          max="2030"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.admissionYear || ''}
          onChange={(e) => setFormData({ ...formData, admissionYear: parseInt(e.target.value) })}
          required
        />
      </div>
    </>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{getModalTitle()}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              disabled={isSubmitting}
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {recordType === 'achievement' && renderAchievementForm()}
            {recordType === 'olympiad' && renderOlympiadForm()}
            {recordType === 'admission' && renderAdmissionForm()}

            {/* Сертификат/Документ */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {recordType === 'achievement' ? 'Сертификат/Документ' :
                 recordType === 'olympiad' ? 'Сертификат олимпиады' :
                 'Документ о поступлении'}
              </label>

              <div className="mb-3">
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="file"
                      checked={uploadMethod === 'file'}
                      onChange={(e) => setUploadMethod(e.target.value as 'file' | 'url')}
                      className="mr-2"
                    />
                    Загрузить файл
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="url"
                      checked={uploadMethod === 'url'}
                      onChange={(e) => setUploadMethod(e.target.value as 'file' | 'url')}
                      className="mr-2"
                    />
                    Ввести URL
                  </label>
                </div>
              </div>

              {uploadMethod === 'file' ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="certificate-upload"
                  />
                  <label
                    htmlFor="certificate-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FaUpload className="text-3xl text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {certificateFile ? certificateFile.name : 'Нажмите для выбора файла'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      JPG, PNG, PDF до 5MB
                    </span>
                  </label>
                </div>
              ) : (
                <input
                  type="url"
                  placeholder="https://example.com/certificate.pdf"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                />
              )}

              {/* Текущий файл */}
              {(formData.evidenceUrl || formData.certificateUrl || formData.documentUrl) && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaCheck className="text-green-500 mr-2" />
                    Текущий файл: 
                    <a 
                      href={formData.evidenceUrl || formData.certificateUrl || formData.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-600 hover:underline"
                    >
                      Просмотреть
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Обновление...
                  </>
                ) : (
                  'Обновить'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KpiEditModal;
