/**
 * App-portal auth store — session + OTP/register API actions (Zustand).
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  authApi,
  type AuthSessionResult,
  type OtpChallengeResult,
} from '@/features/auth/api/auth.api';
import { skipAuthSplashOnNextEntry } from '@/features/auth/lib/auth-entry';
import { normalizeMobileNumber } from '@/features/auth/lib/format-mobile';
import type { AuthUser } from '@/features/auth/types/auth.types';
import type { OtpPurpose, RegisterJoinTypeForOtp } from '@/features/auth/types/otp';
import type { RegisterFormValues } from '@/features/auth/types/register-form';
import { ApiError } from '@/shared/api/types';
import { StorageKeys } from '@/shared/constants/storage-keys';
import { zustandStorage } from '@/shared/storage/zustand-storage';

export type OtpContext = {
  mobileNumber: string;
  purpose: OtpPurpose;
  joinType?: RegisterJoinTypeForOtp;
  debugOtp?: string;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  otpContext: OtpContext | null;
  isSendingOtp: boolean;
  isRegistering: boolean;
  isVerifyingOtp: boolean;
  authError: string | null;
  setSession: (session: { accessToken: string; user: AuthUser }) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
  clearAuthError: () => void;
  setOtpContext: (context: OtpContext | null) => void;
  sendLoginOtp: (mobileNumber: string) => Promise<OtpChallengeResult>;
  registerAccount: (values: RegisterFormValues) => Promise<OtpChallengeResult>;
  verifyOtpCode: (input: {
    mobileNumber: string;
    otp: string;
    purpose: OtpPurpose;
  }) => Promise<AuthSessionResult>;
  resendOtpCode: (input: {
    mobileNumber: string;
    purpose: OtpPurpose;
  }) => Promise<OtpChallengeResult>;
};

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/**
 * Persists only the authenticated session; API flags stay ephemeral.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      otpContext: null,
      isSendingOtp: false,
      isRegistering: false,
      isVerifyingOtp: false,
      authError: null,

      setSession: ({ accessToken, user }) =>
        set({ accessToken, user, authError: null }),

      setUser: (user) => set({ user }),

      clearSession: () => {
        // * Next Auth stack mount should open Login, not the launch splash.
        skipAuthSplashOnNextEntry();
        set({
          accessToken: null,
          user: null,
          otpContext: null,
          authError: null,
        });
      },

      clearAuthError: () => set({ authError: null }),

      setOtpContext: (otpContext) => set({ otpContext }),

      sendLoginOtp: async (mobileNumber) => {
        const normalized = normalizeMobileNumber(mobileNumber);
        set({ isSendingOtp: true, authError: null });

        try {
          const result = await authApi.sendOtp({
            mobileNumber: normalized,
            purpose: 'login',
          });

          set({
            isSendingOtp: false,
            otpContext: {
              mobileNumber: normalized,
              purpose: 'login',
              debugOtp: result.debugOtp,
            },
          });

          return result;
        } catch (error) {
          const message = toErrorMessage(
            error,
            'Unable to send OTP. Please try again.',
          );
          set({ isSendingOtp: false, authError: message });
          throw error;
        }
      },

      registerAccount: async (values) => {
        set({ isRegistering: true, authError: null });

        try {
          const result = await authApi.register({
            ...values,
            mobileNumber: normalizeMobileNumber(values.mobileNumber),
          });

          set({
            isRegistering: false,
            otpContext: {
              mobileNumber: normalizeMobileNumber(values.mobileNumber),
              purpose: 'register',
              joinType: values.joinType,
              debugOtp: result.debugOtp,
            },
          });

          return result;
        } catch (error) {
          const message = toErrorMessage(
            error,
            'Unable to start registration. Please try again.',
          );
          set({ isRegistering: false, authError: message });
          throw error;
        }
      },

      verifyOtpCode: async (input) => {
        set({ isVerifyingOtp: true, authError: null });

        try {
          const session = await authApi.verifyOtp({
            mobileNumber: normalizeMobileNumber(input.mobileNumber),
            otp: input.otp,
            purpose: input.purpose,
          });

          set({
            isVerifyingOtp: false,
            accessToken: session.accessToken,
            user: session.user,
            otpContext: null,
            authError: null,
          });

          return session;
        } catch (error) {
          const message = toErrorMessage(
            error,
            'Unable to verify OTP right now. Please try again.',
          );
          set({ isVerifyingOtp: false, authError: message });
          throw error;
        }
      },

      resendOtpCode: async (input) => {
        const context = get().otpContext;
        set({ isSendingOtp: true, authError: null });

        try {
          const result = await authApi.sendOtp({
            mobileNumber: normalizeMobileNumber(input.mobileNumber),
            purpose: input.purpose,
          });

          set({
            isSendingOtp: false,
            otpContext: {
              mobileNumber: normalizeMobileNumber(input.mobileNumber),
              purpose: input.purpose,
              joinType: context?.joinType,
              debugOtp: result.debugOtp,
            },
          });

          return result;
        } catch (error) {
          const message = toErrorMessage(
            error,
            'Could not resend OTP. Please try again.',
          );
          set({ isSendingOtp: false, authError: message });
          throw error;
        }
      },
    }),
    {
      name: StorageKeys.AUTH_SESSION,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
