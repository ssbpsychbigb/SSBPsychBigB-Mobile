/**
 * OTP verification contracts (web parity).
 */

export type OtpPurpose = 'login' | 'register';

export type RegisterJoinTypeForOtp =
  | 'aspirant'
  | 'institute'
  | 'defence_officer'
  | 'educator';

export type OtpFormErrors = {
  otp?: string;
  submit?: string;
};

export const OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
