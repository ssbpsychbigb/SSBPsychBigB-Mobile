/**
 * Unit tests for the Home Day Brief strip assembly.
 */

import { buildDayBriefStrip } from '@/features/feed/lib/build-day-brief-strip';
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

describe('buildDayBriefStrip', () => {
  it('keeps only the compose tile when the API tray is empty', () => {
    const tiles = buildDayBriefStrip({
      liveItems: [],
      viewerId: null,
    });
    expect(tiles).toHaveLength(1);
    expect(tiles[0]?.isSelf).toBe(true);
    expect(tiles[0]?.briefIds).toEqual([]);
  });

  it('groups multiple briefs from one creator into a single tile', () => {
    const tiles = buildDayBriefStrip({
      liveItems: [
        brief({
          id: 'live-1',
          createdAt: '2026-11-04T09:00:00.000Z',
          creator: { id: 'u9', name: 'Hiren', avatarUrl: '' },
        }),
        brief({
          id: 'live-2',
          createdAt: '2026-11-04T11:00:00.000Z',
          creator: { id: 'u9', name: 'Hiren', avatarUrl: '' },
        }),
      ],
      viewerId: 'me',
    });
    expect(tiles.map((item) => item.name)).toEqual(['Your story', 'Hiren']);
    expect(tiles[1]?.briefIds).toEqual(['live-1', 'live-2']);
  });

  it('puts own segments on the self tile briefIds', () => {
    const tiles = buildDayBriefStrip({
      liveItems: [
        brief({
          id: 'mine-1',
          createdAt: '2026-11-04T08:00:00.000Z',
          creator: { id: 'me', name: 'You', avatarUrl: '' },
        }),
        brief({
          id: 'mine-2',
          createdAt: '2026-11-04T12:00:00.000Z',
          creator: { id: 'me', name: 'You', avatarUrl: '' },
        }),
      ],
      viewerId: 'me',
    });
    expect(tiles).toHaveLength(1);
    expect(tiles[0]?.isSelf).toBe(true);
    expect(tiles[0]?.briefIds).toEqual(['mine-1', 'mine-2']);
    expect(tiles[0]?.posterUri).toContain('/uploads/day-brief/x.jpg');
  });
});
