import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';

export const TenantsView: React.FC = () => {
  const { user, tenantContext, setTenant, setStore } = useAuthStore();
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New tenant form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [code, setCode] = useState('');
  const [planTier, setPlanTier] = useState('Starter');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/tenants');
      setTenantsList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleSwitchTenant = async (targetTenantId: string) => {
    try {
      const res = await api.post(`/tenants/${targetTenantId}/switch`);
      if (res && res.tenantContext) {
        setTenant(res.tenantContext);
        const stores = await api.get('/stores');
        useAuthStore.setState({ availableStores: stores });
        if (stores.length > 0) {
          setStore({
            id: stores[0].id,
            code: stores[0].code,
            name: stores[0].name,
            tenantId: stores[0].tenantId,
          });
        }
        fetchTenants();
      }
    } catch (err: any) {
      alert(`Error switching tenant: ${err.message}`);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.post('/tenants', {
        name,
        slug,
        code,
        planTier,
      });
      setShowCreateModal(false);
      setName('');
      setSlug('');
      setCode('');
      fetchTenants();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create tenant');
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
            Tenants
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Optical business enterprise accounts & organizational boundaries
          </p>
        </div>

        {user?.isPlatformAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Create New Tenant
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Tenants Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Slug</th>
                <th>Code</th>
                <th>Plan Tier</th>
                <th>Status</th>
                <th>Context Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading tenants...
                  </td>
                </tr>
              ) : tenantsList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    No accessible tenants found.
                  </td>
                </tr>
              ) : (
                tenantsList.map((t) => {
                  const isActiveContext = tenantContext?.id === t.id;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td>
                        <code>{t.slug}</code>
                      </td>
                      <td>
                        <code>{t.code}</code>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{t.planTier || 'Starter'}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            t.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td>
                        {isActiveContext ? (
                          <span className="badge badge-primary">Active Selection</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!isActiveContext && (
                          <button
                            onClick={() => handleSwitchTenant(t.id)}
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

      {/* Create Tenant Modal */}
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
              Create Optical Tenant
            </h3>

            {formError && (
              <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
                <span>⚠️</span> {formError}
              </div>
            )}

            <form onSubmit={handleCreateTenant}>
              <div className="form-group">
                <label className="form-label">Business / Tenant Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  placeholder="Super Optical Delhi"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Slug (Lowercase alphanumeric)</label>
                <input
                  type="text"
                  className="form-control"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="super-optical-delhi"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tenant Code (Uppercase)</label>
                <input
                  type="text"
                  className="form-control"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SOD"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Plan Tier</label>
                <select
                  className="form-control"
                  value={planTier}
                  onChange={(e) => setPlanTier(e.target.value)}
                >
                  <option value="Starter">Starter</option>
                  <option value="Growth">Growth</option>
                  <option value="Enterprise">Enterprise</option>
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
                  Create Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
