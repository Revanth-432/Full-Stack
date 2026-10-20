import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredToken,
  setStoredToken,
  loginUser,
  registerUser,
  fetchCurrentUser,
  checkBackendHealth,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Backend connectivity state
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    online: false,
    timestamp: null,
    error: null,
    checking: false,
  });

  // Verify backend health
  const verifyHealth = useCallback(async () => {
    setBackendStatus((prev) => ({ ...prev, checking: true, error: null }));
    try {
      const data = await checkBackendHealth();
      setBackendStatus({
        checked: true,
        online: true,
        timestamp: data.timestamp || new Date().toISOString(),
        error: null,
        checking: false,
      });
      return true;
    } catch (err) {
      setBackendStatus({
        checked: true,
        online: false,
        timestamp: null,
        error: err.message,
        checking: false,
      });
      return false;
    }
  }, []);

  // Fetch current user if token exists
  const loadUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchCurrentUser();
      if (res && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
        setStoredToken('');
        setToken('');
      }
    } catch (err) {
      console.warn('Failed to fetch user with token:', err.message);
      // If token expired/invalid, clear
      if (err.status === 401) {
        setStoredToken('');
        setToken('');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for global 401 events
  useEffect(() => {
    const handleUnauthorized = () => {
      setStoredToken('');
      setToken('');
      setUser(null);
    };
    window.addEventListener('taskflow:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('taskflow:unauthorized', handleUnauthorized);
  }, []);

  // Initial load
  useEffect(() => {
    verifyHealth();
    loadUser();
  }, [verifyHealth, loadUser]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await loginUser(email, password);
      setToken(res.token);
      setUser(res.user);
      return res;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  // Register handler
  const register = async (username, email, password) => {
    setAuthError(null);
    try {
      const res = await registerUser(username, email, password);
      // Auto login after successful registration
      return await login(email, password);
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  };

  // Demo user quick login / provision
  const quickDemoLogin = async () => {
    setAuthError(null);
    const demoEmail = 'alex.demo@taskflow.dev';
    const demoPass = 'Password123!';
    const demoUsername = 'alex_developer';

    try {
      // Try login first
      return await login(demoEmail, demoPass);
    } catch (loginErr) {
      // If unauthorized (user doesn't exist yet), register then login
      if (loginErr.status === 401) {
        try {
          await registerUser(demoUsername, demoEmail, demoPass);
          return await login(demoEmail, demoPass);
        } catch (regErr) {
          if (regErr.message && regErr.message.includes('already exists')) {
            return await login(demoEmail, demoPass);
          }
          setAuthError(regErr.message);
          throw regErr;
        }
      }
      setAuthError(loginErr.message);
      throw loginErr;
    }
  };

  // Logout handler
  const logout = () => {
    setStoredToken('');
    setToken('');
    setUser(null);
    setAuthError(null);
  };

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    loading,
    authError,
    backendStatus,
    verifyHealth,
    login,
    register,
    quickDemoLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
