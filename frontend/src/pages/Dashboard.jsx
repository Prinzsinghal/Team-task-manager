import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api.js';
import TaskCard from '../components/TaskCard.jsx';
import '../components/TaskCard.css';

const STAT_CONFIG = [
  { key: 'projectCount', label: 'Projects', icon: '▣', variant: '' },
  { key: 'totalTasks', label: 'Total tasks', icon: '☰', variant: '' },
  { key: 'myTasks', label: 'Assigned to me', icon: '◎', variant: '' },
  { key: 'overdueCount', label: 'Overdue', icon: '⚠', variant: 'danger' },
  { key: 'dueSoonCount', label: 'Due in 3 days', icon: '◷', variant: 'warning' },
  { key: 'done', label: 'Completed', icon: '✓', variant: 'success', statusKey: true },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: '40vh' }}>
        <div className="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }
  if (error) return <p className="error-msg">{error}</p>;
  if (!data) return null;

  const { summary } = data;
  const total = summary.totalTasks || 1;

  const getStatValue = (cfg) => {
    if (cfg.statusKey) return summary.statusCounts.DONE;
    return summary[cfg.key];
  };

  return (
    <div className="animate-in">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Your workspace at a glance</p>
        </div>
        <div className="page-header-actions">
          <Link to="/projects" className="btn-primary" style={{ display: 'inline-block' }}>
            + New project
          </Link>
        </div>
      </header>

      <div className="grid-3 stagger" style={{ marginBottom: '2rem' }}>
        {STAT_CONFIG.map((cfg) => (
          <div key={cfg.key} className={`card stat-card card-glow ${cfg.variant}`}>
            <div className="stat-card-inner">
              <div>
                <div className="stat-value">{getStatValue(cfg)}</div>
                <div className="stat-label">{cfg.label}</div>
              </div>
              <div className="stat-icon">{cfg.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 stagger">
        <section className="card card-glow">
          <h2 className="section-title">Status breakdown</h2>
          <div className="status-bars">
            {[
              { key: 'TODO', label: 'To Do', count: summary.statusCounts.TODO },
              { key: 'IN_PROGRESS', label: 'In Progress', count: summary.statusCounts.IN_PROGRESS },
              { key: 'DONE', label: 'Done', count: summary.statusCounts.DONE },
            ].map((s) => (
              <div key={s.key} className="status-bar-row">
                <div className="status-bar-header">
                  <span className={`badge badge-${s.key.toLowerCase()}`}>{s.label}</span>
                  <strong>{s.count}</strong>
                </div>
                <div className="status-bar-track">
                  <div
                    className={`status-bar-fill ${s.key === 'IN_PROGRESS' ? 'in_progress' : s.key.toLowerCase()}`}
                    style={{ width: `${(s.count / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card card-glow">
          <h2 className="section-title">Your projects</h2>
          {data.projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">▣</div>
              <p>No projects yet.</p>
              <Link to="/projects" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Create your first project
              </Link>
            </div>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {data.projects.map((p) => (
                <li key={p.id} className="project-list-item">
                  <Link to={`/projects/${p.id}`}>{p.name}</Link>
                  <span className={`badge badge-${p.role.toLowerCase()}`}>{p.role}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid-2 stagger" style={{ marginTop: '1.35rem' }}>
        <section className="card card-glow">
          <h2 className="section-title">Overdue tasks</h2>
          {data.overdue.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✓</div>
              <p>You're all caught up — no overdue tasks</p>
            </div>
          ) : (
            <div className="task-list">
              {data.overdue.map((t) => (
                <TaskCard key={t.id} task={t} showProject />
              ))}
            </div>
          )}
        </section>

        <section className="card card-glow">
          <h2 className="section-title">My tasks</h2>
          {data.myTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◎</div>
              <p>No tasks assigned to you yet</p>
            </div>
          ) : (
            <div className="task-list">
              {data.myTasks.map((t) => (
                <TaskCard key={t.id} task={t} showProject />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
