import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaSave,
  FaPlus,
  FaTrash,
  FaCog,
  FaExclamationTriangle,
  FaBell,
  FaCalendarAlt,
} from 'react-icons/fa';
import { kpiService } from '../services/kpiService';
import type { KpiSettings, KpiMetricSetting, KpiSettingsResponse } from '../types/kpi';
import { Spinner } from './ui/Spinner';

interface KpiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const KpiSettingsModal: React.FC<KpiSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [settings, setSettings] = useState<KpiSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'goals' | 'notifications'>('metrics');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await kpiService.getSettings() as KpiSettingsResponse;
      setSettings(response.settings);
    } catch (err) {
      setError('Ошибка при загрузке настроек');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);

      // Проверяем сумму весов
      const totalWeight = settings.metrics.reduce((sum, metric) => sum + metric.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.1) {
        throw new Error('Сумма весов метрик должна равняться 100%');
      }

      await kpiService.updateSettings(settings);
      onSave?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении настроек');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateMetric = (index: number, field: keyof KpiMetricSetting, value: any) => {
    if (!settings) return;

    const newMetrics = [...settings.metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };

    setSettings({
      ...settings,
      metrics: newMetrics,
    });
  };

  const addMetric = () => {
    if (!settings) return;

    const newMetric: KpiMetricSetting = {
      name: 'Новая метрика',
      weight: 0,
      target: 80,
      successThreshold: 85,
      warningThreshold: 70,
      isActive: true,
    };

    setSettings({
      ...settings,
      metrics: [...settings.metrics, newMetric],
    });
  };

  const removeMetric = (index: number) => {
    if (!settings) return;

    const newMetrics = settings.metrics.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      metrics: newMetrics,
    });
  };

  const getTotalWeight = () => {
    return settings?.metrics.reduce((sum, metric) => sum + metric.weight, 0) || 0;
  };

  const getWeightStatus = () => {
    const total = getTotalWeight();
    if (Math.abs(total - 100) < 0.1) return 'success';
    if (total > 100) return 'danger';
    return 'warning';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <FaCog className="text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Настройки KPI</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'metrics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('metrics')}
            >
              Метрики
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('notifications')}
            >
              Уведомления
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <FaExclamationTriangle className="text-red-400 mr-3 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          ) : settings ? (
            <>
              {/* Metrics Tab */}
              {activeTab === 'metrics' && (
                <div className="space-y-6">
                  {/* Weight Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Общий вес метрик</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Сумма весов:</span>
                      <span
                        className={`font-semibold ${
                          getWeightStatus() === 'success'
                            ? 'text-green-600'
                            : getWeightStatus() === 'danger'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {getTotalWeight()}%
                        {getWeightStatus() !== 'success' && ' (должно быть 100%)'}
                      </span>
                    </div>
                  </div>

                  {/* Metrics List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Метрики KPI</h3>
                      <button
                        onClick={addMetric}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FaPlus className="mr-2" size={14} />
                        Добавить метрику
                      </button>
                    </div>

                    {settings.metrics.map((metric, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Название метрики
                            </label>
                            <input
                              type="text"
                              value={metric.name}
                              onChange={(e) => updateMetric(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Вес (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={metric.weight}
                              onChange={(e) => updateMetric(index, 'weight', Number(e.target.value))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Целевое значение
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={metric.target}
                              onChange={(e) => updateMetric(index, 'target', Number(e.target.value))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Порог успеха
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={metric.successThreshold}
                              onChange={(e) => updateMetric(index, 'successThreshold', Number(e.target.value))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Порог предупреждения
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={metric.warningThreshold}
                              onChange={(e) => updateMetric(index, 'warningThreshold', Number(e.target.value))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`metric-active-${index}`}
                                checked={metric.isActive}
                                onChange={(e) => updateMetric(index, 'isActive', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`metric-active-${index}`} className="ml-2 text-sm text-gray-700">
                                Активна
                              </label>
                            </div>
                            <button
                              onClick={() => removeMetric(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Удалить метрику"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculation Period */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      Период пересчета
                    </h3>
                    <select
                      value={settings.calculationPeriod}
                      onChange={(e) => setSettings({
                        ...settings,
                        calculationPeriod: e.target.value as any,
                      })}
                      className="w-full md:w-auto border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="daily">Ежедневно</option>
                      <option value="weekly">Еженедельно</option>
                      <option value="monthly">Ежемесячно</option>
                      <option value="quarterly">Ежеквартально</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <FaBell className="mr-2" />
                      Настройки уведомлений
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="auto-notifications"
                          checked={settings.autoNotifications || false}
                          onChange={(e) => setSettings({
                            ...settings,
                            autoNotifications: e.target.checked,
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="auto-notifications" className="ml-2 text-sm text-gray-700">
                          Автоматические уведомления о низких показателях
                        </label>
                      </div>

                      {settings.autoNotifications && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Порог для уведомлений (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={settings.notificationThreshold || 70}
                            onChange={(e) => setSettings({
                              ...settings,
                              notificationThreshold: Number(e.target.value),
                            })}
                            className="w-full md:w-48 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Уведомления будут отправляться, когда KPI падает ниже этого значения
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !settings || getWeightStatus() !== 'success'}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <FaSave className="mr-2" size={14} />
            )}
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KpiSettingsModal;
