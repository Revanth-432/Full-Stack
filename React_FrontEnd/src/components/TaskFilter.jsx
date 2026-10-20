import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

export function TaskFilter({
  filters,
  onFilterChange,
  onResetFilters,
}) {
  const { search, status, priority, limit } = filters;

  const hasActiveFilters =
    search.trim() !== '' || status !== 'all' || priority !== 'all';

  return (
    <div className="toolbar-card">
      <div className="toolbar-row">
        {/* Search input */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by title or description..."
            value={search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            aria-label="Search tasks"
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onFilterChange('search', '')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="filters-group">
          {/* Status filter */}
          <select
            className="filter-select"
            value={status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority filter */}
          <select
            className="filter-select"
            value={priority}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Per Page Limit */}
          <select
            className="filter-select"
            value={limit}
            onChange={(e) => onFilterChange('limit', Number(e.target.value))}
            aria-label="Items per page"
            style={{ minWidth: '95px' }}
          >
            <option value={6}>6 per page</option>
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
          </select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
