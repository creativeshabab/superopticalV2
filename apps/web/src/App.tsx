import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginView } from './views/LoginView';
import { DashboardHomeView } from './views/DashboardHomeView';
import { TenantsView } from './views/TenantsView';
import { StoresView } from './views/StoresView';
import { UsersView } from './views/UsersView';
import { AuditLogView } from './views/AuditLogView';
import { UnauthorizedView } from './views/UnauthorizedView';
import { NotFoundView } from './views/NotFoundView';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/403" element={<UnauthorizedView />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardHomeView />} />
            <Route path="/tenants" element={<TenantsView />} />
            <Route path="/stores" element={<StoresView />} />
            <Route path="/users" element={<UsersView />} />
            <Route path="/audit" element={<AuditLogView />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundView />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
