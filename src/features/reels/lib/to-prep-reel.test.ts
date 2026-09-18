/**
 * Unit tests for feed video post → Prep Reel mapping.
 */

import type { FeedPost } from '@/features/feed/types/feed.types';
import { toPrepReel } from '@/features/reels/lib/to-prep-reel';

function post(overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    id: 'p1',
    authorId: 'a1',
    type: 'video',
    content: 'TAT in 60 seconds',
    visibility: 'public',
    media: [
      {
        mediaType: 'video',
        url: '/uploads/reel.mp4',
        thumbnail: '/uploads/reel.jpg',
        duration: 15,
      },
    ],
    stats: { likes: 12, comments: 3, shares: 1, saves: 2 },
    createdAt: new Date().toISOString(),
    author: {
      id: 'a1',
      fullName: 'Capt Rao',
      username: 'capt_rao',
      role: 'defence_officer',
      verificationLevel: 2,
      profilePhotoPath: '',
    },
    viewerState: { liked: false, bookmarked: false, followingAuthor: false },
    categories: ['gto'],
    ...overrides,
  };
}

describe('toPrepReel', () => {
  it('returns null without a video URL', () => {
    expect(toPrepReel(post({ media: [], type: 'text' }))).toBeNull();
  });

  it('maps GTO category and a playable URI', () => {
    const reel = toPrepReel(post());
    expect(reel?.category).toBe('GTO');
    expect(reel?.videoUri).toContain('/uploads/reel.mp4');
    expect(reel?.author).toBe('Capt Rao');
    expect(reel?.authorUsername).toBe('capt_rao');
    expect(reel?.isOwn).toBe(false);
  });

  it('flags own reels', () => {
    expect(toPrepReel(post(), 'a1')?.isOwn).toBe(true);
  });
});
