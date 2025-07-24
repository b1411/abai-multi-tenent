import React, { useState } from 'react';
import { FaPalette, FaFont, FaImage, FaSave, FaUndo, FaUpload } from 'react-icons/fa';
import { useBrandingContext } from '../contexts/BrandingContext';
import { BrandingSettings } from '../types/system';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

const BrandingPage: React.FC = () => {
  const { branding: settings, loading, updateBranding: updateSettings } = useBrandingContext();
  const [formData, setFormData] = useState<Partial<BrandingSettings>>({});
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [previewFavicon, setPreviewFavicon] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
      setPreviewLogo(settings.logo);
      setPreviewFavicon(settings.favicon);
    }
  }, [settings]);

  const handleSettingChange = (key: keyof BrandingSettings, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setPreviewLogo(url);
        setFormData(prev => ({ ...prev, logo: url }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setPreviewFavicon(url);
        setFormData(prev => ({ ...prev, favicon: url }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings(formData);
      setSaveMessage('Настройки брендинга успешно сохранены');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage('Ошибка сохранения настроек');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Настройки брендинга</h1>
        <div className="flex gap-2">
          {saveMessage && (
            <Alert 
              variant={saveMessage.includes('Ошибка') ? 'error' : 'success'} 
              message={saveMessage}
              className="mr-4"
            />
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isSaving ? <Spinner size="sm" /> : <FaSave />}
            Сохранить изменения
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название школы
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={formData.schoolName || ''}
                  onChange={(e) => handleSettingChange('schoolName', e.target.value)}
                  placeholder="Fizmat AI Ala"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Логотип
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
                    {previewLogo ? (
                      <img src={previewLogo} alt="Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <FaImage className="text-4xl text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded cursor-pointer flex items-center gap-2">
                      <FaUpload />
                      <span>Загрузить логотип</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Рекомендуемый размер: 200x200px, PNG или SVG
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Favicon
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
                    {previewFavicon ? (
                      <img src={previewFavicon} alt="Favicon Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <FaImage className="text-2xl text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded cursor-pointer flex items-center gap-2">
                      <FaUpload />
                      <span>Загрузить favicon</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFaviconUpload}
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Размер: 16x16px или 32x32px, ICO или PNG
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Цветовая схема</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Основной цвет
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-12 h-10 p-1 border rounded"
                    value={formData.primaryColor || '#1C7E66'}
                    onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-lg"
                    value={formData.primaryColor || '#1C7E66'}
                    onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Вторичный цвет
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-12 h-10 p-1 border rounded"
                    value={formData.secondaryColor || '#ffffff'}
                    onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-lg"
                    value={formData.secondaryColor || '#ffffff'}
                    onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Акцентный цвет
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-12 h-10 p-1 border rounded"
                    value={formData.accentColor || '#1C7E66'}
                    onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-lg"
                    value={formData.accentColor || '#1C7E66'}
                    onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Типографика</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Основной шрифт
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={formData.fontFamily || 'Inter'}
                onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
                <option value="Lato">Lato</option>
              </select>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaPalette />
              Предпросмотр
            </h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4" style={{ fontFamily: formData.fontFamily }}>
                <div className="flex items-center gap-3 mb-4">
                  {previewLogo ? (
                    <img src={previewLogo} alt="Logo" className="w-10 h-10 object-contain" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <FaImage className="text-gray-400" />
                    </div>
                  )}
                  <span 
                    className="font-semibold text-lg"
                    style={{ color: formData.primaryColor || '#1C7E66' }}
                  >
                    {formData.schoolName || 'Название школы'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <button
                    className="w-full py-2 px-4 rounded text-white font-medium"
                    style={{ 
                      backgroundColor: formData.primaryColor || '#1C7E66',
                      fontFamily: formData.fontFamily 
                    }}
                  >
                    Основная кнопка
                  </button>
                  
                  <button
                    className="w-full py-2 px-4 rounded border font-medium"
                    style={{ 
                      backgroundColor: formData.secondaryColor || '#ffffff',
                      borderColor: formData.primaryColor || '#1C7E66',
                      color: formData.primaryColor || '#1C7E66',
                      fontFamily: formData.fontFamily 
                    }}
                  >
                    Вторичная кнопка
                  </button>
                  
                  <div
                    className="w-full py-2 px-4 rounded text-white text-center font-medium"
                    style={{ 
                      backgroundColor: formData.accentColor || '#1C7E66',
                      fontFamily: formData.fontFamily 
                    }}
                  >
                    Акцентный элемент
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p 
                      className="text-sm"
                      style={{ fontFamily: formData.fontFamily }}
                    >
                      Пример текста с выбранным шрифтом. Так будет выглядеть основной контент сайта.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                Предпросмотр показывает, как будут выглядеть элементы интерфейса с выбранными настройками брендинга.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingPage;
