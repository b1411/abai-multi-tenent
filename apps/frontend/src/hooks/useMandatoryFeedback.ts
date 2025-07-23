import { useState, useEffect } from 'react';
import { feedbackService, MandatoryFeedbackStatus, FeedbackTemplate } from '../services/feedbackService';

export const useMandatoryFeedback = () => {
  const [status, setStatus] = useState<MandatoryFeedbackStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const checkMandatoryFeedback = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await feedbackService.checkMandatoryFeedback();
      setStatus(result);
      
      // Показываем модальное окно, если есть незаполненные формы
      if (!result.hasCompletedMandatory && result.pendingTemplates.length > 0) {
        setShowModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при проверке обязательных форм');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackComplete = () => {
    setShowModal(false);
    setStatus(prev => prev ? { ...prev, hasCompletedMandatory: true, pendingTemplates: [] } : null);
  };

  useEffect(() => {
    // Проверяем при загрузке компонента
    checkMandatoryFeedback();
  }, []);

  return {
    status,
    loading,
    error,
    showModal,
    checkMandatoryFeedback,
    handleFeedbackComplete,
    setShowModal,
  };
};
