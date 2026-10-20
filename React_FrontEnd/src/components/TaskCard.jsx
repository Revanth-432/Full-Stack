import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Edit3,
  Trash2,
  ArrowRight,
  Flame,
} from 'lucide-react';

export function TaskCard({ task, onStatusChange, onDeleteClick }) {
  const [updating, setUpdating] = useState(false);

  const {
    id,
    title,
    description,
    status = 'pending',
    priority = 'medium',
    due_date,
  } = task;

  const isCompleted = status === 'completed';

  // Check if task is overdue
  const isOverdue =
    due_date &&
    !isCompleted &&
    new Date(due_date).setHours(23, 59, 59, 999) < new Date().getTime();

  // Format date helper
  const formattedDueDate = due_date
    ? new Date(due_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Quick toggle completed/pending
  const handleQuickToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (updating || !onStatusChange) return;

    const nextStatus = isCompleted ? 'pending' : 'completed';
    setUpdating(true);
    try {
      await onStatusChange(id, nextStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <article
      className={`task-card priority-${priority}`}
      aria-label={`Task: ${title}`}
    >
      <div>
        {/* Badges & Quick Toggle */}
        <div className="task-card-header">
          <div className="task-badges">
            <span className={`badge badge-status-${status}`}>
              {status === 'completed' && <CheckCircle2 size={12} />}
              {status === 'in_progress' && <Clock size={12} />}
              {status === 'pending' && <Circle size={12} />}
              {status.replace('_', ' ')}
            </span>

            <span className={`badge badge-priority-${priority}`}>
              {priority === 'high' && <Flame size={12} />}
              {priority}
            </span>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={handleQuickToggle}
            disabled={updating}
            title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
            aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
            style={{ color: isCompleted ? 'var(--success)' : 'var(--text-muted)' }}
          >
            {isCompleted ? <CheckCircle2 size={19} /> : <Circle size={19} />}
          </button>
        </div>

        {/* Title */}
        <h3 className={`task-card-title ${isCompleted ? 'completed' : ''}`}>
          <Link to={`/tasks/${id}`}>{title}</Link>
        </h3>

        {/* Description snippet */}
        <p className="task-card-desc">
          {description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No description provided.</span>}
        </p>
      </div>

      {/* Footer / Actions */}
      <div className="task-card-footer">
        <div className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>
          {due_date ? (
            <>
              {isOverdue ? <AlertCircle size={14} /> : <Calendar size={14} />}
              <span>{formattedDueDate}</span>
              {isOverdue && <span>(Overdue)</span>}
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No due date</span>
          )}
        </div>

        <div className="task-card-actions">
          <Link
            to={`/tasks/${id}/edit`}
            className="btn-icon"
            title="Edit Task"
            aria-label="Edit Task"
          >
            <Edit3 size={15} />
          </Link>

          <button
            type="button"
            className="btn-icon"
            onClick={() => onDeleteClick(task)}
            title="Delete Task"
            aria-label="Delete Task"
            style={{ color: 'var(--accent)' }}
          >
            <Trash2 size={15} />
          </button>

          <Link
            to={`/tasks/${id}`}
            className="btn-icon"
            title="View Details"
            aria-label="View Details"
          >
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
