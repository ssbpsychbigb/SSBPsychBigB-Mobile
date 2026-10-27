/**
 * Maps API feed posts onto the existing card view-model.
 */

import type { FeedPreviewPost } from '@/features/feed/data/feed-preview';
import type { FeedPost } from '@/features/feed/types/feed.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

const ROLE_FALLBACK = 'aspirant' as const;

const AVATAR_COLORS = ['#1351A1', '#1667CF', '#1877F2', '#CC5800', '#0E2B50'];

/**
 * Compact count for action labels (1.2K).
 */
export function formatCount(value: number): string {
  if (value < 1000) {
    return String(value);
  }
  if (value < 10_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${Math.round(value / 1000)}K`;
}

/**
 * Relative time for the post header.
 */
export function formatPostTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const delta = Date.now() - then;
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function avatarColor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] ?? '#1351A1';
}

function mapRole(role: string): FeedPreviewPost['author']['role'] {
  if (
    role === 'educator' ||
    role === 'defence_officer' ||
    role === 'institute' ||
    role === 'aspirant'
  ) {
    return role;
  }
  if (role === 'institute_admin') {
    return 'institute';
  }
  return ROLE_FALLBACK;
}

/**
 * Card-ready post. Extra flags stay on the API model in the screen.
 */
export function toFeedCardPost(post: FeedPost): FeedPreviewPost {
  const name = post.author?.fullName?.trim() || 'Member';
  const images = post.media.filter((item) => item.mediaType === 'image');
  const imageUris = images
    .map((item) => resolveUploadUrl(item.url) || resolveUploadUrl(item.thumbnail))
    .filter((uri): uri is string => Boolean(uri));
  const imageUri = imageUris[0];
  const video = post.media.find((item) => item.mediaType === 'video');
  const videoUri = resolveUploadUrl(video?.url) || undefined;
  const topicLabel: Record<string, string> = {
    gto: 'GTO',
    entry_guidance: 'Interview',
    current_affairs: 'Current affairs',
    defence_news: 'Defence news',
    recommendation_story: 'Recommendation',
  };
  const tags = [
    ...(post.categories || []).map((key) => {
      return (
        topicLabel[key] || key.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase())
      );
    }),
    ...(post.hashtags || []).map((tag) => `#${tag.replace(/^#/, '')}`),
  ];

  return {
    id: post.id,
    author: {
      id: post.author?.id || post.authorId,
      username: post.author?.username?.trim() || undefined,
      name,
      role: mapRole(post.author?.role || ''),
      initials: getUserInitials(name),
      avatarColor: avatarColor(post.author?.id || post.id),
      avatarUri: resolveUploadUrl(post.author?.profilePhotoPath) || undefined,
      verified: (post.author?.verificationLevel ?? 0) >= 2,
    },
    createdLabel: post.editedAt
      ? `${formatPostTime(post.createdAt)} · Edited`
      : formatPostTime(post.createdAt),
    visibility: post.visibility === 'followers' ? 'followers' : 'public',
    body: post.content || '',
    tags,
    imageUri,
    imageUris,
    videoUri,
    likesLabel: formatCount(post.stats.likes),
    commentsLabel: formatCount(post.stats.comments),
    sharesLabel: formatCount(post.stats.shares),
    tab: ['forYou'],
    followingAuthor: Boolean(post.viewerState?.followingAuthor),
  };
}
