import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { User } from '../api/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: User['role'][];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, hasAnyRole, isLoading } = useAuth();
  const location = useLocation();

  // Показываем загрузчик пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ca181f]"></div>
      </div>
    );
  }

  // Если не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Если указаны требуемые роли и у пользователя их нет
  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-4">
            У вас нет прав для доступа к этой странице.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-[#ca181f] text-white rounded-lg hover:bg-[#ca181f]/90"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
