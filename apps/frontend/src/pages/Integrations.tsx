import React, { useState } from 'react';
import { FaPlug, FaCheck, FaTimes, FaCog, FaExternalLinkAlt, FaSync, FaPlus } from 'react-icons/fa';
import { useIntegrations } from '../hooks/useSystem';
import { Integration, CreateIntegrationDto, UpdateIntegrationDto } from '../types/system';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

interface IntegrationModalProps {
  integration?: Integration;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateIntegrationDto | UpdateIntegrationDto) => Promise<void>;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({ 
  integration, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: integration?.name || '',
    description: integration?.description || '',
    icon: integration?.icon || '🔗',
    apiKey: integration?.apiKey || '',
    webhookUrl: integration?.webhookUrl || '',
    autoSync: integration?.autoSync ?? true,
    errorNotifications: integration?.errorNotifications ?? true
  });
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (integration) {
      setFormData({
        name: integration.name,
        description: integration.description,
        icon: integration.icon,
        apiKey: integration.apiKey || '',
        webhookUrl: integration.webhookUrl || '',
        autoSync: integration.autoSync ?? true,
        errorNotifications: integration.errorNotifications ?? true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '🔗',
        apiKey: '',
        webhookUrl: '',
        autoSync: true,
        errorNotifications: true
      });
    }
  }, [integration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения интеграции:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {integration ? 'Редактировать интеграцию' : 'Добавить интеграцию'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-lg"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Например: Google Календарь"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              className="w-full p-2 border rounded-lg"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Описание интеграции и её назначения"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Иконка (эмодзи)
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="🔗"
              maxLength={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              className="w-full p-2 border rounded-lg"
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Введите API ключ"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              className="w-full p-2 border rounded-lg"
              value={formData.webhookUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
              placeholder="https://api.service.com/webhook"
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={formData.autoSync}
                onChange={(e) => setFormData(prev => ({ ...prev, autoSync: e.target.checked }))}
              />
              <span className="text-sm">Автоматическая синхронизация</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={formData.errorNotifications}
                onChange={(e) => setFormData(prev => ({ ...prev, errorNotifications: e.target.checked }))}
              />
              <span className="text-sm">Уведомления об ошибках</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isSaving ? <Spinner size="sm" /> : null}
              {integration ? 'Обновить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const IntegrationsPage: React.FC = () => {
  const { 
    integrations, 
    loading, 
    error, 
    createIntegration, 
    updateIntegration, 
    deleteIntegration,
    connectIntegration,
    disconnectIntegration,
    syncIntegration
  } = useIntegrations();
  
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleCreateIntegration = () => {
    setSelectedIntegration(null);
    setIsModalOpen(true);
  };

  const handleEditIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  const handleConfigIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsConfigModalOpen(true);
  };

  const handleSaveIntegration = async (data: CreateIntegrationDto | UpdateIntegrationDto) => {
    if (selectedIntegration) {
      await updateIntegration(selectedIntegration.id, data as UpdateIntegrationDto);
    } else {
      await createIntegration(data as CreateIntegrationDto);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteIntegration(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleConnect = async (id: string) => {
    try {
      await connectIntegration(id);
    } catch (error) {
      console.error('Ошибка подключения интеграции:', error);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await disconnectIntegration(id);
    } catch (error) {
      console.error('Ошибка отключения интеграции:', error);
    }
  };

  const handleSync = async (id: string) => {
    try {
      setSyncingId(id);
      await syncIntegration(id);
    } catch (error) {
      console.error('Ошибка синхронизации интеграции:', error);
    } finally {
      setSyncingId(null);
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
        <h1 className="text-2xl font-bold">Интеграции</h1>
        <button 
          onClick={handleCreateIntegration}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaPlus /> Добавить интеграцию
        </button>
      </div>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map(integration => (
          <div
            key={integration.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-3xl">{integration.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{integration.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                integration.status === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {integration.status === 'connected' ? 'Подключено' : 'Отключено'}
              </span>
            </div>
            
            {integration.lastSync && (
              <p className="text-xs text-gray-500 mb-4">
                Последняя синхронизация: {new Date(integration.lastSync).toLocaleString('ru-RU')}
              </p>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfigIntegration(integration)}
                  className="text-gray-500 hover:text-gray-600 p-1"
                  title="Настройки"
                >
                  <FaCog />
                </button>
                
                {integration.status === 'connected' && (
                  <button
                    onClick={() => handleSync(integration.id)}
                    disabled={syncingId === integration.id}
                    className="text-blue-500 hover:text-blue-600 p-1 disabled:opacity-50"
                    title="Синхронизировать"
                  >
                    {syncingId === integration.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <FaSync />
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteIntegration(integration.id)}
                  className={`p-1 ${
                    deleteConfirm === integration.id 
                      ? 'text-red-700 bg-red-100 rounded px-2' 
                      : 'text-red-500 hover:text-red-600'
                  }`}
                  title={deleteConfirm === integration.id ? 'Подтвердить удаление' : 'Удалить'}
                >
                  {deleteConfirm === integration.id ? (
                    <span className="text-xs">Подтвердить</span>
                  ) : (
                    <FaTimes />
                  )}
                </button>
              </div>
              
              <div className="flex gap-2">
                {integration.status === 'connected' ? (
                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <FaTimes size={12} />
                    Отключить
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(integration.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <FaCheck size={12} />
                    Подключить
                  </button>
                )}
                
                <button className="text-blue-500 hover:text-blue-600 p-1" title="Открыть документацию">
                  <FaExternalLinkAlt size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {integrations.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
            <FaPlug className="text-6xl mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Нет интеграций</h3>
            <p className="text-sm mb-4">Добавьте интеграции для подключения внешних сервисов</p>
            <button 
              onClick={handleCreateIntegration}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaPlus /> Добавить первую интеграцию
            </button>
          </div>
        )}
      </div>

      <IntegrationModal
        integration={selectedIntegration || undefined}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveIntegration}
      />

      {/* Config Modal - упрощенная версия для конфигурации */}
      {isConfigModalOpen && selectedIntegration && (
        <IntegrationModal
          integration={selectedIntegration}
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onSave={async (data) => {
            await updateIntegration(selectedIntegration.id, data as UpdateIntegrationDto);
            setIsConfigModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default IntegrationsPage;
