/**
 * Maps a Day Brief API item onto the Home strip tile.
 */

import type { FeedPreviewBrief } from '@/features/feed/data/feed-preview';
import type { DayBriefItem } from '@/features/feed/types/feed.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

const RING = ['#1877F2', '#1667CF', '#CC5800', '#1351A1', '#0E2B50'];

/**
 * Strip tile for one 24h brief. Self tile is added separately on the screen.
 */
export function toDayBriefTile(brief: DayBriefItem): FeedPreviewBrief {
  const name = brief.creator?.name?.trim() || 'Member';
  const hash = brief.id.length % RING.length;

  return {
    id: brief.id,
    name,
    initials: getUserInitials(name),
    ringColor: RING[hash] ?? '#1877F2',
    unseen: !brief.viewed,
    posterUri: resolveUploadUrl(brief.posterUrl) || undefined,
    caption: brief.caption,
    authorId: brief.creator?.id,
    username: brief.creator?.username?.trim() || undefined,
  };
}
