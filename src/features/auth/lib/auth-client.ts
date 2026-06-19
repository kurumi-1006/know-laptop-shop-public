import { createAuthClient } from 'better-auth/react';
import { adminClient, emailOTPClient } from 'better-auth/client/plugins';
import { accessControl, authRoles } from '@/features/auth/lib/auth-permissions';

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac: accessControl,
      roles: authRoles,
    }),
    emailOTPClient(),
  ],
});
