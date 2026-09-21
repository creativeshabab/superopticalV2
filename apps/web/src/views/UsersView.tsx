import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';

export const UsersView: React.FC = () => {
  const { tenantContext, user: currentUser, permissions } = useAuthStore();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New user form modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('STAFF');
  const [formError, setFormError] = useState<string | null>(null);

  const canCreateUser =
    currentUser?.isPlatformAdmin ||
    permissions.includes('user.create') ||
    permissions.includes('users:create');

  const canUpdateUser =
    currentUser?.isPlatformAdmin ||
    permissions.includes('user.update') ||
    permissions.includes('users:update');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/users');
      setUsersList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [tenantContext?.id]);

  const handleToggleStatus = async (targetUser: any) => {
    const nextStatus = targetUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const confirmMsg =
      nextStatus === 'DISABLED'
        ? `Are you sure you want to deactivate ${targetUser.fullName}? All their active sessions and tokens will be immediately invalidated.`
        : `Activate ${targetUser.fullName}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/users/${targetUser.id}/status`, { status: nextStatus });
      fetchUsers();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.post('/users', {
        email,
        fullName,
        password,
        phone: phone || undefined,
        roleKeys: [selectedRole],
      });
      setShowCreateModal(false);
      setEmail('');
      setFullName('');
      setPassword('');
      setPhone('');
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Users & Access Control
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            User accounts, roles, and status enforcement within{' '}
            <strong>{tenantContext ? tenantContext.name : 'System'}</strong>
          </p>
        </div>

        {canCreateUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Create New User
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone</th>
                <th>Type / Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Status Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading users...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>
                        {u.fullName} {isSelf && <span className="badge badge-neutral">You</span>}
                      </td>
                      <td>
                        <code>{u.email}</code>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {u.phone || '—'}
                      </td>
                      <td>
                        {u.isPlatformAdmin ? (
                          <span className="badge badge-primary">Platform Admin</span>
                        ) : u.isOwner ? (
                          <span className="badge badge-warning">Tenant Owner</span>
                        ) : (
                          <span className="badge badge-neutral">Staff Member</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {canUpdateUser && !isSelf && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`btn btn-sm ${
                              u.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-md)',
              padding: '28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>
              Create User Account
            </h3>

            {formError && (
              <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
                <span>⚠️</span> {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Rajesh Sharma"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh@superoptical.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password (min 8 chars with complexity)</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Role Assignment</label>
                <select
                  className="form-control"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="STAFF">STAFF (Store Counter / Operations)</option>
                  <option value="STORE_MANAGER">STORE_MANAGER (Branch Manager)</option>
                  <option value="TENANT_ADMIN">TENANT_ADMIN (Optical Business Owner)</option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '24px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
