/**
 * TaskFlow API Client
 * Wraps native fetch with automatic JWT authentication, parameter formatting,
 * unified error normalization, and health status verification.
 */

function getApiBase() {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'https://task-manager-api-lvz.onrender.com';
  if (!envUrl) {
    return '/api';
  }
  const cleanUrl = envUrl.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
}

const API_BASE = getApiBase();

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Get stored auth token safely (supports browser and non-browser environments)
 */
export function getStoredToken() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return '';
  }
  return localStorage.getItem('taskflow_token') || '';
}

/**
 * Set stored auth token safely
 */
export function setStoredToken(token) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  if (token) {
    localStorage.setItem('taskflow_token', token);
  } else {
    localStorage.removeItem('taskflow_token');
  }
}

/**
 * Core fetch wrapper with timeout, json formatting and error parsing
 */
async function request(endpoint, options = {}, requiresAuth = null) {
  const token = getStoredToken();

  const isPublic =
    endpoint === '/health' ||
    endpoint === '/api/health' ||
    endpoint === '/auth/login' ||
    endpoint === '/auth/register';

  const shouldAuthenticate = requiresAuth !== null ? requiresAuth : !isPublic;

  // If endpoint requires authentication and no token exists, do not send
  // an unauthenticated request to the backend.
  if (shouldAuthenticate && !token) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('taskflow:unauthorized'));
    }
    throw new ApiError('Authentication required. Please sign in to continue.', 401);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // 10 second timeout for responsiveness
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Try parsing JSON response
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      let errorMessage = 'Request failed';
      let details = null;

      if (data) {
        if (data.error) errorMessage = data.error;
        else if (data.message) errorMessage = data.message;
        if (data.details) details = data.details;
      } else {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }

      // If token expired or invalid, emit event or let caller handle
      if (response.status === 401) {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('taskflow:unauthorized'));
        }
      }

      throw new ApiError(errorMessage, response.status, details);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check if your backend server is responding.', 408);
    }

    if (err instanceof ApiError) {
      throw err;
    }

    // Network / connection refused error
    throw new ApiError(
      `Unable to connect to backend server (${err.message || 'Network error'}). Ensure Node.js server is running on port 3000.`,
      0
    );
  }
}

// ----------------------------------------------------
// Health Check API
// ----------------------------------------------------
export async function checkBackendHealth() {
  return request('/health', { method: 'GET' });
}

// ----------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------
export async function loginUser(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data?.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function registerUser(username, email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function fetchCurrentUser() {
  return request('/auth/me', { method: 'GET' });
}

// ----------------------------------------------------
// Tasks CRUD Endpoints
// ----------------------------------------------------
export async function fetchTasks(params = {}) {
  const query = new URLSearchParams();

  if (params.status && params.status !== 'all') {
    query.set('status', params.status);
  }
  if (params.priority && params.priority !== 'all') {
    query.set('priority', params.priority);
  }
  if (params.search && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.page) {
    query.set('page', params.page);
  }
  if (params.limit) {
    query.set('limit', params.limit);
  }

  const queryString = query.toString();
  const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
  return request(endpoint, { method: 'GET' });
}

export async function fetchTaskById(id) {
  return request(`/tasks/${id}`, { method: 'GET' });
}

export async function createTask(taskData) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function updateTask(id, taskData) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });
}

export async function patchTask(id, partialData) {
  return request(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(partialData),
  });
}

export async function deleteTask(id) {
  return request(`/tasks/${id}`, {
    method: 'DELETE',
  });
}
