import React from 'react';
import MandatoryFeedbackModal from './MandatoryFeedbackModal';
import { useMandatoryFeedback } from '../hooks/useMandatoryFeedback';

interface MandatoryFeedbackWrapperProps {
  children: React.ReactNode;
}

const MandatoryFeedbackWrapper: React.FC<MandatoryFeedbackWrapperProps> = ({ children }) => {
  const { status, showModal, handleFeedbackComplete } = useMandatoryFeedback();

  // Клиентская страховочная фильтрация (если бэкенд вернул все 255)
  const filteredTemplates = React.useMemo(() => {
    const list = status?.pendingTemplates || [];
    if (list.length <= 1) return list;

    let studentId: number | undefined;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      studentId = user?.studentData?.id;
    } catch { /* ignore */ }

    return list.filter(t => {
      if (!t.name) return true;
      if (!t.name.startsWith('teacher_evaluation_student_')) return true;
      if (!studentId) return false;
      return t.name === `teacher_evaluation_student_${studentId}`;
    });
  }, [status?.pendingTemplates]);

  return (
    <>
      {children}
      
      {/* Обязательная модальная форма */}
      <MandatoryFeedbackModal
        isOpen={showModal}
        templates={filteredTemplates}
        onComplete={handleFeedbackComplete}
      />
    </>
  );
};

export default MandatoryFeedbackWrapper;
