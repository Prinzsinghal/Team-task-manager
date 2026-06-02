import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../api.js';
import '../components/TaskCard.css';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    projectApi
      .list()
      .then((data) => setProjects(data.projects))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await projectApi.create({ name, description });
      setShowModal(false);
      setName('');
      setDescription('');
      navigate(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in">
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Your teams and workspaces</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
            + New project
          </button>
        </div>
      </header>

      {loading && (
        <div className="empty-state">
          <div className="loading-spinner" />
        </div>
      )}
      {error && <p className="error-msg">{error}</p>}

      {!loading && projects.length === 0 && (
        <div className="card empty-state card-glow" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="empty-state-icon">▣</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No projects yet</h3>
          <p style={{ marginBottom: '1.25rem' }}>Create your first project to start managing tasks with your team.</p>
          <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
            Create project
          </button>
        </div>
      )}

      <div className="project-grid stagger">
        {projects.map((p) => (
          <div
            key={p.id}
            className="card project-card card-glow"
            onClick={() => navigate(`/projects/${p.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${p.id}`)}
            role="button"
            tabIndex={0}
          >
            <div className="project-card-header" />
            <div className="project-card-body">
              <h3>{p.name}</h3>
              <p>{p.description || 'No description yet'}</p>
              <div className="project-card-meta">
                <span className={`badge badge-${p.role.toLowerCase()}`}>{p.role}</span>
                <span className="project-meta-chip">👥 {p.memberCount}</span>
                <span className="project-meta-chip">☰ {p.taskCount} tasks</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create project</h2>
            <p className="subtitle" style={{ marginBottom: '1.25rem' }}>You'll be the project admin</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="Website Redesign" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="What's this project about?"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
