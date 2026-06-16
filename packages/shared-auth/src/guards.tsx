import React, { type ReactNode } from 'react';
import { UserRole } from '@shared/types';
import { useAuth } from './auth-context';
import { hasPermission, type Permission } from './permissions';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (!allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (!hasPermission(user.role, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
