/**
 * Feed domain types — aligned with the BIGB backend Module 4 envelope.
 */

export type FeedPostType =
  | 'text'
  | 'image'
  | 'video'
  | 'poll'
  | 'question'
  | 'achievement';

export type FeedPostVisibility = 'public' | 'followers' | 'only_me';

export type FeedTabKey = 'forYou' | 'latest' | 'following' | 'trending';

export type FeedMediaItem = {
  mediaType: 'image' | 'video' | 'document' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number | null;
};

export type FeedAuthor = {
  id: string;
  fullName: string;
  username?: string;
  role: string;
  verificationLevel: number;
  profilePhotoPath: string;
};

export type FeedViewerState = {
  liked: boolean;
  bookmarked: boolean;
  followingAuthor: boolean;
};

export type FeedPost = {
  id: string;
  authorId: string;
  type: FeedPostType;
  content: string;
  visibility: FeedPostVisibility;
  media: FeedMediaItem[];
  stats: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  createdAt: string;
  author: FeedAuthor | null;
  viewerState?: FeedViewerState;
  categories?: string[];
  hashtags?: string[];
  pinnedAt?: string | null;
};

export type FeedComment = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  author: FeedAuthor | null;
};

export type FeedPage = {
  items: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type SharePayload = {
  shares: number;
  url: string;
  targets: {
    whatsapp: string;
    telegram: string;
    copy: string;
    qr: string;
  };
};

export type CreatePostInput = {
  content: string;
  type?: FeedPostType;
  visibility?: FeedPostVisibility;
  categories: string[];
  media?: Array<{
    url: string;
    thumbnail?: string;
    mediaType?: string;
  }>;
};

export type DayBriefItem = {
  id: string;
  title: string;
  caption: string;
  posterUrl: string;
  videoUrl?: string;
  viewed?: boolean;
  creator: {
    id: string;
    name: string;
    username?: string;
    avatarUrl: string;
    verified?: boolean;
  } | null;
};
