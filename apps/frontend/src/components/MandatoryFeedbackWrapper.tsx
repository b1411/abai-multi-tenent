import React from 'react';
import MandatoryFeedbackModal from './MandatoryFeedbackModal';
import { useMandatoryFeedback } from '../hooks/useMandatoryFeedback';

interface MandatoryFeedbackWrapperProps {
  children: React.ReactNode;
}

const MandatoryFeedbackWrapper: React.FC<MandatoryFeedbackWrapperProps> = ({ children }) => {
  const { status, showModal, handleFeedbackComplete } = useMandatoryFeedback();

  return (
    <>
      {children}
      
      {/* Обязательная модальная форма */}
      <MandatoryFeedbackModal
        isOpen={showModal}
        templates={status?.pendingTemplates || []}
        onComplete={handleFeedbackComplete}
      />
    </>
  );
};

export default MandatoryFeedbackWrapper;
