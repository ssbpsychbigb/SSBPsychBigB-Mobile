/**
 * Labels for public profile defence / about rows.
 */

import { EXAM_GOAL_OPTIONS } from '@/features/auth/constants/exam-goals';

const PREPARATION_STAGE_OPTIONS = [
  { value: 'exploring', label: 'Exploring' },
  { value: 'written_prep', label: 'Written preparation' },
  { value: 'ssb_prep', label: 'SSB preparation' },
  { value: 'ssb_attended', label: 'SSB attended' },
  { value: 'conference_out', label: 'Conference out' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'medical', label: 'Medical' },
  { value: 'joining', label: 'Joining' },
  { value: 'officer', label: 'Serving officer' },
  { value: 'mentor', label: 'Mentor' },
] as const;

const SERVICE_OPTIONS = [
  { value: 'army', label: 'Army' },
  { value: 'navy', label: 'Navy' },
  { value: 'air_force', label: 'Air Force' },
  { value: 'coast_guard', label: 'Coast Guard' },
  { value: 'undecided', label: 'Undecided' },
] as const;

function labelOf(
  options: ReadonlyArray<{ value: string; label: string }>,
  value?: string,
): string {
  if (!value) {
    return '';
  }
  return options.find((option) => option.value === value)?.label || value;
}

export function examGoalDisplay(value?: string): string {
  return labelOf(EXAM_GOAL_OPTIONS, value);
}

export function serviceDisplay(value?: string): string {
  return labelOf(SERVICE_OPTIONS, value);
}

export function stageDisplay(value?: string): string {
  return labelOf(PREPARATION_STAGE_OPTIONS, value);
}

export function formatMilestoneDate(iso?: string): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const ACHIEVEMENT_CATEGORY_OPTIONS = [
  { value: 'ncc', label: 'NCC' },
  { value: 'sports', label: 'Sports' },
  { value: 'olympiad', label: 'Olympiad' },
  { value: 'award', label: 'Award' },
  { value: 'school_captain', label: 'School captain' },
  { value: 'best_cadet', label: 'Best cadet' },
  { value: 'marathon', label: 'Marathon' },
  { value: 'debate', label: 'Debate' },
  { value: 'other', label: 'Other' },
] as const;

export function achievementCategoryDisplay(value?: string): string {
  return labelOf(ACHIEVEMENT_CATEGORY_OPTIONS, value);
}
