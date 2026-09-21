import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });

      if (res) {
        // Fetch session data to get full tenants and stores lists
        useAuthStore.setState({ accessToken: res.accessToken });
        const meRes = await api.get('/auth/me');

        setAuth({
          user: res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          tenantContext: res.tenantContext,
          storeContext: res.storeContext,
          availableTenants: meRes?.tenants || (res.tenantContext ? [res.tenantContext] : []),
          availableStores: meRes?.stores || (res.storeContext ? [res.storeContext] : []),
          permissions: res.permissions || [],
        });

        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('Password123!');
    handleLogin(undefined, presetEmail, 'Password123!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            className="brand-badge"
            style={{
              margin: '0 auto 12px auto',
              width: '48px',
              height: '48px',
              fontSize: '1.4rem',
            }}
          >
            SO
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Super Optical V2
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Multi-Tenant Enterprise Optical Retail ERP
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handleLogin(e)}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@superoptical.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick-Login Demo Accounts Chips */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '12px',
              letterSpacing: '0.05em',
            }}
          >
            Demo Accounts (One-Click Sign In)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between' }}
              onClick={() => quickLogin('platform.admin@superoptical.com')}
            >
              <span style={{ fontWeight: 600 }}>Platform Admin</span>
              <code style={{ fontSize: '0.72rem' }}>platform.admin@superoptical.com</code>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between' }}
              onClick={() => quickLogin('owner.bihar@superoptical.com')}
            >
              <span style={{ fontWeight: 600 }}>Tenant Admin (Bihar)</span>
              <code style={{ fontSize: '0.72rem' }}>owner.bihar@superoptical.com</code>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between' }}
              onClick={() => quickLogin('manager.patna@superoptical.com')}
            >
              <span style={{ fontWeight: 600 }}>Store Manager (Patna)</span>
              <code style={{ fontSize: '0.72rem' }}>manager.patna@superoptical.com</code>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between' }}
              onClick={() => quickLogin('staff.patna@superoptical.com')}
            >
              <span style={{ fontWeight: 600 }}>Staff Member (Patna)</span>
              <code style={{ fontSize: '0.72rem' }}>staff.patna@superoptical.com</code>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between' }}
              onClick={() => quickLogin('owner.bengal@superoptical.com')}
            >
              <span style={{ fontWeight: 600 }}>Tenant Admin (Bengal)</span>
              <code style={{ fontSize: '0.72rem' }}>owner.bengal@superoptical.com</code>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
