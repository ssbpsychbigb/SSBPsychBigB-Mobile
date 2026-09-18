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
  });

  it('appends live API briefs after the compose tile', () => {
    const tiles = buildDayBriefStrip({
      liveItems: [
        brief({ id: 'live-1', creator: { id: 'u9', name: 'Hiren', avatarUrl: '' } }),
      ],
      viewerId: 'me',
    });
    expect(tiles.map((item) => item.name)).toEqual(['Your story', 'Hiren']);
  });
});
