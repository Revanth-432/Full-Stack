import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TaskListPage } from './pages/TaskListPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { TaskFormPage } from './pages/TaskFormPage';
import { AuthPage } from './pages/AuthPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Default route redirects to /tasks */}
                <Route path="/" element={<Navigate to="/tasks" replace />} />

                {/* Route 1: List View (public — has its own auth banner) */}
                <Route path="/tasks" element={<TaskListPage />} />

                {/* Route 2: Create Form (protected — requires authentication) */}
                <Route path="/tasks/new" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />

                {/* Route 3: Detail View (protected) */}
                <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />

                {/* Route 4: Edit Form (protected) */}
                <Route path="/tasks/:id/edit" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />

                {/* Authentication Routes */}
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
