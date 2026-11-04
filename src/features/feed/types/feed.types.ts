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
  audioMuted?: boolean;
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
  editedAt?: string | null;
};

export type FeedComment = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  likesCount?: number;
  liked?: boolean;
  pinnedAt?: string | null;
  author: FeedAuthor | null;
};

export type DirectoryPerson = {
  id: string;
  fullName: string;
  username: string;
  role: string;
  instituteName: string;
  profilePhotoPath: string;
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
  communityId?: string;
  media?: Array<{
    url: string;
    thumbnail?: string;
    mediaType?: string;
    audioMuted?: boolean;
  }>;
  status?: 'draft' | 'published';
};

export type UpdatePostInput = Partial<
  Pick<CreatePostInput, 'content' | 'visibility' | 'media' | 'status'>
>;

export type DayBriefVisibility = 'public' | 'followers' | 'close_friends';

export type DayBriefMediaType = 'image' | 'video' | 'text';

export type DayBriefStickerType =
  | 'mention'
  | 'hashtag'
  | 'location'
  | 'link'
  | 'poll'
  | 'question'
  | 'text';

export type DayBriefSticker = {
  id: string;
  type: DayBriefStickerType;
  label?: string;
  value?: string;
  x?: number;
  y?: number;
  options?: string[];
  tallies?: number[];
  voteCount?: number;
  myVote?: number | null;
};

export type DayBriefItem = {
  id: string;
  title: string;
  caption: string;
  posterUrl: string;
  videoUrl?: string;
  mediaUrl?: string;
  mediaType?: DayBriefMediaType;
  backgroundColor?: string;
  overlayText?: string;
  musicId?: string;
  music?: string;
  musicLabel?: string;
  stickers?: DayBriefSticker[];
  /** Segment length in seconds (from API; image default ~6, video ~12). */
  durationSec?: number;
  createdAt?: string;
  expiresAt?: string;
  viewed?: boolean;
  visibility?: DayBriefVisibility;
  myReaction?: string | null;
  viewCount?: number;
  reactionCount?: number;
  creator: {
    id: string;
    name: string;
    username?: string;
    avatarUrl: string;
    verified?: boolean;
  } | null;
};

export type DayBriefHighlight = {
  id: string;
  title: string;
  coverUrl: string;
  itemCount: number;
  items?: Array<{
    id: string;
    mediaType: DayBriefMediaType;
    mediaUrl?: string;
    thumbnailUrl?: string;
    caption?: string;
    overlayText?: string;
    backgroundColor?: string;
    durationSec?: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type DayBriefViewerPerson = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  viewedAt: string;
  reaction?: string | null;
};

/** One person's tray of 24h story segments (Instagram-style grouping). */
export type DayBriefTray = {
  creatorId: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  isSelf: boolean;
  unseen: boolean;
  items: DayBriefItem[];
};
