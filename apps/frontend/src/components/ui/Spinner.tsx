import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  children?: never; // Явно указываем, что children не используются
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className = '',
}) => {
  // Задаем размеры в зависимости от пропса size
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Задаем цвета в зависимости от пропса color
  const colorClasses = {
    primary: 'text-indigo-600',
    secondary: 'text-purple-600',
    white: 'text-white',
    gray: 'text-gray-600'
  };

  return (
    <div className={`inline-flex ${className}`}>
      <svg 
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Вариант использования с текстом
interface SpinnerWithTextProps extends Omit<SpinnerProps, 'children'> {
  text: string;
  children?: never; // Явно запрещаем children
}

export const SpinnerWithText: React.FC<SpinnerWithTextProps> = ({ 
  text,
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <Spinner size={size} color={color} />
      <span className="font-medium">{text}</span>
    </div>
  );
};
