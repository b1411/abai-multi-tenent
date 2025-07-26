import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';

interface ToastContextType {
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
