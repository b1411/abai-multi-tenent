import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import TeacherDashboard from '../components/dashboards/TeacherDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import ParentDashboard from '../components/dashboards/ParentDashboard';
import FinancistDashboard from '../components/dashboards/FinancistDashboard';
import HRDashboard from '../components/dashboards/HRDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'STUDENT':
        return <StudentDashboard />;
      case 'TEACHER':
        return <TeacherDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      case 'PARENT':
        return <ParentDashboard />;
      case 'FINANCIST':
        return <FinancistDashboard />;
      case 'HR':
        return <HRDashboard />;
      default:
        return (
          <div className="p-3 md:p-6">
            <div className="mb-4 md:mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Добро пожаловать, {user?.name} {user?.surname}
              </h1>
              <p className="text-sm md:text-base text-gray-600">Роль: {user?.role}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Дэшборд не настроен</h2>
              <p className="text-sm md:text-base text-gray-600">Дэшборд для вашей роли еще не настроен. Обратитесь к администратору.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-3 md:p-6">
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
