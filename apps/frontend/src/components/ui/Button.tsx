import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = ''
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-[#ca181f] text-white hover:bg-[#ca181f]/90 focus:ring-[#ca181f] disabled:bg-gray-300",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 disabled:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 disabled:bg-red-300",
    success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 disabled:bg-green-300",
    outline: "border border-[#ca181f] text-[#ca181f] hover:bg-[#ca181f]/10 focus:ring-[#ca181f] disabled:border-gray-300 disabled:text-gray-300"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-h-[40px] sm:min-h-[36px]",
    md: "px-4 py-3 text-base min-h-[48px] sm:min-h-[40px] sm:text-sm",
    lg: "px-6 py-4 text-lg min-h-[52px] sm:min-h-[44px] sm:text-base"
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </motion.button>
  );
};
