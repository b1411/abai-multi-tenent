import { useState, useEffect } from 'react';
import { parentService, Student, ChatSetupResult } from '../services/parentService';

export const useParent = () => {
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMyChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parentService.getMyChildren();
      setChildren(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при получении детей');
      console.error('Error fetching children:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupMyChats = async (): Promise<ChatSetupResult[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await parentService.setupMyChats();
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при настройке чатов');
      console.error('Error setting up chats:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshMyChats = async (): Promise<ChatSetupResult[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await parentService.refreshMyChats();
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при обновлении чатов');
      console.error('Error refreshing chats:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMyChildren();
  }, []);

  return {
    children,
    loading,
    error,
    getMyChildren,
    setupMyChats,
    refreshMyChats,
  };
};
