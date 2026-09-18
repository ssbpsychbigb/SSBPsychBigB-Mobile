/**
 * Builds an Instagram-style watch queue: tapped reel first, then shuffled rest.
 */

import type { PrepReelPreview } from '@/features/reels/data/reels-preview';

/**
 * Fisher–Yates shuffle. Does not mutate the input array.
 */
export function shuffleReels(items: PrepReelPreview[]): PrepReelPreview[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    const other = next[swap];
    if (current && other) {
      next[index] = other;
      next[swap] = current;
    }
  }
  return next;
}

/**
 * Opens the player on `selectedId`, then randomises remaining clips.
 */
export function playlistFromSelection(
  items: PrepReelPreview[],
  selectedId: string,
): PrepReelPreview[] {
  const selected = items.find((item) => item.id === selectedId);
  const rest = items.filter((item) => item.id !== selectedId);
  if (!selected) {
    return shuffleReels(items);
  }
  return [selected, ...shuffleReels(rest)];
}
