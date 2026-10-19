/**
 * Display helpers for network cards.
 */

import { EXAM_GOAL_OPTIONS } from '@/features/auth/constants/exam-goals';
import type { NetworkMember } from '@/features/network/types/network.types';

export function examGoalLabel(value?: string): string {
  if (!value) {
    return '';
  }
  return EXAM_GOAL_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function followCtaLabel(following: boolean, followsYou: boolean): string {
  if (following) {
    return 'Following';
  }
  if (followsYou) {
    return 'Follow back';
  }
  return 'Follow';
}

export function roleHeadline(role: string, examGoal?: string, instituteName?: string): string {
  if (role === 'defence_officer') {
    return 'Defence officer';
  }
  if (role === 'educator') {
    return 'Educator';
  }
  if (role === 'institute' || role === 'institute_admin') {
    return instituteName ? `Institute · ${instituteName}` : 'Institute';
  }
  const exam = examGoalLabel(examGoal);
  return exam ? `Aspirant · ${exam}` : 'Aspirant';
}

export function suggestionWhy(person: NetworkMember & { city?: string; reason?: { label: string } }): string {
  if (person.reason?.label) {
    return person.reason.label;
  }
  if (person.followsYou) {
    return 'Follows you';
  }
  if (person.isMutual) {
    return 'You follow each other';
  }
  if (person.role === 'defence_officer') {
    return 'Officer in the community';
  }
  if (person.role === 'educator') {
    return 'Mentor in the community';
  }
  if (person.role === 'institute' || person.role === 'institute_admin') {
    return 'Defence institute';
  }
  const exam = examGoalLabel(person.examGoal);
  if (exam) {
    return `Preparing for ${exam}`;
  }
  if (person.city) {
    return person.city;
  }
  return 'Suggested for you';
}
