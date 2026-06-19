import { UserRole } from '@/app/generated/prisma/enums';

export { UserRole };

export const USER_ROLES = Object.values(UserRole);

export function isUserRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export function getUserRoles(role?: string | null): UserRole[] {
  if (!role) {
    return [UserRole.customer];
  }

  const roles = role
    .split(',')
    .map((value) => value.trim())
    .filter(isUserRole);

  return roles.length > 0 ? roles : [UserRole.customer];
}

export function hasRole(
  role: string | null | undefined,
  allowedRoles: readonly UserRole[],
) {
  return getUserRoles(role).some((userRole) => allowedRoles.includes(userRole));
}

export function isStaff(role?: string | null) {
  return hasRole(role, [UserRole.staff, UserRole.admin]);
}

export function isAdmin(role?: string | null) {
  return hasRole(role, [UserRole.admin]);
}
