import React from 'react';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  onClick,
  hover = true,
  padding = 'md',
  shadow = 'md',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-3',
    md: 'p-3 sm:p-4',
    lg: 'p-4 sm:p-6',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const baseClasses = `
    bg-white rounded-lg border border-gray-200 
    ${shadowClasses[shadow]}
    ${paddingClasses[padding]}
    ${onClick ? 'cursor-pointer' : ''}
    ${hover && onClick ? 'hover:shadow-lg hover:border-blue-200 transition-all duration-200' : ''}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default ResponsiveCard;
