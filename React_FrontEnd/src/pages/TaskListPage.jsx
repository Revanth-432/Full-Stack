import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Sparkles, RefreshCw } from 'lucide-react';
import { fetchTasks, patchTask, deleteTask, createTask } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { TaskCard } from '../components/TaskCard';
import { TaskFilter } from '../components/TaskFilter';
import { TaskStats } from '../components/TaskStats';
import { SkeletonTaskGrid } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmModal } from '../components/ConfirmModal';

export function TaskListPage() {
  const { isAuthenticated, user, quickDemoLogin } = useAuth();
  const { success, error: toastError, info } = useToast();

  // Tasks and pagination state
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
  });

  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    limit: 6,
    page: 1,
  });

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 300);

  // Modal for delete confirmation
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    task: null,
    isDeleting: false,
  });

  // Seeding state for new accounts
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch tasks from API
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    try {
      const data = await fetchTasks({
        search: debouncedSearch,
        status: filters.status,
        priority: filters.priority,
        page: filters.page,
        limit: filters.limit,
      });

      setTasks(data.tasks || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setApiError(err.message || 'Failed to fetch tasks from server');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.status, filters.priority, filters.page, filters.limit]);

  // Load when authenticated and filters change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset to page 1 on filter/search changes
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      limit: 6,
      page: 1,
    });
  };

  // Quick toggle status handler (PATCH /api/tasks/:id)
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await patchTask(taskId, { status: newStatus });
      // Optimistically update local state
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      success(`Task marked as ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toastError(`Failed to update status: ${err.message}`);
      // Revert with reload
      loadTasks();
    }
  };

  // Open delete modal
  const openDeleteModal = (task) => {
    setDeleteModal({
      isOpen: true,
      task,
      isDeleting: false,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, task: null, isDeleting: false });
  };

  // Confirm delete handler (DELETE /api/tasks/:id)
  const handleConfirmDelete = async () => {
    if (!deleteModal.task) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      await deleteTask(deleteModal.task.id);
      success(`Task "${deleteModal.task.title}" deleted.`);
      closeDeleteModal();
      // Reload current page
      loadTasks();
    } catch (err) {
      toastError(`Failed to delete task: ${err.message}`);
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Seed sample tasks to help the user immediately experience full CRUD
  const handleSeedSamples = async () => {
    setIsSeeding(true);
    const sampleTasks = [
      {
        title: 'Review System Architecture & Microservices',
        description: 'Audit Node.js API endpoints, database indexes, and connection pooling for optimal throughput.',
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      },
      {
        title: 'Implement OAuth2 & Refresh Token Rotation',
        description: 'Enhance JWT security by implementing rotating refresh tokens and revocable session hashes.',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      },
      {
        title: 'Write Frontend Integration Tests',
        description: 'Set up component tests and end-to-end user journey tests for task creation and status toggles.',
        status: 'pending',
        priority: 'medium',
        due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      },
      {
        title: 'Deploy Production Build to Edge Network',
        description: 'Configure Vite production optimization, asset compression, and caching headers.',
        status: 'completed',
        priority: 'low',
        due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      },
    ];

    try {
      for (const sample of sampleTasks) {
        await createTask(sample);
      }
      success('Sample tasks created successfully!');
      loadTasks();
    } catch (err) {
      toastError(`Failed to create samples: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspace Tasks</h1>
          <p className="page-subtitle">
            Manage your daily tasks, track execution stages, and meet your project milestones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadTasks}
            disabled={loading}
            title="Refresh tasks from server"
          >
            <RefreshCw size={16} className={loading ? 'spinner' : ''} />
            Refresh
          </button>

          <Link to="/tasks/new" className="btn btn-primary">
            <Plus size={18} />
            Create Task
          </Link>
        </div>
      </div>

      {/* Unauthenticated notification banner */}
      {!isAuthenticated && (
        <div
          className="toolbar-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            marginBottom: '1.5rem',
            borderLeft: '4px solid var(--accent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                👋 REST API Authentication Required
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Your Node.js Task Manager API requires a JWT token to isolate each user's tasks. Click below to sign in instantly with a demo account or sign in with your own credentials.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  try {
                    await quickDemoLogin();
                    success('Signed in as demo user!');
                    loadTasks();
                  } catch (err) {
                    toastError(`Login failed: ${err.message}`);
                  }
                }}
              >
                <Sparkles size={14} />
                One-Click Demo Login
              </button>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In / Register
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top statistics summary */}
      <TaskStats tasks={tasks} totalCount={pagination.total} />

      {/* Filter and Search Bar */}
      <TaskFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Error state if server call fails */}
      {apiError && (
        <ErrorAlert
          title="Could not retrieve tasks"
          message={apiError}
          onRetry={loadTasks}
        />
      )}

      {/* Loading state skeleton */}
      {loading ? (
        <SkeletonTaskGrid count={filters.limit} />
      ) : tasks.length > 0 ? (
        <>
          {/* Real data cards grid */}
          <div className="tasks-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDeleteClick={openDeleteModal}
              />
            ))}
          </div>

          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing page <strong>{pagination.page}</strong> of{' '}
                <strong>{pagination.totalPages}</strong> (
                <strong>{pagination.total}</strong> total tasks)
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  aria-label="Previous Page"
                >
                  &larr; Prev
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`page-btn ${
                        pageNum === pagination.page ? 'active' : ''
                      }`}
                      onClick={() => handleFilterChange('page', pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="page-btn"
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  aria-label="Next Page"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="empty-state">
          <div className="empty-state-icon">
            <ClipboardList size={32} />
          </div>
          <h2 className="empty-state-title">
            {filters.search || filters.status !== 'all' || filters.priority !== 'all'
              ? 'No matching tasks found'
              : 'No tasks yet'}
          </h2>
          <p className="empty-state-desc">
            {filters.search || filters.status !== 'all' || filters.priority !== 'all'
              ? 'Try modifying your search or clearing your active filters to see more tasks.'
              : 'You have no tasks created yet. Get started by creating your first task or generate sample tasks to explore.'}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/tasks/new" className="btn btn-primary">
              <Plus size={16} />
              Create First Task
            </Link>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSeedSamples}
              disabled={isSeeding}
            >
              <Sparkles size={16} />
              {isSeeding ? 'Generating...' : 'Seed Sample Tasks'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteModal.task?.title}"? This will permanently remove it from the database.`}
        confirmText="Yes, Delete"
        isDeleting={deleteModal.isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}
