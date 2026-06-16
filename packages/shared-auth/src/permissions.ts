import { UserRole } from '@shared/types';

export type Permission =
  | 'manage:users'
  | 'manage:company'
  | 'manage:billing'
  | 'view:analytics'
  | 'access:admin'
  | 'manage:agents'
  | 'manage:tickets'
  | 'manage:conversations'
  | 'manage:knowledge-base'
  | 'manage:settings'
  | 'view:reports'
  | 'export:data'
  | 'manage:integrations'
  | 'manage:webhooks';

const permissionMatrix: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    'manage:users',
    'manage:company',
    'manage:billing',
    'view:analytics',
    'access:admin',
    'manage:agents',
    'manage:tickets',
    'manage:conversations',
    'manage:knowledge-base',
    'manage:settings',
    'view:reports',
    'export:data',
    'manage:integrations',
    'manage:webhooks',
  ],
  [UserRole.COMPANY_OWNER]: [
    'manage:users',
    'manage:company',
    'manage:billing',
    'view:analytics',
    'access:admin',
    'manage:agents',
    'manage:tickets',
    'manage:conversations',
    'manage:knowledge-base',
    'manage:settings',
    'view:reports',
    'export:data',
    'manage:integrations',
    'manage:webhooks',
  ],
  [UserRole.TEAM_MANAGER]: [
    'manage:users',
    'view:analytics',
    'manage:agents',
    'manage:tickets',
    'manage:conversations',
    'manage:knowledge-base',
    'view:reports',
    'export:data',
  ],
  [UserRole.SUPPORT_AGENT]: [
    'manage:tickets',
    'manage:conversations',
    'manage:knowledge-base',
    'view:reports',
  ],
  [UserRole.CUSTOMER]: [
    'manage:conversations',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = permissionMatrix[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, 'manage:users');
}

export function canManageCompany(role: UserRole): boolean {
  return hasPermission(role, 'manage:company');
}

export function canManageBilling(role: UserRole): boolean {
  return hasPermission(role, 'manage:billing');
}

export function canViewAnalytics(role: UserRole): boolean {
  return hasPermission(role, 'view:analytics');
}

export function canAccessAdmin(role: UserRole): boolean {
  return hasPermission(role, 'access:admin');
}

export function canManageAgents(role: UserRole): boolean {
  return hasPermission(role, 'manage:agents');
}

export function canManageTickets(role: UserRole): boolean {
  return hasPermission(role, 'manage:tickets');
}

export function canExportData(role: UserRole): boolean {
  return hasPermission(role, 'export:data');
}

export { permissionMatrix };
