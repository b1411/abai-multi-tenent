import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { ActivityProvider } from './providers/ActivityProvider';
import { BrandingProvider } from './providers/BrandingProvider';
import ProtectedRoute from './components/ProtectedRoute';
import RouteRoleGuard from './components/RouteRoleGuard';
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
import EmotionalAnalysisPage from './pages/EmotionalAnalysis';
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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Inventory from './pages/Inventory';
import InventoryAnalytics from './pages/InventoryAnalytics';
import Supply from './pages/Supply';
import TasksPage from './pages/Tasks';
import ChatPage from './pages/Chat';
import CalendarPage from './pages/Calendar';
import SystemSettings from './pages/SystemSettings';
import UsersPage from './pages/Users';
import PermissionsPage from './pages/Permissions';
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
import MyChildren from './pages/MyChildren';
import GroupDetail from './pages/GroupDetail';
import StudentProfile from './pages/StudentProfile';
import QuizTakingPage from './pages/QuizTakingPage';
import QuizResultsPage from './pages/QuizResultsPage';
import QuizAttemptResultPage from './pages/QuizAttemptResultPage';
import Teachers from './pages/Teachers';
import TeacherProfile from './pages/TeacherProfile';
import AdminChats from './pages/AdminChats';
import NotificationsPage from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AttendanceCheckIn from './pages/AttendanceCheckIn';
import NotFound from './pages/NotFound';
import AISchedule from './pages/AISchedule';
import StaffCompositionPage from './pages/StaffCompositionPage';
import { ToastProvider } from './providers/ToastProvider';

const App: React.FC = () => {
  console.log(import.meta.env)

  return (
    <Router>
      <AuthProvider>
        <ActivityProvider>
          <NotificationProvider>
            <ToastProvider>
              <BrandingProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/attendance/check-in" element={<AttendanceCheckIn />} />
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
                    <Route element={<RouteRoleGuard />}>
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
                      <Route path="ai-schedule" element={<AISchedule />} />

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
                      <Route path="students/emotional-analysis" element={<EmotionalAnalysisPage />} />
                      <Route path="students/:id" element={<StudentDetailPage />} />
                      <Route path="my-children" element={<MyChildren />} />
                      <Route path="groups" element={<GroupsPage />} />
                      <Route path="groups/:id" element={<GroupDetail />} />
                      <Route path="performance" element={<PerformancePage />} />
                      <Route path="loyalty" element={<LoyaltyPage />} />

                      {/* Alumni routes */}
                      <Route path="alumni" element={<AlumniList />} />
                      <Route path="alumni/:id" element={<AlumniDetail />} />

                      {/* JAS.LIFE route */}
                      <Route path="jas-life" element={<JasLife />} />

                      {/* Quiz routes */}
                      <Route path="quiz/:quizId/statistics" element={<div>Quiz Statistics Page</div>} />

                      {/* Teachers routes */}
                      <Route path="teachers" element={<Teachers />} />
                      <Route path="teachers/:teacherId" element={<TeacherProfile />} />
                      <Route path="quiz/:quizId/take" element={<QuizTakingPage />} />
                      <Route path="quiz/results" element={<QuizResultsPage />} />
                      <Route path="quiz/attempt/:attemptId/result" element={<QuizAttemptResultPage />} />

                      {/* HR routes */}
                      <Route path="hr">
                        <Route path="employees" element={<TeachersPage />} />
                        <Route path="workload" element={<WorkloadPage />} />
                        <Route path="kpi" element={<KPIPage />} />
                        <Route path="vacation" element={<VacationsPage />} />
                        <Route path="substitutions" element={<SubstitutionsPage />} />
                        <Route path="fake-positions" element={<FakePositions />} />
                        <Route path="staff-composition" element={<StaffCompositionPage />} />
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
                        <Route path="admin-chats" element={<AdminChats />} />
                        <Route path="ai-chat" element={<AiChatPage />} />
                        <Route path="calendar" element={<CalendarPage />} />
                        <Route path="tasks" element={<TasksPage />} />
                        <Route path="neuro-abai" element={<NeuroAbaiPage />} />
                        <Route path="profile" element={<StudentProfile />} />

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

                      {/* Settings routes */}
                      <Route path="settings">
                        <Route path="users" element={<UsersPage />} />
                        <Route path="permissions" element={<PermissionsPage />} />
                        <Route path="integrations" element={<IntegrationsPage />} />
                        <Route path="branding" element={<BrandingPage />} />
                        <Route path="feedback" element={<FeedbackAdmin />} />
                        <Route path="system" element={<SystemSettings />} />
                        <Route path="activity-monitoring" element={<ActivityMonitoring />} />
                      </Route>

                      {/* Notifications route */}
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Route>
                </Routes>
              </BrandingProvider>
            </ToastProvider>
          </NotificationProvider>
        </ActivityProvider>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={5000} pauseOnHover theme="colored" />
    </Router>
  );
};

export default App;
