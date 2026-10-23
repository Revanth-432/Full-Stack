import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Route guard that redirects unauthenticated users to the login page.
 * Preserves the original URL in location state so the user can be
 * redirected back after signing in.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // While the AuthContext is still checking the stored token / fetching
  // the user profile, show a loading indicator instead of flashing the
  // login page.
  if (loading) {
    return <LoadingSpinner size="lg" text="Verifying authentication..." />;
  }

  if (!isAuthenticated) {
    // Pass the attempted URL so AuthPage can redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
