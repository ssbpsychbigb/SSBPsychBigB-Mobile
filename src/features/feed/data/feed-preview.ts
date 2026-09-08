/**
 * Preview posts and day briefs for the Feed UI (API wiring lands next).
 */

export type FeedTabKey = 'forYou' | 'latest' | 'following' | 'trending';

export type FeedAuthorRole =
  | 'aspirant'
  | 'educator'
  | 'defence_officer'
  | 'institute';

export type FeedPreviewAuthor = {
  id: string;
  name: string;
  role: FeedAuthorRole;
  initials: string;
  avatarColor: string;
  verified?: boolean;
};

export type FeedPreviewBrief = {
  id: string;
  name: string;
  initials: string;
  ringColor: string;
  isSelf?: boolean;
  unseen?: boolean;
};

export type FeedPreviewPost = {
  id: string;
  author: FeedPreviewAuthor;
  createdLabel: string;
  visibility: 'public' | 'followers';
  body: string;
  imageUri?: string;
  likesLabel: string;
  commentsLabel: string;
  sharesLabel: string;
  tab: FeedTabKey[];
};

export const FEED_TABS: { key: FeedTabKey; label: string }[] = [
  { key: 'forYou', label: 'For You' },
  { key: 'latest', label: 'Latest' },
  { key: 'following', label: 'Following' },
  { key: 'trending', label: 'Trending' },
];

export const FEED_PREVIEW_BRIEFS: FeedPreviewBrief[] = [
  {
    id: 'self',
    name: 'Your brief',
    initials: '+',
    ringColor: '#1877F2',
    isSelf: true,
  },
  {
    id: 'b1',
    name: 'Arjun',
    initials: 'AK',
    ringColor: '#1877F2',
    unseen: true,
  },
  {
    id: 'b2',
    name: 'Meera',
    initials: 'MS',
    ringColor: '#1667CF',
    unseen: true,
  },
  {
    id: 'b3',
    name: 'NCC Hub',
    initials: 'NH',
    ringColor: '#CC5800',
    unseen: true,
  },
  {
    id: 'b4',
    name: 'Capt. Rao',
    initials: 'CR',
    ringColor: '#1877F2',
  },
  {
    id: 'b5',
    name: 'SSB Lab',
    initials: 'SL',
    ringColor: '#1351A1',
  },
];

export const FEED_PREVIEW_POSTS: FeedPreviewPost[] = [
  {
    id: 'p1',
    author: {
      id: 'a1',
      name: 'Capt. Vikram Rao',
      role: 'defence_officer',
      initials: 'VR',
      avatarColor: '#1351A1',
      verified: true,
    },
    createdLabel: 'Yesterday · 6:20 PM',
    visibility: 'public',
    body: 'TAT is not about a perfect story. It is about a clear hero, a real obstacle, and a decision you would actually take. Write like an officer, not like a novelist.',
    imageUri:
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80',
    likesLabel: '1.2K',
    commentsLabel: '84',
    sharesLabel: '36',
    tab: ['forYou', 'latest', 'trending'],
  },
  {
    id: 'p2',
    author: {
      id: 'a2',
      name: 'Meera Sharma',
      role: 'educator',
      initials: 'MS',
      avatarColor: '#1667CF',
    },
    createdLabel: '2h',
    visibility: 'public',
    body: 'GTO tip for this week: in PGT, narrate the plan in 12 seconds before anyone lifts a plank. The group follows the voice that sounds decided.',
    likesLabel: '640',
    commentsLabel: '41',
    sharesLabel: '18',
    tab: ['forYou', 'latest'],
  },
  {
    id: 'p3',
    author: {
      id: 'a3',
      name: 'Valour Institute',
      role: 'institute',
      initials: 'VI',
      avatarColor: '#0E2B50',
    },
    createdLabel: '5h',
    visibility: 'public',
    body: 'Open lecture this Sunday: interview hot seats with serving officers. Public seats are limited — join the community to reserve yours.',
    imageUri:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
    likesLabel: '2.4K',
    commentsLabel: '190',
    sharesLabel: '112',
    tab: ['forYou', 'latest', 'trending'],
  },
  {
    id: 'p4',
    author: {
      id: 'a4',
      name: 'Arjun Kulkarni',
      role: 'aspirant',
      initials: 'AK',
      avatarColor: '#65676B',
    },
    createdLabel: '1d',
    visibility: 'followers',
    body: 'Day 18 of SRT drill. I stopped writing “I informed the police” as a default ending. Officers solve, they do not outsource. Sharing my 10-line template in comments.',
    likesLabel: '96',
    commentsLabel: '22',
    sharesLabel: '7',
    tab: ['forYou', 'following', 'latest'],
  },
];
