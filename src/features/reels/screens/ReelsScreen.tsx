/**
 * Reels tab — live `/feed/reels` explore grid, then full-screen player.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Search, X } from 'lucide-react-native';

import { useAppTabs } from '@/app/navigation/AppTabsContext';
import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { toMultipartFilePart } from '@/features/auth/lib/upload-asset';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { feedApi } from '@/features/feed/api/feed.api';
import { FeedCommentsSheet } from '@/features/feed/components/FeedCommentsSheet';
import { feedKeys } from '@/features/feed/hooks/useFeedQueries';
import type { FeedPage, FeedPost } from '@/features/feed/types/feed.types';
import { ReelComposeSheet } from '@/features/reels/components/ReelComposeSheet';
import { ReelExploreTile } from '@/features/reels/components/ReelExploreTile';
import { ReelsPlayer } from '@/features/reels/components/ReelsPlayer';
import { reelKeys, useReelsQuery } from '@/features/reels/hooks/useReelsQueries';
import { playlistFromSelection } from '@/features/reels/lib/playlist-from-selection';
import { toPrepReel } from '@/features/reels/lib/to-prep-reel';
import { requireMemberProfileParams } from '@/features/profile';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Screen, ScreenHeader, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type GateKind = 'like' | 'comment' | 'share' | 'save' | 'follow' | 'compose';

const GATE_COPY: Record<GateKind, { title: string; message: string }> = {
  like: {
    title: 'Join to like',
    message: 'Watch is free. Join BIGB to like this reel.',
  },
  comment: {
    title: 'Join to comment',
    message: 'Watch is free. Join BIGB to comment on this reel.',
  },
  share: {
    title: 'Join to send',
    message: 'Watch is free. Join BIGB to send this reel.',
  },
  save: {
    title: 'Save this reel',
    message: 'Saved clips live in your library after you join.',
  },
  follow: {
    title: 'Follow on BIGB',
    message: 'Join to follow mentors and institutes from Reels.',
  },
  compose: {
    title: 'Post a Reel',
    message: 'Join BIGB to share a prep clip. Stories stay on Home for 24 hours.',
  },
};

const GRID_GAP = 1.5;
const GRID_COLUMNS = 3;
const FILTERS = ['All', 'Psychology', 'GTO', 'Interview', 'OIR'] as const;

type FilterKey = (typeof FILTERS)[number];

function patchPostInPages(
  pages: FeedPage[] | undefined,
  postId: string,
  updater: (post: FeedPost) => FeedPost,
): FeedPage[] | undefined {
  if (!pages) {
    return pages;
  }
  return pages.map((page) => ({
    ...page,
    items: (page.items || []).map((item) =>
      item.id === postId ? updater(item) : item,
    ),
  }));
}

function patchFollowInPages(
  pages: FeedPage[] | undefined,
  authorId: string,
  following: boolean,
): FeedPage[] | undefined {
  if (!pages) {
    return pages;
  }
  return pages.map((page) => ({
    ...page,
    items: (page.items || []).map((item) =>
      item.authorId === authorId || item.author?.id === authorId
        ? {
            ...item,
            viewerState: {
              liked: Boolean(item.viewerState?.liked),
              bookmarked: Boolean(item.viewerState?.bookmarked),
              followingAuthor: following,
            },
          }
        : item,
    ),
  }));
}

/**
 * Explore first. Tap a tile to open a watch queue from live video posts.
 */
export function ReelsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const { activeKey, setReelsPlayerOpen, reelComposeNonce } = useAppTabs();
  const goRoot = useRootNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const session = accessToken || 'guest';

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('All');
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [gate, setGate] = useState<GateKind | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  const reelsQuery = useReelsQuery(accessToken);

  const tabFocused = activeKey === 'reels';
  const copy = gate ? GATE_COPY[gate] : GATE_COPY.like;
  const tileSize = (width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  const allReels = useMemo(() => {
    const items = reelsQuery.data?.pages.flatMap((page) => page.items || []) ?? [];
    return items
      .map((post) => toPrepReel(post, user?.id))
      .filter((reel): reel is NonNullable<typeof reel> => Boolean(reel));
  }, [reelsQuery.data, user?.id]);

  const byId = useMemo(() => {
    const map = new Map(allReels.map((reel) => [reel.id, reel]));
    return map;
  }, [allReels]);

  const visibleReels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allReels.filter((reel) => {
      if (filter !== 'All' && reel.category !== filter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        reel.title.toLowerCase().includes(needle) ||
        reel.author.toLowerCase().includes(needle) ||
        reel.category.toLowerCase().includes(needle) ||
        reel.synopsis.toLowerCase().includes(needle)
      );
    });
  }, [allReels, filter, query]);

  const playlist = useMemo(
    () => queueIds.map((id) => byId.get(id)).filter((reel): reel is NonNullable<typeof reel> => Boolean(reel)),
    [byId, queueIds],
  );

  useEffect(() => {
    setReelsPlayerOpen(playerOpen);
    return () => setReelsPlayerOpen(false);
  }, [playerOpen, setReelsPlayerOpen]);

  useEffect(() => {
    if (activeKey !== 'reels') {
      autoOpenedRef.current = false;
      setPlayerOpen(false);
      return;
    }
    if (reelsQuery.isPending || reelsQuery.isError || autoOpenedRef.current) {
      return;
    }
    if (allReels.length === 0) {
      return;
    }
    autoOpenedRef.current = true;
    setQueueIds(allReels.map((reel) => reel.id));
    setPlayerOpen(true);
  }, [activeKey, allReels, reelsQuery.isError, reelsQuery.isPending]);

  useEffect(() => {
    if (reelComposeNonce > 0 && activeKey === 'reels') {
      requireMember('compose', () => setComposeOpen(true));
    }
    // * Only react to Feed → Reels compose requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nonce is the trigger
  }, [reelComposeNonce]);

  const requireMember = (kind: GateKind, authedFn?: () => void) => {
    if (!accessToken) {
      setGate(kind);
      return;
    }
    authedFn?.();
  };

  const patchReelsCache = (
    updater: (pages: FeedPage[] | undefined) => FeedPage[] | undefined,
  ) => {
    queryClient.setQueryData(
      reelKeys.list(session),
      (current: { pages: FeedPage[]; pageParams: unknown[] } | undefined) => {
        if (!current) {
          return current;
        }
        return { ...current, pages: updater(current.pages) ?? current.pages };
      },
    );
  };

  const likeMutation = useMutation({
    mutationFn: (postId: string) => feedApi.toggleLike(postId, accessToken as string),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: reelKeys.list(session) });
      patchReelsCache((pages) =>
        patchPostInPages(pages, postId, (post) => {
          const liked = !post.viewerState?.liked;
          return {
            ...post,
            stats: {
              ...post.stats,
              likes: Math.max(0, post.stats.likes + (liked ? 1 : -1)),
            },
            viewerState: {
              liked,
              bookmarked: Boolean(post.viewerState?.bookmarked),
              followingAuthor: Boolean(post.viewerState?.followingAuthor),
            },
          };
        }),
      );
    },
    onError: (error) => {
      showErrorToast(error, 'Could not like this reel.', 'Reels');
      void queryClient.invalidateQueries({ queryKey: reelKeys.all });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (postId: string) =>
      feedApi.toggleBookmark(postId, accessToken as string),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: reelKeys.list(session) });
      patchReelsCache((pages) =>
        patchPostInPages(pages, postId, (post) => {
          const bookmarked = !post.viewerState?.bookmarked;
          return {
            ...post,
            stats: {
              ...post.stats,
              saves: Math.max(0, post.stats.saves + (bookmarked ? 1 : -1)),
            },
            viewerState: {
              liked: Boolean(post.viewerState?.liked),
              bookmarked,
              followingAuthor: Boolean(post.viewerState?.followingAuthor),
            },
          };
        }),
      );
    },
    onError: (error) => {
      showErrorToast(error, 'Could not save this reel.', 'Reels');
      void queryClient.invalidateQueries({ queryKey: reelKeys.all });
    },
  });

  const followMutation = useMutation({
    mutationFn: (authorId: string) =>
      feedApi.toggleFollow(authorId, accessToken as string),
    onSuccess: (result, authorId) => {
      patchReelsCache((pages) => patchFollowInPages(pages, authorId, result.following));
      void queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
    onError: (error) => {
      showErrorToast(error, 'Could not update follow.', 'Reels');
    },
  });

  const composeMutation = useMutation({
    mutationFn: async (input: {
      caption: string;
      video: PickedAsset;
      category: string;
    }) => {
      if (!accessToken) {
        throw new Error('Not signed in');
      }
      const formData = new FormData();
      formData.append(
        'media',
        toMultipartFilePart(input.video, 'media') as unknown as Blob,
      );
      const uploaded = await feedApi.uploadMedia(formData, accessToken);
      return feedApi.createPost(
        {
          content: input.caption,
          type: 'video',
          visibility: 'public',
          categories: [input.category],
          media: uploaded.media,
        },
        accessToken,
      );
    },
    onSuccess: (post) => {
      setComposeOpen(false);
      void queryClient.invalidateQueries({ queryKey: reelKeys.all });
      void queryClient.invalidateQueries({ queryKey: feedKeys.all });
      showToast.success('Reel posted', 'It is live on Reels and the Home feed.');
      if (post?.id) {
        autoOpenedRef.current = true;
        setQueueIds((current) => [post.id, ...current.filter((id) => id !== post.id)]);
        setPlayerOpen(true);
      }
    },
    onError: (error) => {
      showErrorToast(error, 'Could not publish this reel.', 'Reels');
    },
  });

  const openCompose = () => requireMember('compose', () => setComposeOpen(true));

  const openPlayer = (id: string) => {
    setQueueIds(playlistFromSelection(visibleReels, id).map((reel) => reel.id));
    setPlayerOpen(true);
  };

  const shareReel = (postId: string) => {
    void (async () => {
      try {
        const payload = await feedApi.sharePost(postId, accessToken as string);
        await Share.share({
          message: payload.targets.copy || payload.url,
          url: payload.url,
        });
      } catch (error) {
        showErrorToast(error, 'Could not share this reel.', 'Reels');
      }
    })();
  };

  const canvas =
    theme.mode === 'dark' ? theme.colors.background : theme.palette.primary[50];

  if (playerOpen) {
    return (
      <>
        <ReelsPlayer
          onClose={() => setPlayerOpen(false)}
          onComment={(id) => setCommentPostId(id)}
          onCreate={openCompose}
          onAuthorPress={(reel) => {
            const params = requireMemberProfileParams(reel.authorUsername, reel.author);
            if (params) {
              goRoot('MemberProfile', params);
            }
          }}
          onFollow={(authorId) =>
            requireMember('follow', () => followMutation.mutate(authorId))
          }
          onLike={(id) => requireMember('like', () => likeMutation.mutate(id))}
          onOpenMessages={() => goRoot('Messages')}
          onSave={(id) => requireMember('save', () => saveMutation.mutate(id))}
          onShare={(id) => requireMember('share', () => shareReel(id))}
          playlist={playlist}
          overlayOpen={Boolean(commentPostId)}
          tabFocused={tabFocused}
        />
        <FeedCommentsSheet
          onAdded={() => void queryClient.invalidateQueries({ queryKey: reelKeys.all })}
          onAuthorPress={(username, name) => {
            const params = requireMemberProfileParams(username, name);
            if (params) {
              goRoot('MemberProfile', params);
            }
          }}
          onClose={() => setCommentPostId(null)}
          postId={commentPostId}
          token={accessToken}
          visible={Boolean(commentPostId)}
        />
        <ReelComposeSheet
          busy={composeMutation.isPending}
          onClose={() => setComposeOpen(false)}
          onSubmit={(input) => composeMutation.mutate(input)}
          visible={composeOpen}
        />
        <JoinToContinueSheet
          message={copy.message}
          onClose={() => setGate(null)}
          title={copy.title}
          visible={Boolean(gate)}
        />
      </>
    );
  }

  return (
    <>
      <Screen
        contentStyle={styles.shell}
        padded={false}
        safeBottom={false}
        style={{ backgroundColor: canvas }}>
        <View style={styles.headerPad}>
          <ScreenHeader padded={false} style={styles.headerRow}>
            <AppText variant="subtitle" weight="bold">
              Reels
            </AppText>
            <Pressable
              accessibilityLabel="Create reel"
              hitSlop={10}
              onPress={openCompose}
              style={styles.cameraBtn}>
              <Camera color={theme.colors.text} size={ms(22)} strokeWidth={2.2} />
            </Pressable>
          </ScreenHeader>
          <View
            style={[
              styles.search,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}>
            <Search color={theme.colors.textMuted} size={ms(18)} strokeWidth={2} />
            <TextInput
              onChangeText={setQuery}
              placeholder="Search prep reels, mentors, GTO…"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.searchInput,
                { color: theme.colors.text, fontFamily: resolveFontFamily('regular') },
              ]}
              value={query}
            />
            {query ? (
              <Pressable
                accessibilityLabel="Clear search"
                hitSlop={8}
                onPress={() => setQuery('')}>
                <X color={theme.colors.textMuted} size={ms(16)} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}>
          {FILTERS.map((item) => {
            const active = filter === item;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.background,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}>
                <AppText
                  color={active ? 'inverse' : 'secondary'}
                  variant="caption"
                  weight="semibold">
                  {item}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {reelsQuery.isPending ? <Spinner /> : null}

        {reelsQuery.isError ? (
          <View style={styles.empty}>
            <AppText variant="label">Could not load reels</AppText>
            <AppText color="secondary" style={styles.emptyCopy} variant="caption">
              Check that the API is reachable, then retry.
            </AppText>
            <Pressable onPress={() => void reelsQuery.refetch()}>
              <AppText color="brand" variant="caption" weight="semibold">
                Retry
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {!reelsQuery.isPending && !reelsQuery.isError && visibleReels.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="label">
              {allReels.length === 0 ? 'No prep reels yet' : 'No reels match that search'}
            </AppText>
            <AppText color="secondary" style={styles.emptyCopy} variant="caption">
              {allReels.length === 0
                ? 'Be the first. Camera on this tab posts a Reel — not a 24h story.'
                : 'Try a mentor name, GTO, interview, or psychology.'}
            </AppText>
            {allReels.length === 0 ? (
              <Pressable onPress={openCompose}>
                <AppText color="brand" variant="caption" weight="semibold">
                  Create a Reel
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!reelsQuery.isPending && !reelsQuery.isError && visibleReels.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.grid}
            refreshControl={
              <RefreshControl
                onRefresh={() => void reelsQuery.refetch()}
                refreshing={reelsQuery.isRefetching}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            style={styles.gridScroll}>
            {visibleReels.map((reel) => (
              <ReelExploreTile
                key={reel.id}
                onPress={() => openPlayer(reel.id)}
                reel={reel}
                size={tileSize}
              />
            ))}
            {reelsQuery.hasNextPage ? (
              <Pressable
                onPress={() => void reelsQuery.fetchNextPage()}
                style={styles.more}>
                <AppText color="brand" variant="caption" weight="semibold">
                  {reelsQuery.isFetchingNextPage ? 'Loading…' : 'Load more reels'}
                </AppText>
              </Pressable>
            ) : null}
          </ScrollView>
        ) : null}
      </Screen>
      <ReelComposeSheet
        busy={composeMutation.isPending}
        onClose={() => setComposeOpen(false)}
        onSubmit={(input) => composeMutation.mutate(input)}
        visible={composeOpen}
      />
      <JoinToContinueSheet
        message={copy.message}
        onClose={() => setGate(null)}
        title={copy.title}
        visible={Boolean(gate)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  headerPad: {
    paddingHorizontal: s(16),
  },
  headerRow: {
    justifyContent: 'space-between',
  },
  cameraBtn: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    minHeight: vs(44),
    marginBottom: vs(10),
  },
  searchInput: {
    flex: 1,
    paddingVertical: vs(8),
    fontSize: 15,
  },
  filterRow: {
    flexGrow: 0,
    marginBottom: vs(8),
  },
  filters: {
    paddingHorizontal: s(16),
    gap: s(8),
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(7),
  },
  gridScroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingBottom: vs(24),
  },
  more: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: vs(16),
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(32),
    gap: vs(6),
  },
  emptyCopy: {
    textAlign: 'center',
  },
});
