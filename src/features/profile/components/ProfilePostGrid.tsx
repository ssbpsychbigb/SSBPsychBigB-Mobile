/**
 * Profile media — Instagram tabs for Posts, Reels, and Collaborations.
 * A photo fills the tile. A reel is a square with a play mark. Words stay off the photo.
 */

import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Clapperboard,
  ImageOff,
  Layers,
  LayoutGrid,
  Pin,
  Play,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { FeedPost } from '@/features/feed/types/feed.types';
import {
  profileApi,
  profilePostKeys,
  type ProfileGridKind,
} from '@/features/profile/api/profile.api';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Spinner } from '@/shared/ui';

const GAP = 2;
const COLUMNS = 3;

const TABS: { key: ProfileGridKind; label: string; Icon: LucideIcon }[] = [
  { key: 'posts', label: 'Posts', Icon: LayoutGrid },
  { key: 'reels', label: 'Reels', Icon: Clapperboard },
  { key: 'collabs', label: 'Collaborations', Icon: Users },
];

const EMPTY: Record<ProfileGridKind, string> = {
  posts: 'No posts yet',
  reels: 'No reels yet',
  collabs: 'Photos and videos you are tagged in will show here.',
};

function coverUri(post: FeedPost): string | undefined {
  const image = post.media.find((item) => item.mediaType === 'image');
  const video = post.media.find((item) => item.mediaType === 'video');
  return resolveUploadUrl(image?.url || video?.thumbnail || undefined) || undefined;
}

function isVideoPost(post: FeedPost): boolean {
  return post.type === 'video' || post.media.some((item) => item.mediaType === 'video');
}

function imageCount(post: FeedPost): number {
  return post.media.filter((item) => item.mediaType === 'image').length;
}

export function ProfilePostGrid({
  username,
  bleed = 0,
}: {
  username: string;
  /** Pull the grid out to the screen edge when a parent adds horizontal padding. */
  bleed?: number;
}) {
  const theme = useTheme();
  const goRoot = useRootNavigate();
  const token = useAuthStore((state) => state.accessToken);
  const [tab, setTab] = useState<ProfileGridKind>('posts');
  const [width, setWidth] = useState(0);
  const tile = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  const noteColor = theme.mode === 'dark' ? '#2A2A2A' : '#F2F2F2';
  const inactive = theme.colors.textMuted;

  const postsQuery = useInfiniteQuery({
    queryKey: profilePostKeys.list(username, token || 'guest', tab),
    enabled: Boolean(username),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => profileApi.getPosts(username, token, pageParam, tab),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
  });

  const items = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [postsQuery.data],
  );

  return (
    <View style={[styles.wrap, bleed ? { marginHorizontal: -bleed } : null]}>
      <View style={[styles.tabs, { borderBottomColor: theme.colors.border }]}>
        {TABS.map((item) => {
          const active = tab === item.key;
          const color = active ? theme.colors.primary : inactive;
          return (
            <Pressable
              key={item.key}
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.key)}
              style={styles.tab}>
              <item.Icon color={color} size={ms(22)} strokeWidth={active ? 2.3 : 1.8} />
              <View
                style={[
                  styles.tabLine,
                  {
                    backgroundColor: active ? theme.colors.primary : 'transparent',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View
        onLayout={(event) => {
          const next = Math.round(event.nativeEvent.layout.width);
          setWidth((current) => (current === next ? current : next));
        }}
        style={styles.stage}>
        {postsQuery.isPending ? (
          <View style={styles.state}>
            <Spinner size="small" />
          </View>
        ) : null}

        {postsQuery.isError ? (
          <Pressable onPress={() => void postsQuery.refetch()} style={styles.state}>
            <AppText variant="caption" weight="semibold">
              Could not load this. Tap to try again.
            </AppText>
          </Pressable>
        ) : null}

        {!postsQuery.isPending && !postsQuery.isError && items.length === 0 ? (
          <View style={styles.state}>
            <AppText color="muted" style={styles.empty} variant="caption">
              {EMPTY[tab]}
            </AppText>
          </View>
        ) : null}

        <View style={styles.grid}>
          {items.map((post) => (
            <GridTile
              key={post.id}
              noteColor={noteColor}
              onPress={() => goRoot('PostDetail', { postId: post.id })}
              post={post}
              reel={tab === 'reels' || isVideoPost(post)}
              size={tile}
            />
          ))}
        </View>
      </View>

      {postsQuery.hasNextPage ? (
        <Pressable
          disabled={postsQuery.isFetchingNextPage}
          onPress={() => void postsQuery.fetchNextPage()}
          style={styles.more}>
          <AppText color="muted" variant="caption" weight="semibold">
            {postsQuery.isFetchingNextPage ? 'Loading…' : 'Show more'}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function GridTile({
  post,
  size,
  noteColor,
  reel,
  onPress,
}: {
  post: FeedPost;
  size: number;
  noteColor: string;
  reel: boolean;
  onPress: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const uri = coverUri(post);
  const showPhoto = Boolean(uri) && !failed;
  const several = imageCount(post) > 1;
  const caption = post.content.trim();

  return (
    <Pressable
      accessibilityLabel={caption || 'Open post'}
      onPress={onPress}
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: showPhoto ? '#111111' : reel ? '#1A1A1A' : noteColor,
        },
      ]}>
      {showPhoto && uri ? (
        <Image
          onError={() => setFailed(true)}
          resizeMode="cover"
          source={{ uri }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {!showPhoto && !reel && post.media.length === 0 && caption ? (
        <AppText numberOfLines={3} style={styles.note} variant="caption">
          {caption}
        </AppText>
      ) : null}

      {!showPhoto && !reel && post.media.length > 0 ? (
        <ImageOff color="#8E8E8E" size={ms(18)} strokeWidth={1.8} />
      ) : null}

      {reel && !showPhoto ? (
        <Play color="#FFFFFF" fill="#FFFFFF" size={ms(22)} />
      ) : null}

      {reel && showPhoto ? (
        <View style={styles.badge}>
          <Play color="#FFFFFF" fill="#FFFFFF" size={ms(12)} />
        </View>
      ) : null}

      {several && !reel ? (
        <View style={styles.badge}>
          <Layers color="#FFFFFF" size={ms(14)} strokeWidth={2.2} />
        </View>
      ) : null}

      {post.pinnedAt ? (
        <View style={styles.pin}>
          <Pin color="#FFFFFF" fill="#FFFFFF" size={ms(12)} strokeWidth={2.2} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: vs(12),
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: vs(12),
  },
  tabLine: {
    marginTop: vs(10),
    height: 2,
    alignSelf: 'stretch',
  },
  stage: {
    marginTop: vs(12),
  },
  state: {
    minHeight: vs(120),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(28),
  },
  empty: {
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    textAlign: 'center',
    paddingHorizontal: s(8),
  },
  badge: {
    position: 'absolute',
    top: s(6),
    right: s(6),
  },
  pin: {
    position: 'absolute',
    top: s(6),
    left: s(6),
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  more: {
    alignItems: 'center',
    paddingVertical: vs(14),
  },
});
