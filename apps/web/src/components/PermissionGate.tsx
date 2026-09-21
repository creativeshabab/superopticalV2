import React from 'react';
import { useAuthStore } from '../store/authStore';

interface PermissionGateProps {
  permissions: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permissions: requiredPermissions,
  requireAll = false,
  children,
  fallback = null,
}) => {
  const { user, permissions } = useAuthStore();

  if (user?.isPlatformAdmin) {
    return <>{children}</>;
  }

  const hasPermission = requireAll
    ? requiredPermissions.every((p) => permissions.includes(p))
    : requiredPermissions.some((p) => permissions.includes(p));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
