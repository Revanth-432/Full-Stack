import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  PlusCircle,
  ListTodo,
  LogOut,
  LogIn,
  Zap,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BackendStatus } from './BackendStatus';

export function Navbar() {
  const { user, isAuthenticated, logout, quickDemoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingInDemo, setLoggingInDemo] = useState(false);

  const handleDemoLogin = async () => {
    setLoggingInDemo(true);
    try {
      await quickDemoLogin();
      success('Logged in as demo user!');
      navigate('/tasks');
    } catch (err) {
      error(`Demo login failed: ${err.message}`);
    } finally {
      setLoggingInDemo(false);
    }
  };

  const handleLogout = () => {
    logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/tasks" className="nav-brand" onClick={closeMobile}>
          <div className="brand-icon-wrapper">
            <CheckSquare size={22} />
          </div>
          <span className="brand-title">TaskFlow</span>
          <span className="brand-badge">REST API</span>
        </Link>

        {/* Navigation Links */}
        <nav className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <NavLink
            to="/tasks"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <ListTodo size={17} />
            Tasks
          </NavLink>

          <NavLink
            to="/tasks/new"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <PlusCircle size={17} />
            New Task
          </NavLink>
        </nav>

        {/* Action Controls & User Area */}
        <div className="nav-actions">
          <BackendStatus />

          {isAuthenticated ? (
            <div className="user-chip">
              <div className="user-avatar" title={user?.email || 'User'}>
                {user?.username ? user.username.charAt(0).toUpperCase() : <User size={14} />}
              </div>
              <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.username || 'User'}
              </span>
              <button
                type="button"
                className="btn-icon"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleDemoLogin}
                disabled={loggingInDemo}
                title="Instantly sign in with a demo account"
              >
                <Zap size={14} />
                {loggingInDemo ? 'Signing in...' : 'Demo Login'}
              </button>
              <Link to="/login" className="btn btn-outline btn-sm" onClick={closeMobile}>
                <LogIn size={14} />
                Sign In
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
