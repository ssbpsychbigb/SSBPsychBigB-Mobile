/**
 * Unit tests for Reels watch-queue order.
 */

import type { PrepReelPreview } from '@/features/reels/data/reels-preview';
import { playlistFromSelection } from '@/features/reels/lib/playlist-from-selection';

function stub(id: string): PrepReelPreview {
  return {
    id,
    title: id,
    synopsis: '',
    author: 'A',
    authorRole: 'Mentor',
    postedAgo: '1h',
    duration: '0:15',
    category: 'GTO',
    likesLabel: '1',
    commentsLabel: '0',
    color: '#1351A1',
    video: 1,
    androidRaw: 'reel1',
  };
}

describe('playlistFromSelection', () => {
  it('puts the tapped reel first', () => {
    const items = [stub('a'), stub('b'), stub('c')];
    const queue = playlistFromSelection(items, 'b');
    expect(queue[0]?.id).toBe('b');
    expect(queue.map((item) => item.id).sort()).toEqual(['a', 'b', 'c']);
  });
});
