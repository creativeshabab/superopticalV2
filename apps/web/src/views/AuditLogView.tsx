import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';

export const AuditLogView: React.FC = () => {
  const { tenantContext, user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/audit/logs?limit=100');
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tenantContext?.id]);

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
            Audit Trail & Security Events
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Immutable synchronous audit records of all system operations, authentications, and role modifications
          </p>
        </div>

        <button onClick={fetchLogs} className="btn btn-secondary btn-sm">
          🔄 Refresh Logs
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Resource ID</th>
                <th>IP Address</th>
                <th>Actor / User</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    No audit logs recorded for this context.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isAuth = log.action.includes('AUTH') || log.action.includes('LOGIN');
                  const isCritical =
                    log.action.includes('REUSE') ||
                    log.action.includes('REVOKE') ||
                    log.action.includes('STATUS');

                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isCritical
                              ? 'badge-danger'
                              : isAuth
                              ? 'badge-primary'
                              : 'badge-neutral'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <code>{log.resource}</code>
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>
                        <code>{log.resourceId ? `${log.resourceId.slice(0, 8)}...` : '—'}</code>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {log.userId ? (
                          <code>{log.userId === user?.id ? 'Current User' : log.userId.slice(0, 8)}</code>
                        ) : (
                          'System'
                        )}
                      </td>
                      <td style={{ fontSize: '0.75rem', maxWidth: '300px' }}>
                        <code style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {JSON.stringify(log.metadata || {})}
                        </code>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
