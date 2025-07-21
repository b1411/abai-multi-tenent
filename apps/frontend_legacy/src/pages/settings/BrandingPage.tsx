import React, { useState } from 'react';
import { FaImage, FaPalette, FaSave, FaUpload } from 'react-icons/fa';

interface BrandingSettings {
  schoolName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

const initialSettings: BrandingSettings = {
  schoolName: 'Fizmat AI Ala',
  logo: '/logo.png',
  favicon: '/favicon.ico',
  primaryColor: '#1C7E66',
  secondaryColor: '#fff',
  accentColor: '#1C7E66',
  fontFamily: 'Inter'
};

const BrandingPage: React.FC = () => {
  const [settings, setSettings] = useState<BrandingSettings>(initialSettings);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const handleColorChange = (key: keyof BrandingSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Настройки брендинга</h1>
        <button className="bg-corporate-primary hover:bg-corporate-primary/80 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <FaSave /> Сохранить изменения
        </button>
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
                  className="w-full p-2 border rounded"
                  value={settings.schoolName}
                  onChange={(e) => handleColorChange('schoolName', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Логотип
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                    {previewLogo ? (
                      <img src={previewLogo} alt="Preview" className="max-w-full max-h-full" />
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
                    className="w-8 h-8 p-0 border-0"
                    value={settings.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded"
                    value={settings.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
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
                    className="w-8 h-8 p-0 border-0"
                    value={settings.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded"
                    value={settings.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
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
                    className="w-8 h-8 p-0 border-0"
                    value={settings.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded"
                    value={settings.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
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
                className="w-full p-2 border rounded"
                value={settings.fontFamily}
                onChange={(e) => handleColorChange('fontFamily', e.target.value)}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Предпросмотр</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  {previewLogo ? (
                    <img src={previewLogo} alt="Logo" className="w-8 h-8" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded" />
                  )}
                  <span className="font-semibold" style={{ color: settings.primaryColor }}>
                    {settings.schoolName}
                  </span>
                </div>
                <div className="space-y-2">
                  <button
                    className="w-full py-2 px-4 rounded"
                    style={{ backgroundColor: settings.primaryColor, color: 'white' }}
                  >
                    Основная кнопка
                  </button>
                  <button
                    className="w-full py-2 px-4 rounded"
                    style={{ backgroundColor: settings.secondaryColor, color: 'white' }}
                  >
                    Вторичная кнопка
                  </button>
                  <div
                    className="w-full py-2 px-4 rounded"
                    style={{ backgroundColor: settings.accentColor, color: 'white' }}
                  >
                    Акцентный элемент
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
