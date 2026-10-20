import React from 'react';

export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const isLarge = size === 'lg';

  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className={`spinner ${isLarge ? 'spinner-lg' : ''}`} />
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
}

export function SkeletonTaskGrid({ count = 6 }) {
  return (
    <div className="tasks-grid" aria-busy="true" aria-label="Loading tasks">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}
