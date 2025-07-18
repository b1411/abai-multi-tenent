import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AcademicJournalPage from './pages/AcademicJournalPage';
import SchedulePage from './pages/SchedulePage';
import ClassroomsPage from './pages/ClassroomsPage';
import BookingRequestsPage from './pages/BookingRequestsPage';
import StudyPlansPage from './pages/StudyPlansPage';
import StudyPlanDetailPage from './pages/StudyPlanDetailPage';
import LessonDetailPage from './pages/LessonDetailPage';
import { LanguageProvider } from './providers/LanguageProvider';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import LessonsManagePage from './pages/LessonsManagePage';
import LessonMaterialsPage from './pages/LessonMaterialsPage';
import QuizStatisticsPage from './pages/QuizStatisticsPage';
import ChatPage from './pages/app/ChatPage';
import AIChatPage from './pages/app/AIChatPage';
import CalendarPage from './pages/app/CalendarPage';
import TodoPage from './pages/app/TodoPage';
import NeuroAbaiPage from './pages/app/NeuroAbaiPage';
import ProfilePage from './pages/app/ProfilePage';
import PerformancePage from './pages/PerformancePage';
import EmployeesPage from './pages/hr/EmployeesPage';
import WorkloadPage from './pages/hr/WorkloadPage';
import KpiPage from './pages/hr/KpiPage';
import VacationPage from './pages/hr/VacationPage';
import FakePositionsPage from './pages/hr/FakePositionsPage';
import PaymentsPage from './pages/finance/PaymentsPage';
import ReportsPage from './pages/finance/ReportsPage';
import BudgetPage from './pages/finance/BudgetPage';
import PayrollPage from './pages/finance/PayrollPage';
import SalariesPage from './pages/finance/SalariesPage';
import AntiFraudPage from './pages/finance/AntiFraudPage';
import ACLPage from './pages/finance/ACLPage';
import Login from './pages/Login';
import { AuthProvider } from './providers/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import TestRealtimeApi from './pages/TestRealtimeApi';

import InventoryPage from './pages/erp/InventoryPage';
import SupplyPage from './pages/erp/SupplyPage';
import UsersPage from './pages/settings/UsersPage';
import PermissionsPage from './pages/settings/PermissionsPage';
import IntegrationsPage from './pages/settings/IntegrationsPage';
import BrandingPage from './pages/settings/BrandingPage';
import SystemPage from './pages/settings/SystemPage';
import HomeworkPage from './pages/HomeworkPage';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              
              {/* Academic routes */}
              <Route path="academic/academic-journal" element={<AcademicJournalPage />} />
              <Route path="academic/schedule" element={<SchedulePage />} />
              <Route path="academic/classrooms" element={<ClassroomsPage />} />
              <Route path="academic/requests" element={<BookingRequestsPage />} />
              <Route path="academic/requests/new" element={<BookingRequestsPage />} />
              <Route path="academic/study-plans" element={<StudyPlansPage />} />
              <Route path="academic/study-plans/:id" element={<StudyPlanDetailPage />} />
              <Route path="academic/study-plans/:id/lessons/:lessonId" element={<LessonDetailPage />} />
              <Route path="academic/homework" element={<HomeworkPage />} />

              {/* Students routes */}
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:id" element={<StudentDetailPage />} />
              <Route path="performance" element={<PerformancePage />} />

              {/* Applications routes */}
              <Route path="app/chat" element={<ChatPage />} />
              <Route path="app/ai-chat" element={<AIChatPage />} />
              <Route path="app/calendar" element={<CalendarPage />} />
              <Route path="app/tasks" element={<TodoPage />} />
              <Route path="app/profile" element={<ProfilePage />} />
              <Route path="app/erp/inventory" element={<InventoryPage />} />
              <Route path="app/erp/supply" element={<SupplyPage />} />
              <Route path="app/neuro-abai" element={<NeuroAbaiPage />} />

              {/* HR routes */}
              <Route path="hr/employees" element={<EmployeesPage />} />
              <Route path="hr/workload" element={<WorkloadPage />} />
              <Route path="hr/kpi" element={<KpiPage />} />
              <Route path="hr/vacation" element={<VacationPage />} />
              <Route path="hr/fake-positions" element={<FakePositionsPage />} />

              {/* Finance routes */}
              <Route path="finance/payments" element={<PaymentsPage />} />
              <Route path="finance/reports" element={<ReportsPage />} />
              <Route path="finance/budget" element={<BudgetPage />} />
              <Route path="finance/acl" element={<ACLPage />} />
              <Route path="finance/payroll" element={<PayrollPage />} />
              <Route path="finance/salaries" element={<SalariesPage />} />
              <Route path="finance/antifraud" element={<AntiFraudPage />} />

              {/* Settings routes */}
              <Route path="settings/users" element={<UsersPage />} />
              <Route path="settings/permissions" element={<PermissionsPage />} />
              <Route path="settings/integrations" element={<IntegrationsPage />} />
              <Route path="settings/branding" element={<BrandingPage />} />
              <Route path="settings/system" element={<SystemPage />} />

              {/* Study Plans routes */}
              <Route path="study-plans" element={<StudyPlansPage />} />
              <Route path="study-plans/:id" element={<StudyPlanDetailPage />} />
              <Route path="study-plans/:studyPlanId/lessons" element={<LessonsManagePage />} />
              <Route path="study-plans/:id/lessons/:lessonId" element={<LessonDetailPage />} />
              
              {/* Lessons routes */}
              <Route path="lessons/:lessonId/materials" element={<LessonMaterialsPage />} />
              
              {/* Quiz routes */}
              <Route path="quiz/:quizId/statistics" element={<QuizStatisticsPage />} />

              <Route path='/test/realtime-api' element={<TestRealtimeApi />} />
            </Route>
            
            {/* Добавляем отдельный маршрут для /dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </LanguageProvider>
  );
};

export default App;
