/**
 * Groups flat Day Brief API rows into per-person trays (Instagram-style).
 */

import type { DayBriefItem, DayBriefTray } from '@/features/feed/types/feed.types';

export type GroupDayBriefsInput = {
  items: DayBriefItem[];
  viewerId?: string | null;
};

/**
 * Newest segment first within a tray. Self tray first when present, then
 * trays with any unviewed segment, then by newest segment time.
 */
export function groupDayBriefs({
  items,
  viewerId,
}: GroupDayBriefsInput): DayBriefTray[] {
  const byCreator = new Map<string, DayBriefItem[]>();

  for (const item of items) {
    const creatorId = String(item.creator?.id || '').trim();
    if (!creatorId) {
      continue;
    }
    const list = byCreator.get(creatorId) || [];
    list.push(item);
    byCreator.set(creatorId, list);
  }

  const trays: DayBriefTray[] = [];

  for (const [creatorId, raw] of byCreator) {
    const sorted = [...raw].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
    // Play oldest → newest inside the viewer (IG order).
    const playOrder = [...sorted].reverse();
    const head = sorted[0];
    const isSelf = Boolean(viewerId && creatorId === String(viewerId));

    trays.push({
      creatorId,
      name: head?.creator?.name?.trim() || (isSelf ? 'Your story' : 'Member'),
      username: head?.creator?.username?.trim() || undefined,
      avatarUrl: head?.creator?.avatarUrl || undefined,
      isSelf,
      unseen: playOrder.some((item) => !item.viewed),
      items: playOrder,
    });
  }

  trays.sort((a, b) => {
    if (a.isSelf !== b.isSelf) {
      return a.isSelf ? -1 : 1;
    }
    if (a.unseen !== b.unseen) {
      return a.unseen ? -1 : 1;
    }
    const aNewest = a.items[a.items.length - 1]?.createdAt || '';
    const bNewest = b.items[b.items.length - 1]?.createdAt || '';
    return new Date(bNewest).getTime() - new Date(aNewest).getTime();
  });

  return trays;
}
