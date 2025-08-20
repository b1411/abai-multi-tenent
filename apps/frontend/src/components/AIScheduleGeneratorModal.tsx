import React from 'react';
import AIScheduleFlowModal from './AIScheduleFlowModal';

export interface AIScheduleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (result: { success: boolean; count: number }) => void;
}

const AIScheduleGeneratorModal: React.FC<AIScheduleGeneratorModalProps> = ({ isOpen, onClose, onGenerate }) => (
  <AIScheduleFlowModal
    isOpen={isOpen}
    onClose={onClose}
    onApplied={(r) => onGenerate({ success: !!r?.success, count: r?.count ?? 0 })}
  />
);

export default AIScheduleGeneratorModal;
