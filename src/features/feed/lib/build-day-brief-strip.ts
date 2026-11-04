/**
 * Builds the Home Day Brief strip: self compose/view tile, then one tile per person.
 */

import { FEED_SELF_BRIEF, type FeedPreviewBrief } from '@/features/feed/data/feed-preview';
import { groupDayBriefs } from '@/features/feed/lib/group-day-briefs';
import type { DayBriefItem } from '@/features/feed/types/feed.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

export type BuildDayBriefStripInput = {
  liveItems: DayBriefItem[];
  viewerId?: string | null;
};

const RING = ['#1877F2', '#1667CF', '#CC5800', '#1351A1', '#0E2B50'];

/**
 * Self tile first, then other creators (one tile each). Segment ids live on `briefIds`.
 */
export function buildDayBriefStrip({
  liveItems,
  viewerId,
}: BuildDayBriefStripInput): FeedPreviewBrief[] {
  const trays = groupDayBriefs({ items: liveItems, viewerId });
  const selfTray = trays.find((tray) => tray.isSelf);
  const otherTrays = trays.filter((tray) => !tray.isSelf);

  const latestSelf = selfTray?.items[selfTray.items.length - 1];
  const selfPoster = latestSelf
    ? resolveUploadUrl(latestSelf.posterUrl) ||
      resolveUploadUrl(latestSelf.creator?.avatarUrl) ||
      undefined
    : undefined;

  const self: FeedPreviewBrief = {
    ...FEED_SELF_BRIEF,
    posterUri: selfPoster,
    unseen: selfTray ? selfTray.unseen : false,
    authorId: viewerId || undefined,
    briefIds: selfTray?.items.map((item) => item.id) || [],
  };

  const others: FeedPreviewBrief[] = otherTrays.map((tray, index) => {
    const latest = tray.items[tray.items.length - 1];
    const hash = tray.creatorId.length % RING.length;

    return {
      id: `user:${tray.creatorId}`,
      name: tray.name,
      initials: getUserInitials(tray.name),
      ringColor: RING[hash] ?? RING[index % RING.length] ?? '#1877F2',
      unseen: tray.unseen,
      posterUri: latest
        ? resolveUploadUrl(latest.posterUrl) ||
          resolveUploadUrl(tray.avatarUrl) ||
          undefined
        : undefined,
      caption: latest?.caption,
      authorId: tray.creatorId,
      username: tray.username,
      briefIds: tray.items.map((item) => item.id),
    };
  });

  return [self, ...others];
}
