import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { ActivityProvider } from './providers/ActivityProvider';
import { BrandingProvider } from './providers/BrandingProvider';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudyPlansPage from './pages/StudyPlans';
import LessonsPage from './pages/Lessons';
import LessonDetailPage from './pages/LessonDetail';
import LessonMaterialsPage from './pages/LessonMaterials';
import HomeworkPage from './pages/Homework';
import HomeworkSubmissionsPage from './pages/HomeworkSubmissions';
import SchedulePage from './pages/Schedule';
import AcademicJournal from './pages/AcademicJournal';
import StudentsPage from './pages/Students';
import StudentDetailPage from './pages/StudentDetail';
import GroupsPage from './pages/Groups';
import AiChatPage from './pages/AiChat';
import NeuroAbaiPage from './pages/NeuroAbai';
import ClassroomsPage from './pages/Classrooms';
import PaymentsPage from './pages/Payments';
import BudgetPage from './pages/Budget';
import ReportsPage from './pages/Reports';
import TeachersPage from './pages/Teachers';
import WorkloadPage from './pages/Workload';
import PerformancePage from './pages/Performance';
import KPIPage from './pages/KPI';
import VacationsPage from './pages/Vacations';
import SubstitutionsPage from './pages/Substitutions';
import SalariesPage from './pages/Salaries';
import LoyaltyPage from './pages/Loyalty';
import FeedbackAdmin from './pages/FeedbackAdmin';
import MandatoryFeedbackWrapper from './components/MandatoryFeedbackWrapper';
import { ToastProvider } from './providers/ToastProvider';
import Inventory from './pages/Inventory';
import InventoryAnalytics from './pages/InventoryAnalytics';
import Supply from './pages/Supply';
import TasksPage from './pages/Tasks';
import ChatPage from './pages/Chat';
import CalendarPage from './pages/Calendar';
import SystemSettingsPage from './pages/SystemSettings';
import UsersPage from './pages/Users';
import PermissionsPage from './pages/Permissions';
import RoleManagement from './pages/RoleManagement';
import BrandingPage from './pages/Branding';
import IntegrationsPage from './pages/Integrations';
import { ActivityMonitoring } from './pages/ActivityMonitoring';
import EdoPage from './pages/EDO';
import DocumentCreatePage from './pages/DocumentCreate';
import DocumentDetailPage from './pages/DocumentDetail';
import FakePositions from './pages/FakePositions';
import News from './pages/News';
import Security from './pages/Security';
import AlumniList from './alumni/pages/AlumniList';
import AlumniDetail from './alumni/pages/AlumniDetail';
import JasLife from './pages/JasLife';
import EducationalReports from './pages/EducationalReports';

const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <ActivityProvider>
            <NotificationProvider>
              <BrandingProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <MandatoryFeedbackWrapper>
                          <DashboardLayout />
                        </MandatoryFeedbackWrapper>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />

                    {/* News route */}
                    <Route path="news" element={<News />} />

                    {/* Study Plans routes */}
                    <Route path="study-plans" element={<StudyPlansPage />} />

                    {/* Lessons routes */}
                    <Route path="lessons" element={<LessonsPage />} />
                    <Route path="lessons/:id" element={<LessonDetailPage />} />
                    <Route path="lessons/:id/materials" element={<LessonMaterialsPage />} />

                    {/* Homework routes */}
                    <Route path="homework" element={<HomeworkPage />} />
                    <Route path="homework/:id" element={<div>Homework Detail Page</div>} />
                    <Route path="homework/:id/submissions" element={<HomeworkSubmissionsPage />} />

                    {/* Schedule routes */}
                    <Route path="schedule" element={<SchedulePage />} />

                    {/* Academic routes */}
                    <Route path="academic">
                      <Route path="academic-journal" element={<AcademicJournal />} />
                      <Route path="schedule" element={<SchedulePage />} />
                      <Route path="classrooms" element={<ClassroomsPage />} />
                      <Route path="requests" element={<div>Booking Requests Page</div>} />
                      <Route path="requests/new" element={<div>New Booking Request Page</div>} />
                      <Route path="homework" element={<div>Homework Page</div>} />
                    </Route>

                    {/* Standalone classrooms route */}
                    <Route path="classrooms" element={<ClassroomsPage />} />

                    {/* Educational Reports route */}
                    <Route path="educational-reports" element={<EducationalReports />} />

                    {/* Students routes */}
                    <Route path="students" element={<StudentsPage />} />
                    <Route path="students/:id" element={<StudentDetailPage />} />
                    <Route path="groups" element={<GroupsPage />} />
                    <Route path="performance" element={<PerformancePage />} />
                    <Route path="loyalty" element={<LoyaltyPage />} />

                    {/* Alumni routes */}
                    <Route path="alumni" element={<AlumniList />} />
                    <Route path="alumni/:id" element={<AlumniDetail />} />

                    {/* JAS.LIFE route */}
                    <Route path="jas-life" element={<JasLife />} />

                    {/* Quiz routes */}
                    <Route path="quiz/:quizId/statistics" element={<div>Quiz Statistics Page</div>} />

                    {/* HR routes */}
                    <Route path="hr">
                      <Route path="employees" element={<TeachersPage />} />
                      <Route path="workload" element={<WorkloadPage />} />
                      <Route path="kpi" element={<KPIPage />} />
                      <Route path="vacation" element={<VacationsPage />} />
                      <Route path="substitutions" element={<SubstitutionsPage />} />
                      <Route path="fake-positions" element={<FakePositions />} />
                    </Route>

                    {/* Finance routes */}
                    <Route path="finance">
                      <Route path="payments" element={<PaymentsPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="budget" element={<BudgetPage />} />
                      <Route path="acl" element={<LoyaltyPage />} />
                      <Route path="payroll" element={<SalariesPage />} />
                      <Route path="salaries" element={<SalariesPage />} />
                      <Route path="antifraud" element={<div>Anti-Fraud Page</div>} />
                    </Route>

                    {/* Applications routes */}
                    <Route path="app">
                      <Route path="chat" element={<ChatPage />} />
                      <Route path="ai-chat" element={<AiChatPage />} />
                      <Route path="calendar" element={<CalendarPage />} />
                      <Route path="tasks" element={<TasksPage />} />
                      <Route path="neuro-abai" element={<NeuroAbaiPage />} />
                      <Route path="profile" element={<div>Profile Page</div>} />

                      {/* ERP routes */}
                      <Route path="erp">
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="inventory-analytics" element={<InventoryAnalytics />} />
                        <Route path="supply" element={<Supply />} />
                        <Route path="security" element={<Security />} />
                      </Route>
                    </Route>

                    {/* EDO routes */}
                    <Route path="edo">
                      <Route index element={<EdoPage />} />
                      <Route path="create" element={<DocumentCreatePage />} />
                      <Route path=":id" element={<DocumentDetailPage />} />
                    </Route>

                    {/* Role Management route */}
                    <Route path="role-management" element={<RoleManagement />} />

                    {/* Settings routes */}
                    <Route path="settings">
                      <Route path="users" element={<UsersPage />} />
                      <Route path="permissions" element={<PermissionsPage />} />
                      <Route path="integrations" element={<IntegrationsPage />} />
                      <Route path="branding" element={<BrandingPage />} />
                      <Route path="feedback" element={<FeedbackAdmin />} />
                      <Route path="system" element={<SystemSettingsPage />} />
                      <Route path="activity-monitoring" element={<ActivityMonitoring />} />
                    </Route>
                  </Route>
                </Routes>
              </BrandingProvider>
            </NotificationProvider>
          </ActivityProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
