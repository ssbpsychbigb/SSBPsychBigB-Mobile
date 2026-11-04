/**
 * Unit tests for Day Brief tray grouping.
 */

import { groupDayBriefs } from '@/features/feed/lib/group-day-briefs';
import type { DayBriefItem } from '@/features/feed/types/feed.types';

function brief(partial: Partial<DayBriefItem> & { id: string }): DayBriefItem {
  return {
    title: 'Brief',
    caption: 'Caption',
    posterUrl: '/uploads/day-brief/x.jpg',
    viewed: false,
    createdAt: '2026-11-04T10:00:00.000Z',
    creator: { id: 'u2', name: 'Meera', avatarUrl: '' },
    ...partial,
  };
}

describe('groupDayBriefs', () => {
  it('orders segments oldest to newest inside a tray', () => {
    const trays = groupDayBriefs({
      viewerId: 'me',
      items: [
        brief({
          id: 'b2',
          createdAt: '2026-11-04T12:00:00.000Z',
          creator: { id: 'u1', name: 'A', avatarUrl: '' },
        }),
        brief({
          id: 'b1',
          createdAt: '2026-11-04T09:00:00.000Z',
          creator: { id: 'u1', name: 'A', avatarUrl: '' },
        }),
      ],
    });
    expect(trays).toHaveLength(1);
    expect(trays[0]?.items.map((item) => item.id)).toEqual(['b1', 'b2']);
  });

  it('places the self tray first', () => {
    const trays = groupDayBriefs({
      viewerId: 'me',
      items: [
        brief({
          id: 'other',
          creator: { id: 'u9', name: 'Other', avatarUrl: '' },
        }),
        brief({
          id: 'mine',
          creator: { id: 'me', name: 'Me', avatarUrl: '' },
        }),
      ],
    });
    expect(trays[0]?.isSelf).toBe(true);
    expect(trays[1]?.creatorId).toBe('u9');
  });
});
