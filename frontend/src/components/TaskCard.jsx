import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isOverdue(task) {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < new Date();
}

export default function TaskCard({ task, showProject = false }) {
  const overdue = isOverdue(task);

  return (
    <div className={`task-card ${overdue ? 'task-overdue' : ''}`}>
      <div className="task-card-header">
        <span className={`badge badge-${task.status.toLowerCase()}`}>
          {STATUS_LABELS[task.status]}
        </span>
        {overdue && <span className="badge badge-overdue">Overdue</span>}
      </div>
      <h4>{task.title}</h4>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-meta">
        {showProject && task.project && (
          <Link to={`/projects/${task.project.id}`}>▣ {task.project.name}</Link>
        )}
        {task.assignee && <span>◎ {task.assignee.name}</span>}
        {task.dueDate && <span>◷ {formatDate(task.dueDate)}</span>}
      </div>
    </div>
  );
}
