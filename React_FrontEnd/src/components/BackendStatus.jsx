import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export function BackendStatus() {
  const { backendStatus, verifyHealth } = useAuth();
  const { online, checking, error } = backendStatus;

  return (
    <button
      type="button"
      className="backend-status-pill"
      onClick={verifyHealth}
      title={
        online
          ? 'Backend API (port 3000) is online. Click to re-check.'
          : `Backend is offline: ${error || 'Connection refused'}. Click to retry.`
      }
      aria-label="Backend status"
    >
      <span
        className={`status-dot ${
          checking ? 'checking' : online ? 'online' : 'offline'
        }`}
      />
      <span style={{ color: online ? '#10b981' : checking ? '#f59e0b' : '#ef4444' }}>
        {checking ? 'Checking API...' : online ? 'API Online' : 'API Offline'}
      </span>
      <RefreshCw size={11} className={checking ? 'spinner' : ''} style={{ opacity: 0.7 }} />
    </button>
  );
}
