/**
 * Unit tests for Day Brief strip mapping.
 */

import { toDayBriefTile } from '@/features/feed/lib/to-day-brief-tile';
import type { DayBriefItem } from '@/features/feed/types/feed.types';

describe('toDayBriefTile', () => {
  it('marks unviewed briefs as unseen', () => {
    const brief: DayBriefItem = {
      id: 'b1',
      title: 'Morning drill',
      caption: '0450 hrs',
      posterUrl: '/uploads/day-brief/x.jpg',
      viewed: false,
      creator: {
        id: 'u1',
        name: 'Arjun Kapoor',
        username: 'arjun',
        avatarUrl: '',
      },
    };

    const tile = toDayBriefTile(brief);
    expect(tile.name).toBe('Arjun Kapoor');
    expect(tile.initials).toBe('AK');
    expect(tile.unseen).toBe(true);
    expect(tile.posterUri).toContain('/uploads/day-brief/x.jpg');
    expect(tile.authorId).toBe('u1');
    expect(tile.username).toBe('arjun');
  });
});
