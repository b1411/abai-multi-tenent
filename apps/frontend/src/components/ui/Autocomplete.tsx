import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface AutocompleteOption {
  id: number | string;
  label: string;
  value: string | number;
}

interface AutocompleteProps {
  options?: AutocompleteOption[];
  value?: AutocompleteOption | null;
  onChange?: (option: AutocompleteOption | null) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  options = [],
  value,
  onChange,
  onSearch,
  placeholder = 'Поиск...',
  className = '',
  isLoading = false,
  disabled = false,
  error,
  label,
  helperText,
  required = false,
  inputRef
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const internalInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Используем переданный ref или внутренний
  const actualInputRef = inputRef || internalInputRef;

  // Синхронизация значения извне
  useEffect(() => {
    if (value) {
      setDisplayValue(value.label);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Обработка клика вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        actualInputRef.current &&
        !actualInputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        
        // Сброс поискового запроса и восстановление выбранного значения
        if (value) {
          setDisplayValue(value.label);
          setQuery('');
        } else {
          setDisplayValue('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value, actualInputRef]);

  // Обработка поиска
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setDisplayValue(newQuery);
    
    if (onSearch) {
      onSearch(newQuery);
    }
    
    if (!isOpen && newQuery) {
      setIsOpen(true);
    }
  };

  // Обработка выбора опции
  const handleOptionClick = (option: AutocompleteOption) => {
    if (onChange) {
      onChange(option);
    }
    setDisplayValue(option.label);
    setIsOpen(false);
    setQuery('');
  };

  // Обработка очистки
  const handleClear = () => {
    if (onChange) {
      onChange(null);
    }
    setDisplayValue('');
    setQuery('');
    actualInputRef.current?.focus();
  };

  // Определяем базовые классы для стилей
  const baseInputClasses = "w-full px-3 py-2 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0";
  const stateClasses = error
    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
  const paddingClasses = "pl-9 pr-8"; // Для иконок поиска и очистки

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={`autocomplete-${label}`} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          ref={actualInputRef}
          id={`autocomplete-${label}`}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`${baseInputClasses} ${stateClasses} ${paddingClasses}`}
          autoComplete="off"
        />
        
        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-sm overflow-auto focus:outline-none border border-gray-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-gray-500">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Загрузка...
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-2 text-gray-500">Ничего не найдено</div>
            ) : (
              options.map((option) => (
                <div
                  key={option.id}
                  className="cursor-pointer select-none relative px-4 py-2 hover:bg-blue-50 text-gray-900"
                  onClick={() => handleOptionClick(option)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};
