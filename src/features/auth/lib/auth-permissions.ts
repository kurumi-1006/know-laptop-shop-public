import { createAccessControl } from 'better-auth/plugins/access';
import { UserRole } from '@/lib/roles';

export const permissions = {
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'delete',
    'set-password',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
} as const;

export const accessControl = createAccessControl(permissions);

export const customerRole = accessControl.newRole({
  user: [],
  session: [],
});

export const staffRole = accessControl.newRole({
  user: ['list', 'get', 'update'],
  session: ['list'],
});

export const adminRole = accessControl.newRole({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'delete',
    'set-password',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
});

export const authRoles = {
  [UserRole.customer]: customerRole,
  [UserRole.staff]: staffRole,
  [UserRole.admin]: adminRole,
};
