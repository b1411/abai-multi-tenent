import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddWidgetButtonProps {
  onClick: () => void;
  className?: string;
}

const AddWidgetButton: React.FC<AddWidgetButtonProps> = ({ 
  onClick, 
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        flex items-center space-x-2 px-4 py-2 
        bg-blue-600 hover:bg-blue-700 
        text-white font-medium rounded-lg 
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isHovered ? 'shadow-lg transform scale-105' : 'shadow-md'}
        ${className}
      `}
      aria-label="Добавить виджет"
    >
      <Plus 
        className={`h-5 w-5 transition-transform duration-200 ${
          isHovered ? 'rotate-90' : ''
        }`} 
      />
      <span className="hidden sm:inline">Добавить виджет</span>
      <span className="sm:hidden">Виджет</span>
    </button>
  );
};

export default AddWidgetButton;
