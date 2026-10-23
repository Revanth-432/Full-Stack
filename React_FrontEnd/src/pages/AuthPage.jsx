import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  UserPlus,
  Zap,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorAlert } from '../components/ErrorAlert';

export function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const { login, register, quickDemoLogin, authError } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target after successful auth — defaults to /tasks
  const redirectTo = location.state?.from || '/tasks';

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (isRegister) {
      if (!formData.username.trim()) {
        errs.username = 'Username is required.';
      } else if (formData.username.trim().length < 3) {
        errs.username = 'Username must be at least 3 characters.';
      }
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(formData.username.trim(), formData.email.trim(), formData.password);
        success('Account created and signed in successfully!');
      } else {
        await login(formData.email.trim(), formData.password);
        success('Signed in successfully!');
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toastError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async () => {
    setSubmitting(true);
    try {
      await quickDemoLogin();
      success('Logged in with Demo Developer account!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toastError(`Demo login failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2rem auto' }}>
      <div className="form-card">
        {/* Brand visual */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            className="brand-icon-wrapper"
            style={{ margin: '0 auto 1rem', width: '48px', height: '48px' }}
          >
            <CheckSquare size={26} />
          </div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {isRegister ? 'Create an Account' : 'Welcome to TaskFlow'}
          </h1>
          <p className="page-subtitle" style={{ fontSize: '0.875rem' }}>
            Connect to the Task Manager REST API
          </p>
        </div>

        {/* Quick Demo Button */}
        <button
          type="button"
          className="btn btn-primary"
          style={{
            width: '100%',
            marginBottom: '1.5rem',
          }}
          onClick={handleDemoClick}
          disabled={submitting}
        >
          <Zap size={16} />
          Quick Demo Login (No Setup)
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '1.25rem 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 0.75rem' }}>or use credentials</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {authError && <ErrorAlert message={authError} />}

        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className={`form-input ${clientErrors.username ? 'has-error' : ''}`}
                  placeholder="e.g. dev_sarah"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              {clientErrors.username && (
                <div className="field-error-msg">
                  <AlertCircle size={14} />
                  <span>{clientErrors.username}</span>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input ${clientErrors.email ? 'has-error' : ''}`}
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {clientErrors.email && (
              <div className="field-error-msg">
                <AlertCircle size={14} />
                <span>{clientErrors.email}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form-input ${clientErrors.password ? 'has-error' : ''}`}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            {clientErrors.password && (
              <div className="field-error-msg">
                <AlertCircle size={14} />
                <span>{clientErrors.password}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <div className="spinner" />
            ) : isRegister ? (
              <>
                <UserPlus size={16} />
                Register Account
              </>
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Toggle sign in / register */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  setIsRegister(false);
                  setClientErrors({});
                }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  setIsRegister(true);
                  setClientErrors({});
                }}
              >
                Create one now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
