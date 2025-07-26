import { ToastContext } from "../contexts/ToastContext";
import React, { ReactNode } from 'react';
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ui/ToastContainer";

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const toast = useToast();

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
        </ToastContext.Provider>
    );
};
