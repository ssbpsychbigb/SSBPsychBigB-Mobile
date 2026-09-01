/**
 * Exam goals available during registration onboarding.
 */

export const EXAM_GOAL_OPTIONS = [
  { value: 'nda', label: 'NDA' },
  { value: 'cds', label: 'CDS' },
  { value: 'afcat', label: 'AFCAT' },
  { value: 'ssb', label: 'SSB Interview' },
  { value: 'capf', label: 'CAPF' },
  { value: 'agniveer', label: 'Agniveer' },
  { value: 'inet', label: 'INET' },
  { value: 'other', label: 'Other / Exploring' },
] as const;

export type ExamGoalValue = (typeof EXAM_GOAL_OPTIONS)[number]['value'];
