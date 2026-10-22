/**
 * Catalogue filter options for the Learn hub sheet.
 */

import type { CourseListFilters } from '@/features/learn/types/course.types';

export type LearnFilterDraft = {
  price: CourseListFilters['price'];
  examGoal: string;
  difficulty: CourseListFilters['difficulty'];
  sort: NonNullable<CourseListFilters['sort']>;
};

export const LEARN_SORT_OPTIONS: { id: LearnFilterDraft['sort']; label: string }[] =
  [
    { id: 'popular', label: 'Most popular' },
    { id: 'latest', label: 'Newest' },
    { id: 'rated', label: 'Highest rated' },
  ];

export const LEARN_PRICE_OPTIONS: {
  id: CourseListFilters['price'];
  label: string;
}[] = [
  { id: 'all', label: 'Any price' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
];

export const LEARN_EXAM_OPTIONS = [
  { id: '', label: 'Any exam' },
  { id: 'nda', label: 'NDA' },
  { id: 'cds', label: 'CDS' },
  { id: 'afcat', label: 'AFCAT' },
  { id: 'ssb', label: 'SSB' },
] as const;

export const LEARN_LEVEL_OPTIONS: {
  id: CourseListFilters['difficulty'];
  label: string;
}[] = [
  { id: 'all', label: 'Any level' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export const DEFAULT_LEARN_FILTERS: LearnFilterDraft = {
  price: 'all',
  examGoal: '',
  difficulty: 'all',
  sort: 'popular',
};

export function countActiveLearnFilters(draft: LearnFilterDraft): number {
  let n = 0;
  if (draft.price && draft.price !== 'all') n += 1;
  if (draft.examGoal) n += 1;
  if (draft.difficulty && draft.difficulty !== 'all') n += 1;
  if (draft.sort && draft.sort !== 'popular') n += 1;
  return n;
}

export function learnSortLabel(sort: LearnFilterDraft['sort']): string {
  return LEARN_SORT_OPTIONS.find((item) => item.id === sort)?.label ?? 'Sort';
}
