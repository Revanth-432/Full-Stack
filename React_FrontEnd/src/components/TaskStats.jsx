import React from 'react';
import { CheckCircle2, Clock, Circle, Layers } from 'lucide-react';

export function TaskStats({ tasks = [], totalCount = 0 }) {
  // If tasks list is present, compute counts
  const total = totalCount || tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  return (
    <section className="stats-grid" aria-label="Task Statistics">
      <div className="stat-card">
        <div className="stat-icon total">
          <Layers size={22} />
        </div>
        <div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon pending">
          <Circle size={22} />
        </div>
        <div>
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon in-progress">
          <Clock size={22} />
        </div>
        <div>
          <div className="stat-value">{inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon completed">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>
    </section>
  );
}
