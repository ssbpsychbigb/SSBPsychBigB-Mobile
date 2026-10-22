/**
 * Pure helpers for the attempt player. The server clock stays the source of truth.
 */

import type {
  AttemptAnswer,
  AttemptState,
} from '@/features/assessments/types/assessment.types';

export type AnswerDraft = {
  selectedIndex?: number;
  text?: string;
  story?: string;
  characters?: string;
  theme?: string;
};

export function draftsFromAttempt(
  answers: AttemptState['answers'] | undefined,
): Record<string, AnswerDraft> {
  const map: Record<string, AnswerDraft> = {};
  for (const answer of answers || []) {
    map[answer.itemId] = {
      selectedIndex: answer.selectedIndex,
      text: answer.text,
      story: answer.story,
      characters: answer.characters,
      theme: answer.theme,
    };
  }
  return map;
}

export function payloadFromDrafts(
  map: Record<string, AnswerDraft>,
): AttemptAnswer[] {
  return Object.entries(map).map(([itemId, draft]) => ({
    itemId,
    selectedIndex: draft.selectedIndex,
    text: draft.text,
    story: draft.story,
    characters: draft.characters,
    theme: draft.theme,
  }));
}

export function clockDriftMs(serverNow: string | undefined, now = Date.now()) {
  if (!serverNow) return 0;
  const parsed = new Date(serverNow).getTime();
  if (!Number.isFinite(parsed)) return 0;
  return now - parsed;
}

export function remainingSec(deadlineIso: string | null, nowMs: number) {
  if (!deadlineIso) return null;
  const end = new Date(deadlineIso).getTime();
  if (!Number.isFinite(end)) return null;
  return Math.max(0, Math.floor((end - nowMs) / 1000));
}

export function formatClock(totalSec: number) {
  const safe = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function draftIsAnswered(draft: AnswerDraft | undefined) {
  if (!draft) return false;
  if (typeof draft.selectedIndex === 'number') return true;
  return [draft.text, draft.story, draft.characters, draft.theme].some(
    (value) => Boolean(value && value.trim()),
  );
}
