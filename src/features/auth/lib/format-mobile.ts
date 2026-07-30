/**
 * Mobile display helpers for auth screens.
 */

/**
 * Keeps only the last 10 digits from a mobile input.
 */
export function normalizeMobileNumber(mobileNumber: string): string {
  return mobileNumber.replace(/\D/g, '').slice(-10);
}

/**
 * Masks an Indian mobile number for OTP screens.
 */
export function maskMobileNumber(mobileNumber: string): string {
  const digits = normalizeMobileNumber(mobileNumber);

  if (digits.length !== 10) {
    return '+91 ••••••••••';
  }

  return `+91 ••••••${digits.slice(-4)}`;
}

/**
 * Returns true when the value is a valid 10-digit Indian mobile number.
 */
export function isValidIndianMobile(mobileNumber: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeMobileNumber(mobileNumber));
}
