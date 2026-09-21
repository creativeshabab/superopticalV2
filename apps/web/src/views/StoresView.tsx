import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';

export const StoresView: React.FC = () => {
  const { tenantContext, storeContext, setStore, permissions, user } = useAuthStore();
  const [storesList, setStoresList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New store form modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isMainBranch, setIsMainBranch] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canCreateStore =
    user?.isPlatformAdmin ||
    permissions.includes('store.create') ||
    permissions.includes('stores:create');

  const fetchStores = async () => {
    if (!tenantContext) {
      setStoresList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/stores');
      setStoresList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [tenantContext?.id]);

  const handleSwitchStore = async (targetStoreId: string) => {
    try {
      const res = await api.post(`/stores/${targetStoreId}/switch`);
      if (res && res.storeContext) {
        setStore(res.storeContext);
      }
    } catch (err: any) {
      alert(`Error switching store: ${err.message}`);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.post('/stores', {
        name,
        code,
        phone: phone || undefined,
        email: email || undefined,
        isMainBranch,
      });
      setShowCreateModal(false);
      setName('');
      setCode('');
      setPhone('');
      setEmail('');
      setIsMainBranch(false);
      fetchStores();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create store');
    }
  };

  if (!tenantContext) {
    return (
      <div className="alert alert-info">
        Please select an active tenant from the header switcher to view stores.
      </div>
    );
  }

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
            Stores & Branches
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Physical retail stores and branches belonging to{' '}
            <strong>{tenantContext.name}</strong>
          </p>
        </div>

        {canCreateStore && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Add Store Branch
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Stores Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch Code</th>
                <th>Store Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Active Context</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading stores...
                  </td>
                </tr>
              ) : storesList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    No stores found in this tenant.
                  </td>
                </tr>
              ) : (
                storesList.map((s) => {
                  const isActive = storeContext?.id === s.id;
                  return (
                    <tr key={s.id}>
                      <td>
                        <code>{s.code}</code>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        {s.isMainBranch ? (
                          <span className="badge badge-primary">Main Branch</span>
                        ) : (
                          <span className="badge badge-neutral">Branch</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {s.phone || s.email || '—'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td>
                        {isActive ? (
                          <span className="badge badge-success">Selected Branch</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!isActive && (
                          <button
                            onClick={() => handleSwitchStore(s.id)}
                            className="btn btn-secondary btn-sm"
                          >
                            Switch To
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

      {/* Create Store Modal */}
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
              Add Store Branch
            </h3>

            {formError && (
              <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
                <span>⚠️</span> {formError}
              </div>
            )}

            <form onSubmit={handleCreateStore}>
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Super Optical Fraser Road Branch"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Store Branch Code (Uppercase)</label>
                <input
                  type="text"
                  className="form-control"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="PATNA-03"
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
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="branch@superoptical.com"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="mainBranchCheck"
                  checked={isMainBranch}
                  onChange={(e) => setIsMainBranch(e.target.checked)}
                />
                <label htmlFor="mainBranchCheck" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Mark as Main Branch
                </label>
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
                  Create Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
