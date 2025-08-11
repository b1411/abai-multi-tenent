import { ToastContext } from "../contexts/ToastContext";
import React, { ReactNode, useEffect } from 'react';
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ui/ToastContainer";
import { ToastType } from "../components/ui/Toast";

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const toast = useToast();

    // Listen for global toast events emitted from non-React code (e.g., apiClient)
    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{ type: ToastType; message: string; duration?: number }>;
            const detail = (ce as any)?.detail || {};
            const { type, message, duration } = detail;
            if (!type || !message) return;

            switch (type) {
                case 'success':
                    toast.success(message, duration);
                    break;
                case 'warning':
                    toast.warning(message, duration);
                    break;
                case 'info':
                    toast.info(message, duration);
                    break;
                default:
                    toast.error(message, duration);
            }
        };

        window.addEventListener('app:toast', handler as EventListener);
        return () => window.removeEventListener('app:toast', handler as EventListener);
    }, [toast]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
        </ToastContext.Provider>
    );
};
