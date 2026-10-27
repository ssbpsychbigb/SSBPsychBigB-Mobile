/**
 * Saved library — internal stack screen (not a tab). Live `GET /bookmarks`.
 */

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import { FeedPostVideo, postVideoUri } from '@/features/feed/components/FeedPostVideo';
import { usePostCardActions } from '@/features/feed/hooks/usePostCardActions';
import { bookmarkKeys, useBookmarksQuery } from '@/features/feed/hooks/usePostQueries';
import { toFeedCardPost } from '@/features/feed/lib/to-feed-card-post';
import type { FeedPage, FeedPost } from '@/features/feed/types/feed.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, SocialStackChrome, Spinner, usePullToRefresh } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

type SavedFilter = 'all' | 'posts' | 'reels';

const FILTERS: { key: SavedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'posts', label: 'Posts' },
  { key: 'reels', label: 'Reels' },
];

/**
 * Bookmarks opened from Profile or post save — back to Feed.
 */
export function BookmarkScreen() {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);
  const openRegister = useOpenAuth('Register');
  const openLogin = useOpenAuth('Login');

  if (!accessToken) {
    return (
      <SocialStackChrome
        subtitle="Your private library"
        title="Saved">
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <View
            style={[styles.icon, { backgroundColor: theme.colors.primaryMuted }]}>
            <Bookmark color={theme.colors.primary} size={ms(28)} />
          </View>
          <AppText style={styles.center} variant="subtitle" weight="bold">
            Save what matters
          </AppText>
          <AppText color="secondary" style={styles.center} variant="body">
            Bookmark posts and reels after you join. They stay here until you
            unsave them.
          </AppText>
          <Button fullWidth onPress={openRegister}>
            Join BIGB
          </Button>
          <Button fullWidth onPress={openLogin} variant="secondary">
            Log in
          </Button>
        </View>
      </SocialStackChrome>
    );
  }

  return <SavedLibrary token={accessToken} />;
}

function SavedLibrary({ token }: { token: string }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const goRoot = useRootNavigate();
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState<SavedFilter>('all');

  const savedQuery = useBookmarksQuery(token);
  const allItems = useMemo(
    () => savedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [savedQuery.data],
  );
  const items = useMemo(() => {
    if (filter === 'all') {
      return allItems;
    }
    return allItems.filter((post) =>
      filter === 'reels' ? Boolean(postVideoUri(post)) : !postVideoUri(post),
    );
  }, [allItems, filter]);

  // Unsaving drops the row immediately; the server refetch confirms it.
  const patch = (postId: string, updater: (post: FeedPost) => FeedPost) => {
    queryClient.setQueryData<InfiniteData<FeedPage>>(bookmarkKeys.list(token), (current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: page.items
            .map((item) => (item.id === postId ? updater(item) : item))
            .filter((item) => item.viewerState?.bookmarked !== false),
        })),
      };
    });
  };
  const actions = usePostCardActions(token, patch);

  const refreshControl = usePullToRefresh(() => savedQuery.refetch());

  const openPost = (postId: string, openComments?: boolean) =>
    goRoot('PostDetail', { postId, openComments });

  const openProfile = (username?: string, name?: string) => {
    if (!username?.trim()) {
      showToast.error('Profile unavailable', 'This member has no public username yet.');
      return;
    }
    goRoot('MemberProfile', { username: username.trim(), name });
  };

  return (
    <SocialStackChrome
      onNearEnd={() => {
        if (savedQuery.hasNextPage && !savedQuery.isFetchingNextPage) {
          void savedQuery.fetchNextPage();
        }
      }}
      refreshControl={refreshControl}
      subtitle="Posts and reels you keep"
      title="Saved">
      <View style={styles.chips}>
        {FILTERS.map((chip) => {
          const active = chip.key === filter;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={chip.key}
              onPress={() => setFilter(chip.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.background,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}>
              <AppText
                color={active ? 'inverse' : 'secondary'}
                variant="caption"
                weight="semibold">
                {chip.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {savedQuery.isPending ? <Spinner /> : null}

      {savedQuery.isError ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText style={styles.center} variant="label">
            Could not load your saved items
          </AppText>
          <Button fullWidth onPress={() => void savedQuery.refetch()} variant="secondary">
            Try again
          </Button>
        </View>
      ) : null}

      {!savedQuery.isPending && !savedQuery.isError && items.length === 0 ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <View style={[styles.icon, { backgroundColor: theme.colors.primaryMuted }]}>
            <Bookmark color={theme.colors.primary} size={ms(28)} />
          </View>
          <AppText style={styles.center} variant="subtitle" weight="bold">
            {filter === 'reels'
              ? 'No saved reels yet'
              : filter === 'posts'
                ? 'No saved posts yet'
                : 'Nothing saved yet'}
          </AppText>
          <AppText color="secondary" style={styles.center} variant="body">
            Tap the bookmark on any post or reel and it will appear here.
          </AppText>
        </View>
      ) : null}

      {items.map((post) => {
        const isOwn = Boolean(user?.id && post.authorId === user.id);
        const hasVideo = Boolean(postVideoUri(post));
        return (
          <View key={post.id} style={styles.cardWrap}>
            <FeedPostCard
              liked={Boolean(post.viewerState?.liked)}
              mediaSlot={
                hasVideo ? (
                  <FeedPostVideo mode="tile" onPress={() => openPost(post.id)} post={post} />
                ) : undefined
              }
              onAuthorPress={() => openProfile(post.author?.username, post.author?.fullName)}
              onComment={() => openPost(post.id, true)}
              onFollow={() => actions.toggleFollow(post.author?.id || post.authorId)}
              onMenu={() => openPost(post.id)}
              onOpen={() => openPost(post.id)}
              onReact={() => actions.toggleLike(post.id)}
              onSave={() => actions.toggleSave(post.id)}
              onShare={() => void actions.share(post.id)}
              post={{ ...toFeedCardPost(post), isOwn }}
              saved={Boolean(post.viewerState?.bookmarked)}
            />
          </View>
        );
      })}

      {savedQuery.isFetchingNextPage ? <Spinner /> : null}
    </SocialStackChrome>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: ms(20),
    padding: ms(20),
    alignItems: 'center',
    gap: ms(10),
  },
  icon: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(4),
  },
  center: {
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: vs(14),
  },
  chip: {
    paddingHorizontal: s(16),
    height: ms(34),
    borderRadius: ms(17),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    marginBottom: vs(14),
  },
});
