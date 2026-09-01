/**
 * Email verification chrome — banner + sheet for signed-in destinations.
 */

import { useState } from 'react';

import { EmailVerificationBanner } from '@/features/auth/components/EmailVerificationBanner';
import { EmailVerificationSheet } from '@/features/auth/components/EmailVerificationSheet';
import { useEmailVerification } from '@/features/auth/hooks/useEmailVerification';
import { needsEmailVerification } from '@/features/auth/lib/mask-email';
import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Renders the verify-email reminder when the signed-in user is unverified.
 */
export function EmailVerificationHost() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const verification = useEmailVerification();
  const [open, setOpen] = useState(false);

  if (!accessToken || !needsEmailVerification(user) || !user) {
    return null;
  }

  return (
    <>
      <EmailVerificationBanner
        email={user.email}
        onVerify={() => {
          setOpen(true);
          void verification.sendVerification();
        }}
      />
      <EmailVerificationSheet
        email={user.email}
        onClose={() => {
          setOpen(false);
          verification.resetSession();
        }}
        verification={verification}
        visible={open}
      />
    </>
  );
}
