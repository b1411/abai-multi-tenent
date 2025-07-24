import { useState, useEffect, useCallback } from 'react';
import { systemService } from '../services/systemService';
import {
  SystemSettings,
  User,
  Role,
  BrandingSettings,
  Integration,
  CreateUserDto,
  UpdateUserDto,
  CreateRoleDto,
  UpdateRoleDto,
  CreateIntegrationDto,
  UpdateIntegrationDto
} from '../types/system';

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await systemService.getSystemSettings();
      setSettings(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      setLoading(true);
      const response = await systemService.updateSystemSettings(newSettings);
      setSettings(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления настроек');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async () => {
    try {
      const blob = await systemService.downloadBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка скачивания резервной копии');
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    downloadBackup,
    refetch: fetchSettings
  };
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (params?: { search?: string; role?: string; status?: string }) => {
    try {
      setLoading(true);
      const response = await systemService.getUsers(params);
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (data: CreateUserDto) => {
    try {
      const response = await systemService.createUser(data);
      setUsers(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания пользователя');
      throw err;
    }
  };

  const updateUser = async (id: string, data: UpdateUserDto) => {
    try {
      const response = await systemService.updateUser(id, data);
      setUsers(prev => prev.map(user => user.id === id ? response.data : user));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления пользователя');
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await systemService.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления пользователя');
      throw err;
    }
  };

  const resetPassword = async (id: string) => {
    try {
      const response = await systemService.resetUserPassword(id);
      return response.data.password;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сброса пароля');
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    refetch: fetchUsers
  };
};

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<{ module: string; permissions: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        systemService.getRoles(),
        systemService.getAvailablePermissions()
      ]);
      setRoles(rolesResponse.data);
      setPermissions(permissionsResponse.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки ролей');
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (data: CreateRoleDto) => {
    try {
      const response = await systemService.createRole(data);
      setRoles(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания роли');
      throw err;
    }
  };

  const updateRole = async (id: string, data: UpdateRoleDto) => {
    try {
      const response = await systemService.updateRole(id, data);
      setRoles(prev => prev.map(role => role.id === id ? response.data : role));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления роли');
      throw err;
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await systemService.deleteRole(id);
      setRoles(prev => prev.filter(role => role.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления роли');
      throw err;
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    permissions,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refetch: fetchRoles
  };
};

export const useBranding = () => {
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await systemService.getBrandingSettings();
      setSettings(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки настроек брендинга');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<BrandingSettings>) => {
    try {
      setLoading(true);
      const response = await systemService.updateBrandingSettings(newSettings);
      setSettings(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления настроек брендинга');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      const response = await systemService.uploadLogo(file);
      if (settings) {
        setSettings({ ...settings, logo: response.data.url });
      }
      return response.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки логотипа');
      throw err;
    }
  };

  const uploadFavicon = async (file: File) => {
    try {
      const response = await systemService.uploadFavicon(file);
      if (settings) {
        setSettings({ ...settings, favicon: response.data.url });
      }
      return response.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки favicon');
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    uploadLogo,
    uploadFavicon,
    refetch: fetchSettings
  };
};

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await systemService.getIntegrations();
      setIntegrations(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки интеграций');
    } finally {
      setLoading(false);
    }
  };

  const createIntegration = async (data: CreateIntegrationDto) => {
    try {
      const response = await systemService.createIntegration(data);
      setIntegrations(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания интеграции');
      throw err;
    }
  };

  const updateIntegration = async (id: string, data: UpdateIntegrationDto) => {
    try {
      const response = await systemService.updateIntegration(id, data);
      setIntegrations(prev => prev.map(integration => 
        integration.id === id ? response.data : integration
      ));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления интеграции');
      throw err;
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      await systemService.deleteIntegration(id);
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления интеграции');
      throw err;
    }
  };

  const connectIntegration = async (id: string) => {
    try {
      const response = await systemService.connectIntegration(id);
      setIntegrations(prev => prev.map(integration => 
        integration.id === id ? response.data : integration
      ));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения интеграции');
      throw err;
    }
  };

  const disconnectIntegration = async (id: string) => {
    try {
      const response = await systemService.disconnectIntegration(id);
      setIntegrations(prev => prev.map(integration => 
        integration.id === id ? response.data : integration
      ));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отключения интеграции');
      throw err;
    }
  };

  const syncIntegration = async (id: string) => {
    try {
      await systemService.syncIntegration(id);
      // Обновляем время последней синхронизации
      setIntegrations(prev => prev.map(integration => 
        integration.id === id 
          ? { ...integration, lastSync: new Date().toISOString() }
          : integration
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка синхронизации интеграции');
      throw err;
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  return {
    integrations,
    loading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    refetch: fetchIntegrations
  };
};
