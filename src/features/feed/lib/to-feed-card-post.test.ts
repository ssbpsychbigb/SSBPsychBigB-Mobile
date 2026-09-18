/**
 * Unit tests for feed count / card mapping helpers.
 */

import { formatCount, toFeedCardPost } from '@/features/feed/lib/to-feed-card-post';
import type { FeedPost } from '@/features/feed/types/feed.types';

describe('formatCount', () => {
  it('keeps small numbers raw', () => {
    expect(formatCount(12)).toBe('12');
  });

  it('compacts thousands', () => {
    expect(formatCount(1200)).toBe('1.2K');
  });
});

describe('toFeedCardPost', () => {
  it('maps author and stats onto the card model', () => {
    const post: FeedPost = {
      id: 'p1',
      authorId: 'u1',
      type: 'text',
      content: 'Hello officers',
      visibility: 'public',
      media: [],
      stats: { likes: 12, comments: 3, shares: 1, saves: 0 },
      createdAt: new Date().toISOString(),
      author: {
        id: 'u1',
        fullName: 'Capt Rao',
        username: 'capt_rao',
        role: 'defence_officer',
        verificationLevel: 2,
        profilePhotoPath: '',
      },
      viewerState: { liked: false, bookmarked: false, followingAuthor: true },
    };

    const card = toFeedCardPost(post);
    expect(card.body).toBe('Hello officers');
    expect(card.author.username).toBe('capt_rao');
    expect(card.author.role).toBe('defence_officer');
    expect(card.author.verified).toBe(true);
    expect(card.followingAuthor).toBe(true);
    expect(card.likesLabel).toBe('12');
  });
});
