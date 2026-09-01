/**
 * Email verification send / OTP confirm for the signed-in session.
 */

import { useCallback, useEffect, useState } from 'react';

import {
  authApi,
  type EmailVerificationSendResult,
} from '@/features/auth/api/auth.api';
import {
  EMAIL_VERIFY_OTP_LENGTH,
  EMAIL_VERIFY_RESEND_COOLDOWN_SECONDS,
} from '@/features/auth/constants/email-verification';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ApiError } from '@/shared/api/types';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type UseEmailVerificationResult = {
  otp: string;
  cooldown: number;
  isSending: boolean;
  isVerifying: boolean;
  /** True once a verification email was issued and send is not in flight. */
  canEnterOtp: boolean;
  canResend: boolean;
  error: string | undefined;
  sendError: string | undefined;
  debugOtp: string | undefined;
  lastSend: EmailVerificationSendResult | null;
  handleOtpChange: (next: string) => void;
  sendVerification: (options?: { silent?: boolean }) => Promise<boolean>;
  verifyOtp: (code?: string) => Promise<boolean>;
  resetSession: () => void;
};

function cooldownFromError(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.code !== 'EMAIL_VERIFY_COOLDOWN') {
    return null;
  }

  const details = error.details as { retryAfter?: number } | undefined;
  const retryAfter = Number(details?.retryAfter);
  return Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
}

/**
 * Manages the verify-email sheet: send, resend cooldown, and OTP submit.
 */
export function useEmailVerification(): UseEmailVerificationResult {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sendError, setSendError] = useState<string | undefined>();
  const [debugOtp, setDebugOtp] = useState<string | undefined>();
  const [lastSend, setLastSend] = useState<EmailVerificationSendResult | null>(
    null,
  );

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = useCallback((next: string) => {
    setOtp(next);
    setError(undefined);
  }, []);

  const resetSession = useCallback(() => {
    setOtp('');
    setError(undefined);
    setSendError(undefined);
    setDebugOtp(undefined);
    setLastSend(null);
  }, []);

  const sendVerification = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!accessToken || isSending) {
        return false;
      }

      setIsSending(true);
      setError(undefined);
      setSendError(undefined);

      try {
        const result = await authApi.sendEmailVerification(accessToken);
        setLastSend(result);

        if (result.alreadyVerified && result.user) {
          setUser(result.user);
          showToast.success('Email already verified');
          return true;
        }

        setDebugOtp(result.debugOtp);
        setCooldown(
          result.cooldownSeconds || EMAIL_VERIFY_RESEND_COOLDOWN_SECONDS,
        );

        if (!options?.silent) {
          showToast.success(
            result.emailSent ? 'Check your email' : 'Verification code ready',
            result.emailSent
              ? `We sent a link and a ${EMAIL_VERIFY_OTP_LENGTH}-digit code to ${result.maskedEmail}.`
              : 'Enter the code shown below while email delivery is offline.',
          );
        }

        return true;
      } catch (err) {
        const retryAfter = cooldownFromError(err);
        if (retryAfter) {
          setCooldown(retryAfter);
        }

        const message =
          err instanceof ApiError
            ? err.message
            : 'Could not send the verification email.';
        setSendError(message);

        if (!options?.silent) {
          showErrorToast(err, message);
        }

        return false;
      } finally {
        setIsSending(false);
      }
    },
    [accessToken, isSending, setUser],
  );

  const verifyOtp = useCallback(
    async (code = otp) => {
      if (!accessToken || isVerifying) {
        return false;
      }

      if (code.length !== EMAIL_VERIFY_OTP_LENGTH) {
        const message = `Enter the ${EMAIL_VERIFY_OTP_LENGTH}-digit code from your email.`;
        setError(message);
        showToast.error('Code required', message);
        return false;
      }

      setIsVerifying(true);
      setError(undefined);

      try {
        const result = await authApi.verifyEmailOtp(accessToken, code);
        setUser(result.user);
        showToast.success(
          result.alreadyVerified ? 'Email already verified' : 'Email verified',
          'Thanks — your inbox is confirmed.',
        );
        setOtp('');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Could not verify that code. Try again.';
        setError(message);
        showErrorToast(err, message);
        setOtp('');
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [accessToken, isVerifying, otp, setUser],
  );

  return {
    otp,
    cooldown,
    isSending,
    isVerifying,
    canEnterOtp: Boolean(lastSend) && !isSending,
    canResend: cooldown <= 0 && !isSending,
    error,
    sendError,
    debugOtp,
    lastSend,
    handleOtpChange,
    sendVerification,
    verifyOtp,
    resetSession,
  };
}
