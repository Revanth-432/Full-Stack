import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="empty-state" style={{ maxWidth: '600px', margin: '3rem auto' }}>
      <div className="empty-state-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
        <HelpCircle size={32} />
      </div>
      <h1 className="empty-state-title" style={{ fontSize: '2rem' }}>404 - Page Not Found</h1>
      <p className="empty-state-desc">
        The route you are trying to access does not exist or has moved. Check the URL or return to your tasks workspace.
      </p>
      <Link to="/tasks" className="btn btn-primary">
        <ArrowLeft size={16} />
        Back to Tasks
      </Link>
    </div>
  );
}
