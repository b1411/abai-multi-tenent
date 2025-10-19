import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types/api';

type Role = User['role'];

const RouteRoleGuard: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  const rules: { pattern: RegExp; roles: Role[] }[] = [
    { pattern: /^\/$/, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST'] },
    { pattern: /^\/news$/, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST'] },

    // Учебный процесс
    { pattern: /^\/study-plans$/, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
    { pattern: /^\/lessons(\/|$)/, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { pattern: /^\/homework(\/|$)/, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { pattern: /^\/academic\/academic-journal$/, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { pattern: /^\/academic\/schedule$/, roles: ['ADMIN', 'TEACHER'] },
    { pattern: /^\/academic\/classrooms$/, roles: ['ADMIN', 'TEACHER'] },
    { pattern: /^\/classrooms$/, roles: ['ADMIN', 'TEACHER'] },
    { pattern: /^\/educational-reports$/, roles: ['ADMIN', 'TEACHER'] },

    // Студенты
    { pattern: /^\/students(\/|$)/, roles: ['ADMIN', 'TEACHER', 'HR'] },
    { pattern: /^\/my-children$/, roles: ['PARENT'] },
    { pattern: /^\/groups(\/|$)/, roles: ['ADMIN', 'TEACHER', 'HR', 'PARENT'] },
    { pattern: /^\/performance$/, roles: ['ADMIN', 'TEACHER', 'HR', 'STUDENT', 'PARENT'] },

    // Alumni и JAS.LIFE
    { pattern: /^\/alumni(\/|$)/, roles: ['ADMIN', 'TEACHER', 'HR'] },
    { pattern: /^\/jas-life$/, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST'] },

    // HR
    { pattern: /^\/hr\/employees$/, roles: ['ADMIN', 'HR'] },
    { pattern: /^\/hr\/workload$/, roles: ['ADMIN', 'HR'] },
    { pattern: /^\/hr\/kpi$/, roles: ['ADMIN', 'HR'] },
    { pattern: /^\/hr\/vacation$/, roles: ['ADMIN', 'HR', 'TEACHER', 'FINANCIST'] },
    { pattern: /^\/hr\/fake-positions$/, roles: ['ADMIN', 'HR'] },
    { pattern: /^\/hr\/staff-composition$/, roles: ['ADMIN', 'HR'] },

    // Финансы
    { pattern: /^\/finance\/payments$/, roles: ['ADMIN', 'FINANCIST', 'PARENT'] },
    { pattern: /^\/finance\/reports$/, roles: ['ADMIN', 'FINANCIST'] },
    { pattern: /^\/finance\/budget$/, roles: ['ADMIN', 'FINANCIST'] },
    { pattern: /^\/finance\/acl$/, roles: ['ADMIN', 'FINANCIST'] },
    { pattern: /^\/finance\/payroll$/, roles: ['ADMIN', 'FINANCIST'] },
    { pattern: /^\/finance\/salaries$/, roles: ['ADMIN', 'FINANCIST'] },

    // Приложение
    { pattern: /^\/app\/chat$/, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', "FINANCIST", "HR"] },
    { pattern: /^\/app\/admin-chats$/, roles: ['ADMIN'] },
    { pattern: /^\/app\/ai-chat$/, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { pattern: /^\/app\/calendar$/, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', "FINANCIST", "HR"] },
    { pattern: /^\/app\/tasks$/, roles: ['ADMIN', 'TEACHER', "FINANCIST", "HR"] },
    { pattern: /^\/app\/neuro-abai$/, roles: ['ADMIN', 'TEACHER', "FINANCIST", "HR"] },

    // ERP
    { pattern: /^\/app\/erp(\/|$)/, roles: ['ADMIN', 'HR'] },

    // ЭДО
    { pattern: /^\/edo(\/|$)/, roles: ['ADMIN', 'HR', 'TEACHER'] },

    // Настройки
    { pattern: /^\/settings(\/|$)/, roles: ['ADMIN'] },
  ];

  const matched = rules.find(r => r.pattern.test(pathname));

  if (matched && !hasAnyRole(matched.roles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RouteRoleGuard;
