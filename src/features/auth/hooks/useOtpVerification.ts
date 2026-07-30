/**
 * OTP verification UI state — countdown + store-backed API actions.
 */

import { useCallback, useEffect, useState } from 'react';

import type { AuthSessionResult } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  OTP_LENGTH,
  OTP_RESEND_COOLDOWN_SECONDS,
  type OtpFormErrors,
  type OtpPurpose,
} from '@/features/auth/types/otp';
import { ApiError } from '@/shared/api/types';
import { showToast } from '@/shared/ui/toast';

export type UseOtpVerificationOptions = {
  mobileNumber: string;
  purpose: OtpPurpose;
  initialDebugOtp?: string;
  onVerified?: (session: AuthSessionResult) => void | Promise<void>;
};

/**
 * Manages OTP entry, resend cooldown, and store API verification.
 */
export function useOtpVerification({
  mobileNumber,
  purpose,
  onVerified,
  initialDebugOtp,
}: UseOtpVerificationOptions) {
  const verifyOtpCode = useAuthStore((state) => state.verifyOtpCode);
  const resendOtpCode = useAuthStore((state) => state.resendOtpCode);
  const isVerifyingOtp = useAuthStore((state) => state.isVerifyingOtp);
  const isSendingOtp = useAuthStore((state) => state.isSendingOtp);
  const otpContext = useAuthStore((state) => state.otpContext);

  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<OtpFormErrors>({});
  const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const [isAttemptsExhausted, setIsAttemptsExhausted] = useState(false);
  const [focusRequestId, setFocusRequestId] = useState(0);
  const [debugOtpHint, setDebugOtpHint] = useState<string | undefined>(
    initialDebugOtp,
  );

  useEffect(() => {
    if (otpContext?.debugOtp) {
      setDebugOtpHint(otpContext.debugOtp);
    }
  }, [otpContext?.debugOtp]);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const requestOtpFocus = useCallback(() => {
    setFocusRequestId((prev) => prev + 1);
  }, []);

  const handleOtpChange = useCallback((nextOtp: string) => {
    setOtp(nextOtp);
    setErrors((prev) => ({ ...prev, otp: undefined, submit: undefined }));
  }, []);

  const verifyOtp = useCallback(
    async (code = otp) => {
      if (isVerifyingOtp || isAttemptsExhausted) {
        return;
      }

      if (code.length !== OTP_LENGTH) {
        const message = `Enter the ${OTP_LENGTH}-digit OTP sent to your mobile.`;
        setErrors({ otp: message });
        showToast.warning('Incomplete OTP', message);
        requestOtpFocus();
        return;
      }

      setErrors({});

      try {
        const session = await verifyOtpCode({
          mobileNumber,
          otp: code,
          purpose,
        });
        showToast.success('Verified', 'You are signed in.');
        await onVerified?.(session);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : 'Unable to verify OTP right now. Please try again.';

        if (error instanceof ApiError && error.code === 'ACCOUNT_BLOCKED') {
          setOtp('');
          setErrors({ submit: message });
          showToast.error('Account blocked', message);
          return;
        }

        if (error instanceof ApiError && error.code === 'OTP_MAX_ATTEMPTS') {
          setOtp('');
          setIsAttemptsExhausted(true);
          setErrors({ submit: message });
          setCooldown(0);
          showToast.error('Too many attempts', message);
          return;
        }

        if (error instanceof ApiError && error.code === 'OTP_INVALID') {
          setOtp('');
          setErrors({ otp: message });
          showToast.error('Invalid OTP', message);
          requestOtpFocus();
          return;
        }

        if (
          error instanceof ApiError &&
          (error.code === 'OTP_EXPIRED' || error.code === 'OTP_NOT_FOUND')
        ) {
          setOtp('');
          setIsAttemptsExhausted(true);
          setErrors({ submit: message });
          setCooldown(0);
          showToast.error('OTP expired', message);
          return;
        }

        setErrors({ submit: message });
        showToast.error('Verification failed', message);
        requestOtpFocus();
      }
    },
    [
      isAttemptsExhausted,
      isVerifyingOtp,
      mobileNumber,
      onVerified,
      otp,
      purpose,
      requestOtpFocus,
      verifyOtpCode,
    ],
  );

  const resendOtp = useCallback(async () => {
    const canForceResend = isAttemptsExhausted;

    if ((!canForceResend && cooldown > 0) || isSendingOtp) {
      return;
    }

    setErrors({});

    try {
      const result = await resendOtpCode({
        mobileNumber,
        purpose,
      });
      setOtp('');
      setIsAttemptsExhausted(false);
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setDebugOtpHint(result.debugOtp);
      requestOtpFocus();
      showToast.success(
        'OTP resent',
        result.emailSent
          ? 'A new code was sent to your email.'
          : 'Check your messages for a new code.',
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not resend OTP. Please try again.';
      setErrors({ submit: message });
      showToast.error('Resend failed', message);
    }
  }, [
    cooldown,
    isAttemptsExhausted,
    isSendingOtp,
    mobileNumber,
    purpose,
    requestOtpFocus,
    resendOtpCode,
  ]);

  return {
    otp,
    errors,
    isVerifying: isVerifyingOtp,
    isResending: isSendingOtp,
    cooldown,
    canResend: (isAttemptsExhausted || cooldown === 0) && !isSendingOtp,
    isAttemptsExhausted,
    focusRequestId,
    debugOtpHint,
    handleOtpChange,
    verifyOtp,
    resendOtp,
  };
}
