import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../components/TaskCard.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <h1>Ship work faster with your team</h1>
          <p>
            TaskFlow keeps projects, tasks, and deadlines in one place — with clear roles for
            admins and members.
          </p>
          <div className="auth-hero-features">
            <div className="auth-feature">
              <span>✓</span> Role-based team access
            </div>
            <div className="auth-feature">
              <span>◷</span> Overdue & deadline tracking
            </div>
            <div className="auth-feature">
              <span>◎</span> Task assignment & status boards
            </div>
          </div>
        </div>
      </div>
      <div className="auth-panel">
        <div className="card auth-card card-glow">
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to your workspace</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="auth-footer">
            No account? <Link to="/signup">Create one free</Link>
          </p>
          <div className="demo-hint">
            <strong>Demo:</strong> admin@example.com / password123
          </div>
        </div>
      </div>
    </div>
  );
}
