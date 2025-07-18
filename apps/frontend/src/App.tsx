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

            {/* Academic routes */}
            <Route path="academic">
              <Route path="academic-journal" element={<div>Academic Journal Page</div>} />
              <Route path="schedule" element={<div>Schedule Page</div>} />
              <Route path="classrooms" element={<div>Classrooms Page</div>} />
              <Route path="requests" element={<div>Booking Requests Page</div>} />
              <Route path="requests/new" element={<div>New Booking Request Page</div>} />
              <Route path="homework" element={<div>Homework Page</div>} />
            </Route>

            {/* Students routes */}
            <Route path="students" element={<div>Students Page</div>} />
            <Route path="students/:id" element={<div>Student Detail Page</div>} />
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
              <Route path="ai-chat" element={<div>AI Chat Page</div>} />
              <Route path="calendar" element={<div>Calendar Page</div>} />
              <Route path="tasks" element={<div>Tasks Page</div>} />
              <Route path="neuro-abai" element={<div>Neuro Abai Page</div>} />
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

            {/* Test routes */}
            <Route path="test/realtime-api" element={<div>Test Realtime API Page</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
