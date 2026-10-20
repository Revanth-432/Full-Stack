import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { fetchTaskById, createTask, updateTask } from '../api/client';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

export function TaskFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  // Form inputs state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
  });

  // Touched state to avoid nagging the user before they interact
  const [touched, setTouched] = useState({
    title: false,
    description: false,
    due_date: false,
  });

  // Client-side validation errors
  const [errors, setErrors] = useState({});

  // Loading & submit states
  const [isLoadingInitial, setIsLoadingInitial] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Validate form client-side
  const validate = useCallback((data) => {
    const errs = {};

    // Title validation
    const trimmedTitle = data.title ? data.title.trim() : '';
    if (!trimmedTitle) {
      errs.title = 'Task title is required.';
    } else if (trimmedTitle.length < 3) {
      errs.title = 'Title must be at least 3 characters long.';
    } else if (trimmedTitle.length > 200) {
      errs.title = 'Title cannot exceed 200 characters.';
    }

    // Description validation
    if (data.description && data.description.length > 2000) {
      errs.description = 'Description cannot exceed 2000 characters.';
    }

    // Status validation
    if (!['pending', 'in_progress', 'completed'].includes(data.status)) {
      errs.status = 'Status must be pending, in_progress, or completed.';
    }

    // Priority validation
    if (!['low', 'medium', 'high'].includes(data.priority)) {
      errs.priority = 'Priority must be low, medium, or high.';
    }

    // Due date validation
    if (data.due_date) {
      const parsed = new Date(data.due_date);
      if (isNaN(parsed.getTime())) {
        errs.due_date = 'Please enter a valid date format.';
      }
    }

    return errs;
  }, []);

  // Update validation whenever formData changes
  useEffect(() => {
    setErrors(validate(formData));
  }, [formData, validate]);

  // If edit mode, fetch existing task
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    async function loadExistingTask() {
      setIsLoadingInitial(true);
      setServerError(null);

      try {
        const res = await fetchTaskById(id);
        if (isMounted && res && res.task) {
          const t = res.task;
          setFormData({
            title: t.title || '',
            description: t.description || '',
            status: t.status || 'pending',
            priority: t.priority || 'medium',
            // Format ISO date to YYYY-MM-DD for date input
            due_date: t.due_date ? t.due_date.split('T')[0] : '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setServerError(`Failed to load task: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    }

    loadExistingTask();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Blur handler for marking touched
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({
      title: true,
      description: true,
      due_date: true,
    });

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toastError('Please fix the validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date ? formData.due_date : null,
    };

    try {
      if (isEditMode) {
        await updateTask(id, payload);
        success('Task updated successfully!');
        navigate(`/tasks/${id}`);
      } else {
        const res = await createTask(payload);
        success('Task created successfully!');
        const createdId = res?.task?.id;
        if (createdId) {
          navigate(`/tasks/${createdId}`);
        } else {
          navigate('/tasks');
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      // If server returned express-validator details
      if (err.details && Array.isArray(err.details)) {
        const serverFieldErrors = {};
        err.details.forEach((d) => {
          if (d.field) serverFieldErrors[d.field] = d.message;
        });
        setErrors((prev) => ({ ...prev, ...serverFieldErrors }));
      }
      setServerError(err.message || 'Failed to save task to database.');
      toastError(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitial) {
    return <LoadingSpinner size="lg" text="Loading task details for editing..." />;
  }

  const isFormValid = Object.keys(errors).length === 0;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Navigation breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to={isEditMode ? `/tasks/${id}` : '/tasks'}
          className="btn btn-outline btn-sm"
        >
          <ArrowLeft size={16} />
          {isEditMode ? 'Cancel & Return to Details' : 'Back to Tasks'}
        </Link>
      </div>

      <div className="form-card">
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="page-title">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </h1>
          <p className="page-subtitle">
            {isEditMode
              ? 'Update task specifications, priority, deadlines, and execution progress.'
              : 'Add a new actionable objective with priority routing and deadline tracking.'}
          </p>
        </div>

        {serverError && (
          <ErrorAlert
            title={isEditMode ? 'Error Updating Task' : 'Error Creating Task'}
            message={serverError}
          />
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              <span>
                Task Title <span className="required-dot">*</span>
              </span>
              <span className="char-counter">
                {formData.title.length}/200
              </span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={`form-input ${touched.title && errors.title ? 'has-error' : ''}`}
              placeholder="e.g., Implement secure user authentication"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={200}
              required
            />
            {touched.title && errors.title && (
              <div className="field-error-msg">
                <AlertCircle size={14} />
                <span>{errors.title}</span>
              </div>
            )}
            <div className="form-hint">
              Be concise and descriptive. Required (3–200 characters).
            </div>
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              <span>Task Description</span>
              <span className="char-counter">
                {formData.description.length}/2000
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              className={`form-textarea ${
                touched.description && errors.description ? 'has-error' : ''
              }`}
              placeholder="Provide context, acceptance criteria, or technical details..."
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={2000}
            />
            {touched.description && errors.description && (
              <div className="field-error-msg">
                <AlertCircle size={14} />
                <span>{errors.description}</span>
              </div>
            )}
          </div>

          {/* Status & Priority Row */}
          <div className="form-row">
            {/* Status */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Due Date Field */}
          <div className="form-group">
            <label htmlFor="due_date" className="form-label">
              Target Due Date
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              className={`form-input ${touched.due_date && errors.due_date ? 'has-error' : ''}`}
              value={formData.due_date}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.due_date && errors.due_date && (
              <div className="field-error-msg">
                <AlertCircle size={14} />
                <span>{errors.due_date}</span>
              </div>
            )}
            <div className="form-hint">
              Optional deadline. Formatted as ISO 8601 YYYY-MM-DD.
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Link
              to={isEditMode ? `/tasks/${id}` : '/tasks'}
              className="btn btn-secondary"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || (touched.title && !isFormValid)}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isEditMode ? 'Save Changes' : 'Create Task'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
