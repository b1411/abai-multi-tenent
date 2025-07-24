import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  autoFit?: boolean;
  minItemWidth?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'md',
  autoFit = false,
  minItemWidth = '280px',
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 lg:gap-6',
    lg: 'gap-4 sm:gap-6 lg:gap-8',
    xl: 'gap-6 sm:gap-8 lg:gap-10',
  };

  // Если используется autoFit, используем CSS Grid с repeat(auto-fit, minmax())
  if (autoFit) {
    return (
      <div 
        className={`grid ${gapClasses[gap]} ${className}`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
        }}
      >
        {children}
      </div>
    );
  }

  // Иначе используем Tailwind классы для адаптивных колонок
  const getGridColsClass = () => {
    const colsClasses = [];
    
    if (cols.default) colsClasses.push(`grid-cols-${cols.default}`);
    if (cols.sm) colsClasses.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) colsClasses.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) colsClasses.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) colsClasses.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) colsClasses.push(`2xl:grid-cols-${cols['2xl']}`);
    
    return colsClasses.join(' ');
  };

  return (
    <div className={`grid ${getGridColsClass()} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
