import React from 'react';
import { AlertCircle, RefreshCw, ServerOff } from 'lucide-react';

export function ErrorAlert({
  title = 'Something went wrong',
  message,
  onRetry,
  isNetworkError = false,
}) {
  const isServerDown =
    isNetworkError ||
    (message &&
      (message.toLowerCase().includes('connect') ||
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('port 3000') ||
        message.toLowerCase().includes('failed to fetch')));

  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-icon">
        {isServerDown ? <ServerOff size={28} /> : <AlertCircle size={28} />}
      </div>
      <div className="error-banner-content">
        <h3 className="error-banner-title">
          {isServerDown ? 'Backend Server Unavailable' : title}
        </h3>
        <p className="error-banner-msg">
          {message || 'An unexpected error occurred while communicating with the API.'}
        </p>

        {isServerDown && (
          <p className="form-hint" style={{ color: '#fed7aa', marginBottom: '0.85rem' }}>
            💡 Tip: Ensure your Node.js server is running on port 3000 (e.g., <code>npm run dev</code> inside <code>Rest API with Node</code>).
          </p>
        )}

        {onRetry && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            <RefreshCw size={14} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
