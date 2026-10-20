import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Edit3,
  Trash2,
  Flame,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import { fetchTaskById, patchTask, deleteTask } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmModal } from '../components/ConfirmModal';

export function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch task by ID
  const loadTask = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    try {
      const data = await fetchTaskById(id);
      if (data && data.task) {
        setTask(data.task);
      } else {
        throw new Error('Task data missing in response');
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
      setApiError(err.message || 'Task not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  // Handle status change directly from detail view
  const handleStatusChange = async (newStatus) => {
    if (!task || isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    try {
      await patchTask(task.id, { status: newStatus });
      setTask((prev) => ({ ...prev, status: newStatus }));
      success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toastError(`Failed to update status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle task deletion
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      success('Task deleted successfully');
      navigate('/tasks');
    } catch (err) {
      toastError(`Failed to delete: ${err.message}`);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading task details from database..." />;
  }

  if (apiError || !task) {
    return (
      <div className="detail-container">
        <Link to="/tasks" className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          Back to Tasks
        </Link>
        <ErrorAlert
          title="Could not load task"
          message={apiError || 'The requested task does not exist or has been deleted.'}
          onRetry={loadTask}
        />
      </div>
    );
  }

  const isCompleted = task.status === 'completed';
  const isOverdue =
    task.due_date &&
    !isCompleted &&
    new Date(task.due_date).setHours(23, 59, 59, 999) < new Date().getTime();

  return (
    <div className="detail-container">
      {/* Navigation breadcrumb */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/tasks" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} />
          Back to Tasks
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/tasks/${task.id}/edit`} className="btn btn-secondary btn-sm">
            <Edit3 size={15} />
            Edit
          </Link>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      <article className="detail-card">
        {/* Header & Badges */}
        <div className="detail-header">
          <div style={{ flex: 1 }}>
            <div className="task-badges">
              <span className={`badge badge-status-${task.status}`}>
                {task.status === 'completed' && <CheckCircle2 size={13} />}
                {task.status === 'in_progress' && <Clock size={13} />}
                {task.status === 'pending' && <Circle size={13} />}
                {task.status.replace('_', ' ')}
              </span>

              <span className={`badge badge-priority-${task.priority}`}>
                {task.priority === 'high' && <Flame size={13} />}
                {task.priority} Priority
              </span>

              {isOverdue && (
                <span className="badge badge-priority-high">
                  <AlertCircle size={13} />
                  Overdue
                </span>
              )}
            </div>

            <h1 className={`detail-title ${isCompleted ? 'completed' : ''}`}>
              {task.title}
            </h1>
          </div>

          {/* Quick status selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor="status-quick-select" className="meta-label">
              Quick Status Update
            </label>
            <select
              id="status-quick-select"
              className="filter-select"
              value={task.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Description section */}
        <div>
          <h2 className="detail-section-title">Description</h2>
          <div className="detail-desc-box">
            {task.description ? (
              task.description
            ) : (
              <span style={{ fontStyle: 'italic', opacity: 0.6 }}>
                No detailed description provided for this task.
              </span>
            )}
          </div>
        </div>

        {/* Metadata grid */}
        <div>
          <h2 className="detail-section-title">Task Metadata</h2>
          <div className="detail-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Task ID</span>
              <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Hash size={14} style={{ color: 'var(--text-muted)' }} />
                {task.id}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Assigned User ID</span>
              <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} style={{ color: 'var(--text-muted)' }} />
                User #{task.user_id}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Due Date</span>
              <span
                className="meta-value"
                style={{
                  color: isOverdue ? 'var(--accent)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Calendar size={14} />
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'No deadline set'}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Created At</span>
              <span className="meta-value">
                {task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Last Updated</span>
              <span className="meta-value">
                {task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="detail-actions-bar">
          <Link to="/tasks" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back to List
          </Link>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/tasks/${task.id}/edit`} className="btn btn-primary">
              <Edit3 size={16} />
              Edit Task
            </Link>
          </div>
        </div>
      </article>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        confirmText="Confirm Delete"
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
