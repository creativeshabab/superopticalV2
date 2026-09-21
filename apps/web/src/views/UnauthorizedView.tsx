import React from 'react';
import { Link } from 'react-router-dom';

export const UnauthorizedView: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚫</div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
        403 — Access Forbidden
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px auto' }}>
        You do not have the required permissions or membership to access this resource or tenant context.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
};
