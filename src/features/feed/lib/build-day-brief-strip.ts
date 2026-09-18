/**
 * Builds the Home Day Brief strip from live API items plus the compose tile.
 */

import { FEED_SELF_BRIEF, type FeedPreviewBrief } from '@/features/feed/data/feed-preview';
import { toDayBriefTile } from '@/features/feed/lib/to-day-brief-tile';
import type { DayBriefItem } from '@/features/feed/types/feed.types';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

export type BuildDayBriefStripInput = {
  liveItems: DayBriefItem[];
  viewerId?: string | null;
};

/**
 * Self compose tile first, then unexpired `/day-briefs` only. No static people.
 */
export function buildDayBriefStrip({
  liveItems,
  viewerId,
}: BuildDayBriefStripInput): FeedPreviewBrief[] {
  const own = viewerId
    ? liveItems.filter((item) => item.creator?.id === viewerId)
    : [];
  const others = viewerId
    ? liveItems.filter((item) => item.creator?.id !== viewerId)
    : liveItems;

  const ownPoster = own[0]
    ? resolveUploadUrl(own[0].posterUrl) || undefined
    : undefined;

  const self: FeedPreviewBrief = {
    ...FEED_SELF_BRIEF,
    posterUri: ownPoster,
    unseen: own.some((item) => !item.viewed),
  };

  return [self, ...others.map(toDayBriefTile)];
}
