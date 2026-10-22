/**
 * Display helpers for assessment kinds, clocks, and prices.
 */

export const ASMT_KIND_OPTIONS = [
  { value: 'practice', label: 'Practice' },
  { value: 'subject', label: 'Subject test' },
  { value: 'mock', label: 'Full mock' },
  { value: 'oir', label: 'OIR' },
  { value: 'wat', label: 'WAT' },
  { value: 'srt', label: 'SRT' },
  { value: 'ppdt', label: 'PPDT' },
  { value: 'tat', label: 'TAT' },
] as const;

export function asmtKindLabel(kind: string) {
  return ASMT_KIND_OPTIONS.find((item) => item.value === kind)?.label || 'Test';
}

export function asmtStatusLabel(status: string) {
  if (status === 'in_progress') return 'In progress';
  if (status === 'submitted') return 'Submitted';
  if (status === 'auto_submitted') return 'Time expired';
  if (status === 'pending_grade') return 'Under evaluation';
  if (status === 'graded') return 'Graded';
  return 'Saved';
}

export function formatAssessmentPrice(priceInr: number) {
  if (!Number.isFinite(priceInr) || priceInr <= 0) {
    return 'Free';
  }
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(priceInr);
  } catch {
    return `₹${Math.round(priceInr)}`;
  }
}

export function formatAssessmentDuration(durationSec: number) {
  if (!durationSec || durationSec <= 0) {
    return 'Untimed';
  }
  const minutes = Math.max(1, Math.round(durationSec / 60));
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatSpent(sec: number) {
  const safe = Math.max(0, Math.round(Number(sec) || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes <= 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

export function topicStatusLabel(status: string) {
  if (status === 'strong') return 'Strong';
  if (status === 'weak') return 'Weak';
  return 'Steady';
}
