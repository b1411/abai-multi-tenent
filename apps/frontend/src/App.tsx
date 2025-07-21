import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
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
import AiChatPage from './pages/AiChat';
import NeuroAbaiPage from './pages/NeuroAbai';
import ClassroomsPage from './pages/Classrooms';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

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

            {/* Students routes */}
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentDetailPage />} />
            <Route path="performance" element={<div>Performance Page</div>} />

            {/* Quiz routes */}
            <Route path="quiz/:quizId/statistics" element={<div>Quiz Statistics Page</div>} />

            {/* HR routes */}
            <Route path="hr">
              <Route path="employees" element={<div>Employees Page</div>} />
              <Route path="workload" element={<div>Workload Page</div>} />
              <Route path="kpi" element={<div>KPI Page</div>} />
              <Route path="vacation" element={<div>Vacation Page</div>} />
              <Route path="fake-positions" element={<div>Fake Positions Page</div>} />
            </Route>

            {/* Finance routes */}
            <Route path="finance">
              <Route path="payments" element={<div>Payments Page</div>} />
              <Route path="reports" element={<div>Reports Page</div>} />
              <Route path="budget" element={<div>Budget Page</div>} />
              <Route path="acl" element={<div>ACL Page</div>} />
              <Route path="payroll" element={<div>Payroll Page</div>} />
              <Route path="salaries" element={<div>Salaries Page</div>} />
              <Route path="antifraud" element={<div>Anti-Fraud Page</div>} />
            </Route>

            {/* Applications routes */}
            <Route path="app">
              <Route path="chat" element={<div>Chat Page</div>} />
              <Route path="ai-chat" element={<AiChatPage />} />
              <Route path="calendar" element={<div>Calendar Page</div>} />
              <Route path="tasks" element={<div>Tasks Page</div>} />
              <Route path="neuro-abai" element={<NeuroAbaiPage />} />
              <Route path="profile" element={<div>Profile Page</div>} />

              {/* ERP routes */}
              <Route path="erp">
                <Route path="inventory" element={<div>Inventory Page</div>} />
                <Route path="supply" element={<div>Supply Page</div>} />
              </Route>
            </Route>

            {/* Settings routes */}
            <Route path="settings">
              <Route path="users" element={<div>Users Page</div>} />
              <Route path="permissions" element={<div>Permissions Page</div>} />
              <Route path="integrations" element={<div>Integrations Page</div>} />
              <Route path="branding" element={<div>Branding Page</div>} />
              <Route path="system" element={<div>System Page</div>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
