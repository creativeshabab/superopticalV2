import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { HeaderSwitcher } from './HeaderSwitcher';
import { api } from '../api/client';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-badge">SO</div>
          <div>
            <div className="brand-title">Super Optical</div>
            <div className="brand-sub">V2 Foundation</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>🛡️</span> Security & System
          </NavLink>

          <NavLink
            to="/tenants"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>🏢</span> Tenants
          </NavLink>

          <NavLink
            to="/stores"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>🏪</span> Stores & Branches
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>👥</span> Users & Access
          </NavLink>

          <NavLink
            to="/audit"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>📜</span> Audit Trail
          </NavLink>
        </nav>

        {/* User Info footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#fff',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.fullName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {user?.isPlatformAdmin ? (
                <span className="badge badge-primary">Platform Admin</span>
              ) : (
                <span className="badge badge-neutral">Tenant User</span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="top-bar">
          <HeaderSwitcher />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success">Active Session</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
