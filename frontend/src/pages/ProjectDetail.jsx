import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { memberApi, projectApi, taskApi } from '../api.js';
import { formatDate, isOverdue } from '../components/TaskCard.jsx';
import '../components/TaskCard.css';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState('tasks');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    dueDate: '',
    assigneeId: '',
  });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');

  const isAdmin = project?.role === 'ADMIN';

  const load = useCallback(() => {
    setLoading(true);
    projectApi
      .get(projectId)
      .then((data) => setProject(data.project))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskApi.create(projectId, {
        ...taskForm,
        assigneeId: taskForm.assigneeId || undefined,
        dueDate: taskForm.dueDate || undefined,
      });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', status: 'TODO', dueDate: '', assigneeId: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await taskApi.update(projectId, taskId, updates);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskApi.remove(projectId, taskId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await memberApi.add(projectId, { email: memberEmail, role: memberRole });
      setShowMemberModal(false);
      setMemberEmail('');
      setMemberRole('MEMBER');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (memberId, role) => {
    try {
      await memberApi.updateRole(projectId, memberId, role);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await memberApi.remove(projectId, memberId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: '40vh' }}>
        <div className="loading-spinner" />
        <p>Loading project...</p>
      </div>
    );
  }
  if (error && !project) return <p className="error-msg">{error}</p>;
  if (!project) return null;

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="animate-in">
      <header className="page-header">
        <div>
          <Link to="/projects" className="breadcrumb">
            ← Back to projects
          </Link>
          <h1>{project.name}</h1>
          <p>{project.description || 'No description'}</p>
          <span className={`badge badge-${project.role.toLowerCase()} role-pill`}>{project.role}</span>
        </div>
        <div className="page-header-actions">
          {tab === 'tasks' && (
            <button type="button" className="btn-primary" onClick={() => setShowTaskModal(true)}>
              + Add task
            </button>
          )}
          {tab === 'members' && isAdmin && (
            <button type="button" className="btn-primary" onClick={() => setShowMemberModal(true)}>
              + Add member
            </button>
          )}
        </div>
      </header>

      {error && <p className="error-msg" style={{ marginBottom: '1rem' }}>{error}</p>}

      <div className="tabs">
        <button type="button" className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>
          Tasks ({project.tasks?.length || 0})
        </button>
        <button type="button" className={tab === 'members' ? 'active' : ''} onClick={() => setTab('members')}>
          Team ({project.members?.length || 0})
        </button>
      </div>

      {tab === 'tasks' && (
        <div className="card card-glow">
          {!project.tasks?.length ? (
            <div className="empty-state">
              <div className="empty-state-icon">☰</div>
              <p>No tasks yet. Create the first one.</p>
            </div>
          ) : (
            project.tasks.map((task) => (
              <div key={task.id} className="task-row">
                <div>
                  <strong style={{ fontSize: '1rem' }}>{task.title}</strong>
                  {isOverdue(task) && (
                    <span className="badge badge-overdue" style={{ marginLeft: '0.5rem' }}>
                      Overdue
                    </span>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {task.assignee ? `◎ ${task.assignee.name}` : 'Unassigned'}
                    {task.dueDate && ` · ◷ ${formatDate(task.dueDate)}`}
                  </div>
                </div>
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateTask(task.id, { status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <select
                  value={task.assigneeId || ''}
                  onChange={(e) =>
                    handleUpdateTask(task.id, { assigneeId: e.target.value || null })
                  }
                >
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="card card-glow">
          {project.members.map((m) => (
            <div key={m.id} className="member-row">
              <div className="member-info-wrap">
                <div className="member-avatar-sm">{getInitials(m.user.name)}</div>
                <div>
                  <strong>{m.user.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.user.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isAdmin && m.user.id !== project.ownerId ? (
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                )}
                {isAdmin && m.user.id !== project.ownerId && (
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => handleRemoveMember(m.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Title</label>
                <input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Assign to</label>
                <select
                  value={taskForm.assigneeId}
                  onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add team member</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              User must already have an account.
            </p>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowMemberModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
