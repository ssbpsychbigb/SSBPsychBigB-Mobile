/**
 * Minimal client validation for rejected-application resubmit.
 * Only flagged fields are checked; uploads must be new files.
 */

import { normalizeMobileNumber } from '@/features/auth/lib/format-mobile';
import type { RejectionFieldCode } from '@/features/auth/lib/rejection-fields';
import type { ExamGoalValue } from '@/features/auth/constants/exam-goals';
import type { PickedAsset } from '@/features/auth/types/register-form';

export type ResubmitFormValues = {
  fullName: string;
  email: string;
  mobileNumber: string;
  instituteName: string;
  instituteLogo: PickedAsset | null;
  officerPhoto: PickedAsset | null;
  officerIdDocument: PickedAsset | null;
  examGoals: ExamGoalValue[];
  profilePhoto: PickedAsset | null;
  idDocument: PickedAsset | null;
};

/** Baseline values from the rejected profile (used to require a real fix). */
export type ResubmitBaseline = {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  instituteName?: string;
};

export type ResubmitFieldErrors = Partial<
  Record<RejectionFieldCode | 'form', string>
>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

function requireFixedText(
  current: string,
  previous: string | undefined,
  emptyMessage: string,
  unchangedMessage: string,
  minLength = 2,
): string | undefined {
  const trimmed = current.trim();
  if (trimmed.length < minLength) {
    return emptyMessage;
  }

  const prior = (previous || '').trim();
  if (prior.length > 0 && trimmed === prior) {
    return unchangedMessage;
  }

  return undefined;
}

/**
 * Validates only flagged resubmit fields. Returns field → message map.
 */
export function validateResubmitForm(
  flagged: Iterable<RejectionFieldCode>,
  values: ResubmitFormValues,
  baseline: ResubmitBaseline = {},
): ResubmitFieldErrors {
  const flaggedSet = flagged instanceof Set ? flagged : new Set(flagged);
  const next: ResubmitFieldErrors = {};

  if (flaggedSet.has('fullName')) {
    const message = requireFixedText(
      values.fullName,
      baseline.fullName,
      'Enter your full name.',
      'Update your full name before resubmitting.',
    );
    if (message) {
      next.fullName = message;
    }
  }

  if (flaggedSet.has('email')) {
    const email = values.email.trim();
    if (!email || !EMAIL_RE.test(email)) {
      next.email = 'Enter a valid email address.';
    } else if (
      (baseline.email || '').trim().length > 0 &&
      email === (baseline.email || '').trim()
    ) {
      next.email = 'Update your email before resubmitting.';
    }
  }

  if (flaggedSet.has('mobileNumber')) {
    const mobile = normalizeMobileNumber(values.mobileNumber);
    const baselineMobile = normalizeMobileNumber(baseline.mobileNumber || '');
    if (!MOBILE_RE.test(mobile)) {
      next.mobileNumber = 'Enter a valid 10-digit Indian mobile number.';
    } else if (baselineMobile.length === 10 && mobile === baselineMobile) {
      next.mobileNumber = 'Update your mobile number before resubmitting.';
    }
  }

  if (flaggedSet.has('instituteName')) {
    const message = requireFixedText(
      values.instituteName,
      baseline.instituteName,
      'Enter the institute name.',
      'Update the institute name before resubmitting.',
    );
    if (message) {
      next.instituteName = message;
    }
  }

  if (flaggedSet.has('instituteLogo') && !values.instituteLogo?.uri) {
    next.instituteLogo = 'Upload a new institute logo.';
  }
  if (flaggedSet.has('officerPhoto') && !values.officerPhoto?.uri) {
    next.officerPhoto = 'Upload a new officer photo.';
  }
  if (flaggedSet.has('officerIdDocument') && !values.officerIdDocument?.uri) {
    next.officerIdDocument = 'Upload a new ID document.';
  }
  if (flaggedSet.has('examGoals') && values.examGoals.length === 0) {
    next.examGoals = 'Select at least one exam.';
  }
  if (flaggedSet.has('profilePhoto') && !values.profilePhoto?.uri) {
    next.profilePhoto = 'Upload a new profile photo.';
  }
  if (flaggedSet.has('idDocument') && !values.idDocument?.uri) {
    next.idDocument = 'Upload a new ID document.';
  }

  if (Object.keys(next).length > 0) {
    next.form = 'Fix the highlighted fields before resubmitting.';
  }

  return next;
}
