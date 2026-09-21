import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundView: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
        404 — Page Not Found
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px auto' }}>
        The page you are looking for does not exist or has been relocated.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
};
