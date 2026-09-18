/**
 * Maps `/feed/reels` video posts onto the existing Prep Reel UI model.
 */

import type { FeedPost } from '@/features/feed/types/feed.types';
import { formatCount, formatPostTime } from '@/features/feed/lib/to-feed-card-post';
import type { PrepReelPreview } from '@/features/reels/data/reels-preview';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

const COLORS = ['#1351A1', '#1667CF', '#1877F2', '#CC5800', '#0E2B50'];

function avatarColor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index)) % COLORS.length;
  }
  return COLORS[hash] ?? '#1351A1';
}

function pickVideo(post: FeedPost) {
  return (
    post.media.find((item) => item.mediaType === 'video') ||
    (post.type === 'video' ? post.media[0] : undefined)
  );
}

/**
 * Explore chip from categories + caption (defence-prep buckets).
 */
export function reelCategoryFromPost(post: FeedPost): string {
  const hay = `${(post.categories || []).join(' ')} ${post.content}`.toLowerCase();
  if (/\bgto\b|\bpgt\b|\bhgt\b|command task/.test(hay)) {
    return 'GTO';
  }
  if (/\boir\b/.test(hay)) {
    return 'OIR';
  }
  if (/\binterview\b|\blecturette\b|\bpi\b/.test(hay)) {
    return 'Interview';
  }
  return 'Psychology';
}

function formatDuration(seconds: number): string {
  const total = Math.max(1, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function titleFromContent(content: string): string {
  const line = content.trim().split(/\n/)[0] || '';
  if (!line) {
    return 'Prep Reel';
  }
  return line.length > 90 ? `${line.slice(0, 87)}…` : line;
}

/**
 * Null when the post has no playable video URL.
 */
export function toPrepReel(
  post: FeedPost,
  viewerId?: string | null,
): PrepReelPreview | null {
  const video = pickVideo(post);
  const videoUri = resolveUploadUrl(video?.url);
  if (!videoUri) {
    return null;
  }

  const name = post.author?.fullName?.trim() || 'Member';
  const authorId = post.author?.id || post.authorId;
  const posterUri =
    resolveUploadUrl(video?.thumbnail) ||
    resolveUploadUrl(post.author?.profilePhotoPath) ||
    undefined;

  return {
    id: post.id,
    title: titleFromContent(post.content),
    synopsis: post.content.trim(),
    author: name,
    authorId,
    authorUsername: post.author?.username?.trim() || undefined,
    authorRole: post.author?.role?.replace(/_/g, ' ') || 'Member',
    postedAgo: formatPostTime(post.createdAt),
    duration: formatDuration(Number(video?.duration) || 30),
    category: reelCategoryFromPost(post),
    likesLabel: formatCount(post.stats?.likes ?? 0),
    commentsLabel: formatCount(post.stats?.comments ?? 0),
    color: avatarColor(authorId || post.id),
    videoUri,
    posterUri,
    isOwn: Boolean(viewerId && authorId === viewerId),
    followingAuthor: Boolean(post.viewerState?.followingAuthor),
    liked: Boolean(post.viewerState?.liked),
    bookmarked: Boolean(post.viewerState?.bookmarked),
  };
}
