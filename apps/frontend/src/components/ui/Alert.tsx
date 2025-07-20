import React, { ReactNode } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    message?: string;
    className?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
    icon?: boolean;
    children?: ReactNode; // Явно указываем, что children поддерживаются
}

export const Alert: React.FC<AlertProps> = ({
    variant = 'info',
    title,
    className = '',
    dismissible = false,
    onDismiss,
    icon = true,
    children,
    message
}) => {
    // Стили для разных вариантов уведомлений
    const variantClasses = {
        info: {
            container: 'bg-blue-50 border-blue-300 text-blue-800',
            icon: 'text-blue-500',
            title: 'text-blue-800',
            closeButton: 'text-blue-500 hover:bg-blue-100'
        },
        success: {
            container: 'bg-green-50 border-green-300 text-green-800',
            icon: 'text-green-500',
            title: 'text-green-800',
            closeButton: 'text-green-500 hover:bg-green-100'
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-300 text-yellow-800',
            icon: 'text-yellow-500',
            title: 'text-yellow-800',
            closeButton: 'text-yellow-500 hover:bg-yellow-100'
        },
        error: {
            container: 'bg-red-50 border-red-300 text-red-800',
            icon: 'text-red-500',
            title: 'text-red-800',
            closeButton: 'text-red-500 hover:bg-red-100'
        }
    };

    // Иконки для разных вариантов уведомлений
    const variantIcons = {
        info: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
        success: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
        warning: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
        ),
        error: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        )
    };

    return (
        <div
            className={`border-l-4 p-4 rounded-r-md ${variantClasses[variant].container} ${className} animate-fadeIn`}
            role="alert"
        >
            <div className="flex items-start">
                {icon && (
                    <div className={`flex-shrink-0 mr-3 mt-0.5 ${variantClasses[variant].icon}`}>
                        {variantIcons[variant]}
                    </div>
                )}
                <div className="flex-1">
                    {title && (
                        <h3 className={`text-sm font-medium ${variantClasses[variant].title} mb-1`}>
                            {title}
                        </h3>
                    )}
                    <div className="text-sm">{children ?? message}</div>
                </div>
                {dismissible && (
                    <div className="ml-auto pl-3">
                        <button
                            type="button"
                            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses[variant].closeButton}`}
                            onClick={onDismiss}
                            aria-label="Закрыть"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Вспомогательные компоненты для удобства использования

export const InfoAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => {
    return <Alert variant="info" {...props} />;
};

export const SuccessAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => {
    return <Alert variant="success" {...props} />;
};

export const WarningAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => {
    return <Alert variant="warning" {...props} />;
};

export const ErrorAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => {
    return <Alert variant="error" {...props} />;
};
