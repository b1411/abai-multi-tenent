import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  variant = 'default',
  showPasswordToggle = false,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  const baseClasses = "w-full px-3 py-2 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0";
  
  const variantClasses = {
    default: `border-gray-300 focus:border-[#ca181f] focus:ring-[#ca181f]/20 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`,
    filled: `border-transparent bg-gray-50 focus:bg-white focus:border-[#ca181f] focus:ring-[#ca181f]/20 ${error ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`,
    outlined: `border-2 border-gray-300 focus:border-[#ca181f] focus:ring-[#ca181f]/20 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`
  };

  const inputClasses = `${baseClasses} ${variantClasses[variant]} ${icon ? 'pl-10' : ''} ${showPasswordToggle ? 'pr-10' : ''} ${className}`;

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">
              {icon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          {...props}
        />
        
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </motion.div>
  );
});

Input.displayName = 'Input';
