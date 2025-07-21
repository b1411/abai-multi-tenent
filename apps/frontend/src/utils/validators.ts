/**
 * Утилиты для валидации данных
 */

// Валидация email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Валидация пароля
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну заглавную букву');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну строчную букву');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну цифру');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Валидация телефона (казахстанский формат)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+?7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
  return phoneRegex.test(phone);
};

// Валидация обязательного поля
export const validateRequired = (value: string | number | boolean): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  if (typeof value === 'boolean') {
    return true;
  }
  return false;
};

// Валидация минимальной длины
export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

// Валидация максимальной длины
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

// Валидация числа
export const validateNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num);
};

// Валидация положительного числа
export const validatePositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return validateNumber(num) && num > 0;
};

// Валидация даты
export const validateDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
};

// Валидация диапазона дат
export const validateDateRange = (startDate: string | Date, endDate: string | Date): boolean => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return validateDate(start) && validateDate(end) && start <= end;
};

// Валидация URL
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Валидация файла
export const validateFile = (file: File, options: {
  maxSize?: number; // в байтах
  allowedTypes?: string[]; // MIME типы
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (options.maxSize && file.size > options.maxSize) {
    errors.push(`Размер файла не должен превышать ${options.maxSize / 1024 / 1024}MB`);
  }
  
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(`Разрешенные типы файлов: ${options.allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Валидация ИИН (Индивидуальный идентификационный номер Казахстана)
export const validateIIN = (iin: string): boolean => {
  if (iin.length !== 12) return false;
  
  const digits = iin.split('').map(Number);
  
  // Проверка контрольной суммы
  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const weights2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
  
  let sum1 = 0;
  for (let i = 0; i < 11; i++) {
    sum1 += digits[i] * weights1[i];
  }
  
  let controlDigit = sum1 % 11;
  
  if (controlDigit === 10) {
    let sum2 = 0;
    for (let i = 0; i < 11; i++) {
      sum2 += digits[i] * weights2[i];
    }
    controlDigit = sum2 % 11;
  }
  
  return controlDigit === digits[11];
};

// Общая функция валидации формы
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, Array<(value: any) => boolean | string>>
): { isValid: boolean; errors: Partial<Record<keyof T, string[]>> } => {
  const errors: Partial<Record<keyof T, string[]>> = {};
  
  for (const [field, validators] of Object.entries(rules)) {
    const fieldErrors: string[] = [];
    const value = data[field];
    
    for (const validator of validators) {
      const result = validator(value);
      if (typeof result === 'string') {
        fieldErrors.push(result);
      } else if (result === false) {
        fieldErrors.push('Неверное значение');
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field as keyof T] = fieldErrors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
