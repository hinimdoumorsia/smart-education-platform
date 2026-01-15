import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Import Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Layout & Components
import Navbar from './components/Navbar';

// Pages Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterRoleSelect from './pages/auth/RegisterRoleSelect';
import RegisterPage from './pages/auth/RegisterPage';

// Pages Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Pages Cours
import CourseListPage from './pages/courses/CourseListPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import CourseCreatePage from './pages/courses/CourseCreatePage';
import CourseEditPage from './pages/courses/CourseEditPage';
import MyCoursesPage from './pages/courses/MyCoursesPage';

// Pages Projets
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectCreatePage from './pages/projects/ProjectCreatePage';
import ProjectEditPage from './pages/projects/ProjectEditPage';
import MyProjectsPage from './pages/projects/MyProjectsPage';

// Pages Annonces
import AnnouncementListPage from './pages/announcements/AnnouncementListPage';
import AnnouncementCreatePage from './pages/announcements/AnnouncementCreatePage';
import AnnouncementDetailPage from './pages/announcements/AnnouncementDetailPage';
import AnnouncementEditPage from './pages/announcements/AnnouncementEditPage';
import MyAnnouncementsPage from './pages/announcements/MyAnnouncementsPage';

// Pages Stages
import InternshipListPage from './pages/internships/InternshipListPage';
import InternshipDetailPage from './pages/internships/InternshipDetailPage';
import InternshipCreatePage from './pages/internships/InternshipCreatePage';
import InternshipEditPage from './pages/internships/InternshipEditPage';
import MyInternshipsPage from './pages/internships/MyInternshipsPage';

// Pages Resources
import ResourceListPage from './pages/resources/ResourceListPage';
import ResourceDetailPage from './pages/resources/ResourceDetailPage';
import ResourceCreatePage from './pages/resources/ResourceCreatePage';
import ResourceEditPage from './pages/resources/ResourceEditPage';
import MyResourcesPage from './pages/resources/MyResourcesPage';

// Pages Quiz
import QuizListPage from './pages/quizzes/QuizListPage';
import QuizDetailPage from './pages/quizzes/QuizDetailPage';
import QuizCreatePage from './pages/quizzes/QuizCreatePage';
import QuizEditPage from './pages/quizzes/QuizEditPage';
import QuizAttemptPage from './pages/quizzes/QuizAttemptPage';
import QuizResultsPage from './pages/quizzes/QuizResultsPage';
import MyQuizAttemptsPage from './pages/quizzes/MyQuizAttemptsPage';
import QuizGenerationPage from './pages/quizzes/QuizGenerationPage';

// Pages Profil et Admin
import ProfilePage from './pages/profile/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';

// Styles
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container-fluid mt-3">
          <Routes>
            {/* ============================ */}
            {/* ROUTES PUBLIQUES */}
            {/* ============================ */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/select-role" element={<RegisterRoleSelect />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ============================ */}
            {/* ROUTES PROTÉGÉES - Accès général */}
            {/* ============================ */}
            <Route path="/" element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } />
            
            {/* Cours */}
            <Route path="/courses" element={
              <PrivateRoute>
                <CourseListPage />
              </PrivateRoute>
            } />
            
            <Route path="/courses/:id" element={
              <PrivateRoute>
                <CourseDetailPage />
              </PrivateRoute>
            } />
            
            {/* Projets */}
            <Route path="/projects" element={
              <PrivateRoute>
                <ProjectsPage />
              </PrivateRoute>
            } />
            
            <Route path="/projects/:id" element={
              <PrivateRoute>
                <ProjectDetailPage />
              </PrivateRoute>
            } />
            
            <Route path="/my-projects" element={
              <PrivateRoute>
                <MyProjectsPage />
              </PrivateRoute>
            } />

            {/* Annonces */}
            <Route path="/announcements" element={
              <PrivateRoute>
                <AnnouncementListPage />
              </PrivateRoute>
            } />

            <Route path="/announcements/:id" element={
              <PrivateRoute>
                <AnnouncementDetailPage />
              </PrivateRoute>
            } />

            {/* Stages */}
            <Route path="/internships" element={
              <PrivateRoute>
                <InternshipListPage />
              </PrivateRoute>
            } />

            <Route path="/internships/:id" element={
              <PrivateRoute>
                <InternshipDetailPage />
              </PrivateRoute>
            } />

            <Route path="/my-internships" element={
              <PrivateRoute>
                <MyInternshipsPage />
              </PrivateRoute>
            } />

            {/* Ressources */}
            <Route path="/resources" element={
              <PrivateRoute>
                <ResourceListPage />
              </PrivateRoute>
            } />

            <Route path="/resources/:id" element={
              <PrivateRoute>
                <ResourceDetailPage />
              </PrivateRoute>
            } />

            <Route path="/my-resources" element={
              <PrivateRoute>
                <MyResourcesPage />
              </PrivateRoute>
            } />
            
            {/* Quiz */}
            <Route path="/quizzes" element={
              <PrivateRoute>
                <QuizListPage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/:id" element={
              <PrivateRoute>
                <QuizDetailPage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/:id/attempt" element={
              <PrivateRoute requiredRoles={['STUDENT']}>
                <QuizAttemptPage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/attempts/:attemptId/results" element={
              <PrivateRoute>
                <QuizResultsPage />
              </PrivateRoute>
            } />

            <Route path="/my-quiz-attempts" element={
              <PrivateRoute>
                <MyQuizAttemptsPage />
              </PrivateRoute>
            } />

            {/* ============================ */}
            {/* ROUTES PROTÉGÉES - TEACHER et ADMIN seulement */}
            {/* ============================ */}
            {/* Cours (TEACHER/ADMIN) */}
            <Route path="/courses/create" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <CourseCreatePage />
              </PrivateRoute>
            } />
            
            <Route path="/courses/:id/edit" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <CourseEditPage />
              </PrivateRoute>
            } />
            
            <Route path="/my-courses" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <MyCoursesPage />
              </PrivateRoute>
            } />
            
            {/* Projets (TEACHER/ADMIN) */}
            <Route path="/projects/create" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <ProjectCreatePage />
              </PrivateRoute>
            } />
            
            <Route path="/projects/:id/edit" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <ProjectEditPage />
              </PrivateRoute>
            } />

            {/* Annonces (TEACHER/ADMIN) */}
            <Route path="/announcements/create" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <AnnouncementCreatePage />
              </PrivateRoute>
            } />

            <Route path="/announcements/:id/edit" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <AnnouncementEditPage />
              </PrivateRoute>
            } />

            <Route path="/my-announcements" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <MyAnnouncementsPage />
              </PrivateRoute>
            } />

            {/* Stages (Étudiants peuvent créer) */}
            <Route path="/internships/create" element={
              <PrivateRoute requiredRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                <InternshipCreatePage />
              </PrivateRoute>
            } />

            <Route path="/internships/:id/edit" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <InternshipEditPage />
              </PrivateRoute>
            } />

            {/* Ressources (TEACHER/ADMIN) */}
            <Route path="/resources/create" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <ResourceCreatePage />
              </PrivateRoute>
            } />

            <Route path="/resources/:id/edit" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <ResourceEditPage />
              </PrivateRoute>
            } />

            {/* Quiz (TEACHER/ADMIN) */}
            <Route path="/quizzes/create" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <QuizCreatePage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/generate" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <QuizGenerationPage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/:id/edit" element={
              <PrivateRoute requiredRoles={['TEACHER', 'ADMIN']}>
                <QuizEditPage />
              </PrivateRoute>
            } />

            {/* ============================ */}
            {/* ROUTES PROTÉGÉES - PROFIL */}
            {/* ============================ */}
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />

            {/* ============================ */}
            {/* ROUTES PROTÉGÉES - ADMIN seulement */}
            {/* ============================ */}
            <Route path="/admin" element={
              <PrivateRoute requiredRoles={['ADMIN']}>
                <AdminDashboardPage />
              </PrivateRoute>
            } />

            <Route path="/admin/users" element={
              <PrivateRoute requiredRoles={['ADMIN']}>
                <UserManagementPage />
              </PrivateRoute>
            } />

            {/* ============================ */}
            {/* ROUTE PAR DÉFAUT */}
            {/* ============================ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        {/* Footer */}
        <footer className="footer mt-5 py-3 bg-light">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <h5>IATD SmartHub</h5>
                <p className="text-muted">
                  Plateforme de gestion des ressources académiques
                </p>
              </div>
              <div className="col-md-6 text-end">
                <span className="text-muted">
                  © {new Date().getFullYear()} IATD - Tous droits réservés
                </span>
              </div>
            </div>
          </div>
        </footer>
      </Router>
    </AuthProvider>
  );
}

export default App;