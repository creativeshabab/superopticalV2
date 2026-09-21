import React from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';

export const HeaderSwitcher: React.FC = () => {
  const {
    tenantContext,
    storeContext,
    availableTenants,
    availableStores,
    setTenant,
    setStore,
  } = useAuthStore();

  const handleTenantChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetTenantId = e.target.value;
    if (!targetTenantId) return;

    try {
      const res = await api.post(`/tenants/${targetTenantId}/switch`);
      if (res && res.tenantContext) {
        setTenant(res.tenantContext);
        // Refresh stores list for newly selected tenant
        const storesList = await api.get('/stores');
        useAuthStore.setState({ availableStores: storesList });
        if (storesList && storesList.length > 0) {
          setStore({
            id: storesList[0].id,
            code: storesList[0].code,
            name: storesList[0].name,
            tenantId: storesList[0].tenantId,
          });
        }
      }
    } catch (err: any) {
      alert(`Failed to switch tenant: ${err.message}`);
    }
  };

  const handleStoreChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetStoreId = e.target.value;
    if (!targetStoreId) return;

    try {
      const res = await api.post(`/stores/${targetStoreId}/switch`);
      if (res && res.storeContext) {
        setStore(res.storeContext);
      }
    } catch (err: any) {
      alert(`Failed to switch store: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* Tenant Context Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Tenant:
        </span>
        <select
          value={tenantContext?.id || ''}
          onChange={handleTenantChange}
          style={{
            padding: '6px 12px',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            backgroundColor: '#f8fafc',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          {availableTenants.length === 0 && (
            <option value="">No Active Tenant</option>
          )}
          {availableTenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.slug})
            </option>
          ))}
        </select>
      </div>

      {/* Store Context Selector */}
      {tenantContext && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Store:
          </span>
          <select
            value={storeContext?.id || ''}
            onChange={handleStoreChange}
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: '#f8fafc',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            {availableStores.length === 0 && (
              <option value="">No Assigned Store</option>
            )}
            {availableStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
