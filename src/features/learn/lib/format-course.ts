/**
 * Display helpers for catalogue / library cards.
 */

import type { CourseCard } from '@/features/learn/types/course.types';

export function formatCoursePrice(
  price: number,
  currency = 'INR',
): string {
  if (!Number.isFinite(price) || price <= 0) {
    return 'Free';
  }

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${Math.round(price)}`;
  }
}

export function formatDurationMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return '';
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatEnrollmentCount(count: number): string {
  if (!count) {
    return 'New';
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k enrolled`;
  }
  return `${count} enrolled`;
}

export function instructorLabel(course: CourseCard): string {
  return (
    course.instructor?.name ||
    course.institute?.name ||
    'BIGB faculty'
  );
}

export function formatLessonClock(durationSec: number): string {
  if (!durationSec || durationSec <= 0) {
    return '';
  }
  const m = Math.floor(durationSec / 60);
  const s = durationSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}:${String(rm).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) {
    return '';
  }
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) {
    return 'Just now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 14) {
    return `${days}d ago`;
  }
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function difficultyLabel(value: string | undefined): string {
  if (!value) {
    return '';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
