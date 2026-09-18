/**
 * Card view-model and tab keys for the Feed UI.
 */

export type FeedTabKey = 'forYou' | 'latest' | 'following' | 'trending';

export type FeedAuthorRole =
  | 'aspirant'
  | 'educator'
  | 'defence_officer'
  | 'institute';

export type FeedPreviewAuthor = {
  id: string;
  username?: string;
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
  posterUri?: string;
  caption?: string;
  authorId?: string;
  username?: string;
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
  followingAuthor?: boolean;
  isOwn?: boolean;
};

export const FEED_TABS: { key: FeedTabKey; label: string }[] = [
  { key: 'forYou', label: 'For You' },
  { key: 'latest', label: 'Latest' },
  { key: 'following', label: 'Following' },
  { key: 'trending', label: 'Trending' },
];

/** Compose tile only — other briefs come from `/day-briefs`. */
export const FEED_SELF_BRIEF: FeedPreviewBrief = {
  id: 'self',
  name: 'Your story',
  initials: '+',
  ringColor: '#1877F2',
  isSelf: true,
};
