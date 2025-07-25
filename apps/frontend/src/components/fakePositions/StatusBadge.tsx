import React from 'react';
import { FaCheck, FaExclamationTriangle, FaTimes, FaClock } from 'react-icons/fa';

interface StatusBadgeProps {
  status: 'confirmed' | 'mismatch' | 'absent';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showIcon = true 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          text: 'Подтверждено',
          icon: FaCheck,
          classes: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'mismatch':
        return {
          text: 'Несовпадение',
          icon: FaExclamationTriangle,
          classes: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'absent':
        return {
          text: 'Неявка',
          icon: FaTimes,
          classes: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          text: 'Неизвестно',
          icon: FaClock,
          classes: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full font-medium border
      ${config.classes} ${getSizeClasses()}
    `}>
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.text}</span>
    </span>
  );
};

export default StatusBadge;
