/**
 * Public community feed — first tab for guests and signed-in users.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Trash2 } from 'lucide-react-native';

import { useAppTabsActions } from '@/app/navigation/AppTabsContext';
import { useTabBarInset } from '@/shared/lib/use-tab-bar-inset';
import { useRootNavigate } from '@/app/navigation/useRootNavigate';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { toMultipartFilePart } from '@/features/auth/lib/upload-asset';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { dayBriefApi, feedApi } from '@/features/feed/api/feed.api';
import { profilePostKeys } from '@/features/profile/api/profile.api';
import {
  DayBriefComposeSheet,
  type DayBriefComposeInput,
} from '@/features/feed/components/DayBriefComposeSheet';
import { DayBriefStrip } from '@/features/feed/components/DayBriefStrip';
import { DayBriefViewer } from '@/features/feed/components/DayBriefViewer';
import { DayBriefViewersSheet } from '@/features/feed/components/DayBriefViewersSheet';
import { NewMessageSheet } from '@/features/message/components/NewMessageSheet';
import { chatApi } from '@/features/message/api/chat.api';
import type { ChatPerson } from '@/features/message/types/chat.types';
import type { DayBriefItem, DayBriefTray } from '@/features/feed/types/feed.types';
import { FeedCommentsSheet } from '@/features/feed/components/FeedCommentsSheet';
import { EditPostSheet, type EditPostTarget } from '@/features/feed/components/EditPostSheet';
import {
  FeedComposeSheet,
  type FeedComposeInput,
} from '@/features/feed/components/FeedComposeSheet';
import { FeedComposerCard } from '@/features/feed/components/FeedComposerCard';
import { FeedHeader } from '@/features/feed/components/FeedHeader';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import {
  FeedPostMenu,
  FeedReportSheet,
  type FeedPostMenuTarget,
} from '@/features/feed/components/FeedPostMenu';
import { FeedSegmentTabs } from '@/features/feed/components/FeedSegmentTabs';
import {
  type FeedPreviewBrief,
  type FeedTabKey,
} from '@/features/feed/data/feed-preview';
import {
  dayBriefKeys,
  feedKeys,
  useDayBriefsQuery,
  useFeedTimelineQuery,
} from '@/features/feed/hooks/useFeedQueries';
import { bookmarkKeys } from '@/features/feed/hooks/usePostQueries';
import { draftKeys } from '@/features/feed/hooks/usePostDrafts';
import { buildDayBriefStrip } from '@/features/feed/lib/build-day-brief-strip';
import { groupDayBriefs } from '@/features/feed/lib/group-day-briefs';
import { resolveComposeMedia } from '@/features/feed/lib/upload-post-image';
import { toFeedCardPost } from '@/features/feed/lib/to-feed-card-post';
import { chatKeys, useChatUnreadQuery } from '@/features/message/hooks/useChatQueries';
import {
  notificationKeys,
  useNotificationUnreadQuery,
} from '@/features/notifications/hooks/useNotificationQueries';
import type { FeedPage, FeedPost } from '@/features/feed/types/feed.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, Screen, Spinner, usePullToRefresh } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type GateReason =
  | 'react'
  | 'comment'
  | 'save'
  | 'follow'
  | 'compose'
  | 'story'
  | 'share'
  | 'moderate';

const GATE_COPY: Record<GateReason, { title: string; message: string }> = {
  react: {
    title: 'React to posts',
    message: 'Join BIGB to support officers, educators, and fellow aspirants.',
  },
  comment: {
    title: 'Join the discussion',
    message: 'Comments are for members. Create an account to add your take.',
  },
  save: {
    title: 'Save for later',
    message: 'Bookmarks stay in your library after you join.',
  },
  follow: {
    title: 'Build your prep circle',
    message: 'Follow officers and mentors once you are signed in.',
  },
  compose: {
    title: 'Share with the community',
    message: 'Public posts and briefs need a BIGB account.',
  },
  story: {
    title: 'Share a story',
    message: '24-hour stories are for members. Reels are a separate tab.',
  },
  share: {
    title: 'Share this post',
    message: 'Outbound share unlocks after you join so we can count it fairly.',
  },
  moderate: {
    title: 'Manage this post',
    message: 'Report, pin, and delete are for members.',
  },
};

function appendImagePart(formData: FormData, asset: PickedAsset): void {
  formData.append('media', toMultipartFilePart(asset, 'media') as unknown as Blob);
}

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
    items: page.items.map((item) => (item.id === postId ? updater(item) : item)),
  }));
}

/**
 * Instagram + LinkedIn hybrid feed. Live `/feed/*` and `/posts/*` APIs.
 */
export function FeedScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthed = Boolean(accessToken);
  const sessionKey = accessToken || 'guest';
  const openRegister = useOpenAuth('Register');
  const goRoot = useRootNavigate();
  const { jumpTo, requestReelCompose } = useAppTabsActions();

  const openMemberProfile = (username?: string, name?: string) => {
    if (!username?.trim()) {
      showToast.error('Profile unavailable', 'This member has no public username yet.');
      return;
    }
    goRoot('MemberProfile', { username: username.trim(), name });
  };

  const [tab, setTab] = useState<FeedTabKey>('forYou');
  const [gate, setGate] = useState<GateReason | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [briefComposeOpen, setBriefComposeOpen] = useState(false);
  const [briefSeedCaption, setBriefSeedCaption] = useState<string | undefined>();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [viewerStartId, setViewerStartId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewersBriefId, setViewersBriefId] = useState<string | null>(null);
  const [shareBrief, setShareBrief] = useState<DayBriefItem | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [menuTarget, setMenuTarget] = useState<FeedPostMenuTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditPostTarget | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const timelineEnabled = tab !== 'following' || isAuthed;
  const timelineQuery = useFeedTimelineQuery(tab, accessToken, timelineEnabled);
  const briefsQuery = useDayBriefsQuery(accessToken);
  const chatUnreadQuery = useChatUnreadQuery(accessToken);
  const alertUnreadQuery = useNotificationUnreadQuery(accessToken);

  // Badges must be current when the user comes back from Messages or Alerts.
  useFocusEffect(
    useCallback(() => {
      if (!accessToken) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread(accessToken) });
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.unread(accessToken),
      });
      void queryClient.invalidateQueries({ queryKey: feedKeys.all });
      void queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
    }, [accessToken, queryClient]),
  );

  const posts = useMemo(() => {
    const items = timelineQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return items.map((post) => ({
      api: post,
      card: {
        ...toFeedCardPost(post),
        isOwn: Boolean(
          user?.id && String(post.authorId || post.author?.id || '') === String(user.id),
        ),
      },
    }));
  }, [timelineQuery.data, user?.id]);

  const liveBriefs = briefsQuery.data?.items || [];

  const briefTiles = useMemo(
    () =>
      buildDayBriefStrip({
        liveItems: liveBriefs,
        viewerId: user?.id,
      }),
    [liveBriefs, user?.id],
  );

  const briefTrays = useMemo(
    () => groupDayBriefs({ items: liveBriefs, viewerId: user?.id }),
    [liveBriefs, user?.id],
  );

  const openBriefTray = (tile: FeedPreviewBrief) => {
    const firstId = tile.briefIds?.[0];
    if (!firstId) {
      return;
    }
    // Prefer first unviewed segment when opening someone else's tray.
    const tray = briefTrays.find((item) =>
      tile.isSelf ? item.isSelf : item.creatorId === tile.authorId,
    );
    const startId =
      tray?.items.find((item) => !item.viewed)?.id ||
      tray?.items[0]?.id ||
      firstId;
    setViewerStartId(startId);
    setViewerOpen(true);
  };

  const requireMember = (reason: GateReason, authedFallback?: () => void) => {
    if (!isAuthed || !accessToken) {
      setGate(reason);
      return;
    }
    authedFallback?.();
  };

  const invalidateFeed = () => {
    void queryClient.invalidateQueries({ queryKey: feedKeys.all });
    void queryClient.invalidateQueries({ queryKey: profilePostKeys.all });
  };

  const likeMutation = useMutation({
    mutationFn: (postId: string) => feedApi.toggleLike(postId, accessToken as string),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({
        queryKey: feedKeys.timeline(tab, sessionKey),
      });
      queryClient.setQueryData(
        feedKeys.timeline(tab, sessionKey),
        (current: { pages: FeedPage[]; pageParams: unknown[] } | undefined) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            pages: patchPostInPages(current.pages, postId, (post) => {
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
          };
        },
      );
    },
    onError: (error) => {
      invalidateFeed();
      showErrorToast(error, 'Could not update reaction.', 'Feed');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (postId: string) =>
      feedApi.toggleBookmark(postId, accessToken as string),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({
        queryKey: feedKeys.timeline(tab, sessionKey),
      });
      queryClient.setQueryData(
        feedKeys.timeline(tab, sessionKey),
        (current: { pages: FeedPage[]; pageParams: unknown[] } | undefined) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            pages: patchPostInPages(current.pages, postId, (post) => ({
              ...post,
              viewerState: {
                liked: Boolean(post.viewerState?.liked),
                bookmarked: !post.viewerState?.bookmarked,
                followingAuthor: Boolean(post.viewerState?.followingAuthor),
              },
            })),
          };
        },
      );
    },
    onError: (error) => {
      invalidateFeed();
      showErrorToast(error, 'Could not update bookmark.', 'Feed');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
    },
  });

  const reportMutation = useMutation({
    mutationFn: (input: { postId: string; reason: string }) =>
      feedApi.reportPost(input.postId, { reason: input.reason }, accessToken as string),
    onSuccess: () => {
      setReportPostId(null);
      showToast.success('Reported', 'Thanks — moderators will review this post.');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not send this report.', 'Feed');
    },
  });

  const pinMutation = useMutation({
    mutationFn: (postId: string) => feedApi.togglePin(postId, accessToken as string),
    onSuccess: (result) => {
      setMenuTarget(null);
      invalidateFeed();
      showToast.success(result.pinned ? 'Pinned to profile' : 'Unpinned');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not update pin.', 'Feed');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => feedApi.deletePost(postId, accessToken as string),
    onSuccess: () => {
      setDeletePostId(null);
      setMenuTarget(null);
      invalidateFeed();
      showToast.success('Post deleted');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not delete this post.', 'Feed');
    },
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) =>
      feedApi.toggleFollow(userId, accessToken as string),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({
        queryKey: feedKeys.timeline(tab, sessionKey),
      });
      const previous = queryClient.getQueryData<{
        pages: FeedPage[];
        pageParams: unknown[];
      }>(feedKeys.timeline(tab, sessionKey));
      queryClient.setQueryData(
        feedKeys.timeline(tab, sessionKey),
        (current: { pages: FeedPage[]; pageParams: unknown[] } | undefined) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.map((post) => {
                const authorId = String(post.author?.id || post.authorId || '');
                if (authorId !== String(userId)) {
                  return post;
                }
                const following = !post.viewerState?.followingAuthor;
                return {
                  ...post,
                  viewerState: {
                    liked: Boolean(post.viewerState?.liked),
                    bookmarked: Boolean(post.viewerState?.bookmarked),
                    followingAuthor: following,
                  },
                };
              }),
            })),
          };
        },
      );
      return { previous };
    },
    onError: (error, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKeys.timeline(tab, sessionKey), context.previous);
      }
      showErrorToast(error, 'Could not update follow.', 'Feed');
    },
    onSettled: () => {
      invalidateFeed();
    },
  });

  const composeMutation = useMutation({
    mutationFn: async (input: FeedComposeInput) => {
      if (!accessToken) {
        throw new Error('Not signed in');
      }
      const media = await resolveComposeMedia(input.media ?? [], accessToken);
      const post = await feedApi.createPost(
        {
          content: input.content,
          type: media?.length ? 'image' : 'text',
          visibility: 'public',
          categories: ['motivation'],
          media,
        },
        accessToken,
      );
      if (input.draftId) {
        await feedApi.deletePost(input.draftId, accessToken).catch(() => undefined);
      }
      return post;
    },
    onSuccess: (_post, input) => {
      setComposeOpen(false);
      invalidateFeed();
      if (input.draftId) {
        void queryClient.invalidateQueries({ queryKey: draftKeys.all });
      }
      showToast.success('Posted', 'Your post is live on the feed.');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not publish this post.', 'Feed');
    },
  });

  const briefMutation = useMutation({
    mutationFn: async (input: DayBriefComposeInput) => {
      if (!accessToken) {
        throw new Error('Not signed in');
      }
      const shared = {
        caption: input.caption,
        visibility: input.visibility,
        audienceUserIds:
          input.visibility === 'close_friends' ? input.audienceUserIds : undefined,
        excludeUserIds: input.excludeUserIds.length
          ? input.excludeUserIds
          : undefined,
        backgroundColor: input.backgroundColor,
        overlayText: input.overlayText,
        musicId: input.musicId,
        musicLabel: input.musicLabel,
        stickers: input.stickers,
      };
      const created = [];
      if (input.mode === 'text') {
        created.push(
          await dayBriefApi.create(accessToken, {
            ...shared,
            mediaType: 'text',
            durationSec: 8,
          }),
        );
        return created;
      }
      for (const image of input.images) {
        const formData = new FormData();
        appendImagePart(formData, image);
        const uploaded = await dayBriefApi.uploadMedia(formData, accessToken);
        created.push(
          await dayBriefApi.create(accessToken, {
            ...shared,
            mediaUrl: uploaded.url,
            mediaType: uploaded.mediaType,
            thumbnailUrl: uploaded.thumbnail,
            durationSec: uploaded.mediaType === 'video' ? 12 : 6,
          }),
        );
      }
      return created;
    },
    onSuccess: async (created, input) => {
      setBriefComposeOpen(false);
      setBriefSeedCaption(undefined);
      await queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
      const count =
        input.mode === 'text' ? 1 : Math.max(1, input.images.length);
      showToast.success(
        count > 1 ? `${count} stories shared` : 'Story shared',
        'Visible on Home for 24 hours. Not a Reel.',
      );
      const firstId = created[0]?.id;
      if (firstId) {
        setViewerStartId(firstId);
        setViewerOpen(true);
      }
    },
    onError: (error) => {
      showErrorToast(error, 'Could not share this brief.', 'Day Brief');
    },
  });

  const addPostToStoryMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!accessToken) {
        throw new Error('Not signed in');
      }
      const post = posts.find((item) => item.api.id === postId)?.api;
      if (!post) {
        throw new Error('Post not found');
      }
      const media = (post.media || []).find(
        (item) => item.mediaType === 'image' || item.mediaType === 'video',
      );
      if (media) {
        return dayBriefApi.create(accessToken, {
          caption: (post.content || '').slice(0, 280),
          mediaUrl: media.url,
          mediaType: media.mediaType === 'video' ? 'video' : 'image',
          thumbnailUrl: media.thumbnail || media.url,
          durationSec: media.mediaType === 'video' ? 12 : 6,
          visibility: 'public',
        });
      }
      const text = (post.content || '').trim();
      if (!text) {
        throw new Error('Nothing to add to story');
      }
      return dayBriefApi.create(accessToken, {
        caption: text.slice(0, 280),
        overlayText: text.slice(0, 160),
        mediaType: 'text',
        durationSec: 8,
        visibility: 'public',
      });
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
      showToast.success('Added to story', 'Visible on Home for 24 hours.');
      if (created?.id) {
        setViewerStartId(created.id);
        setViewerOpen(true);
      }
    },
    onError: (error) => {
      showErrorToast(error, 'Could not add this post to your story.', 'Story');
    },
  });

  const openStoryChat = async (
    person: { peerUserId?: string; peerUsername?: string; name?: string },
    draftText: string,
  ) => {
    if (!accessToken) {
      return;
    }
    setShareBusy(true);
    try {
      const conversation = await chatApi.createConversation({
        token: accessToken,
        peerUserId: person.peerUserId,
        peerUsername: person.peerUsername,
      });
      setShareBrief(null);
      setViewerOpen(false);
      goRoot('ChatThread', {
        conversationId: conversation.id,
        name: person.name || conversation.name,
        username: conversation.username || person.peerUsername,
        initialDraft: draftText,
      });
    } catch (error) {
      showErrorToast(error, 'Could not open chat.', 'Story');
    } finally {
      setShareBusy(false);
    }
  };

  const replyToStory = (brief: DayBriefItem, tray: DayBriefTray) => {
    requireMember('story', () => {
      const username = tray.username || brief.creator?.username;
      if (!username && !tray.creatorId) {
        showToast.info('Reply', 'This member cannot be messaged yet.');
        return;
      }
      void openStoryChat(
        {
          peerUserId: tray.creatorId,
          peerUsername: username,
          name: tray.name,
        },
        `Replied to your story${brief.caption ? `: ${brief.caption.slice(0, 80)}` : ''}`,
      );
    });
  };

  const reactToStory = (brief: DayBriefItem, emoji: string) => {
    if (!accessToken) {
      return;
    }
    void dayBriefApi
      .react(accessToken, brief.id, emoji)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
        showToast.success('Reaction sent', emoji);
      })
      .catch((error) => {
        showErrorToast(error, 'Could not react.', 'Story');
      });
  };

  const deleteBriefMutation = useMutation({
    mutationFn: (briefId: string) =>
      dayBriefApi.remove(accessToken as string, briefId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
      showToast.success('Story deleted', 'Removed from Home.');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not delete this story.', 'Day Brief');
    },
  });

  const tabBarInset = useTabBarInset();
  const canvas =
    theme.mode === 'dark' ? theme.colors.background : theme.palette.primary[50];

  const refreshControl = usePullToRefresh(() =>
    Promise.all([timelineQuery.refetch(), briefsQuery.refetch()]),
  );

  return (
    <>
      <Screen
        contentStyle={styles.shell}
        padded={false}
        safeBottom={false}
        style={{ backgroundColor: canvas }}>
        <View style={styles.pad}>
          <FeedHeader
            onOpenMessages={() => goRoot('Messages')}
            onOpenNotifications={() => goRoot('Notifications')}
            onOpenSearch={() => goRoot('Search')}
            unreadMessages={isAuthed ? chatUnreadQuery.data?.unreadCount ?? 0 : 0}
            unreadNotifications={isAuthed ? alertUnreadQuery.data?.unreadCount ?? 0 : 0}
          />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: vs(16) + tabBarInset }]}
          nestedScrollEnabled
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          style={styles.flex}>
          <DayBriefStrip
            briefs={briefTiles}
            isAuthed={isAuthed}
            onBriefPress={(tile) => openBriefTray(tile)}
            onSelfCompose={() =>
              requireMember('story', () => setBriefComposeOpen(true))
            }
          />

          <View style={styles.composerBlock}>
            <FeedComposerCard
              displayName={user?.fullName}
              isAuthed={isAuthed}
              onAction={(kind) => {
                if (kind === 'ai' && isAuthed) {
                  showToast.info('AI Mentor', 'Ask-AI compose wires in with the AI module.');
                  return;
                }
                if (kind === 'video') {
                  requireMember('compose', () => {
                    requestReelCompose();
                    jumpTo('reels');
                  });
                  return;
                }
                requireMember('compose', () => setComposeOpen(true));
              }}
            />
          </View>

          <View style={styles.tabs}>
            <FeedSegmentTabs
              active={tab}
              onChange={(next) => {
                if (next === 'following' && !isAuthed) {
                  setGate('follow');
                  return;
                }
                setTab(next);
              }}
            />
          </View>

          <View style={styles.pad}>
            {timelineQuery.isPending ? <Spinner /> : null}

            {timelineQuery.isError ? (
              <View
                style={[
                  styles.empty,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <AppText variant="label">Could not load the feed</AppText>
                <AppText color="secondary" style={styles.emptyCopy} variant="caption">
                  Pull to refresh, or retry once your API is reachable.
                </AppText>
                <Pressable onPress={() => void timelineQuery.refetch()}>
                  <AppText color="brand" variant="caption" weight="semibold">
                    Retry
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            {tab === 'following' &&
            isAuthed &&
            !timelineQuery.isPending &&
            !timelineQuery.isError &&
            posts.length === 0 ? (
              <EmptyFollowing />
            ) : null}

            {tab !== 'following' &&
            !timelineQuery.isPending &&
            !timelineQuery.isError &&
            posts.length === 0 ? (
              <View
                style={[
                  styles.empty,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <AppText variant="label">No posts yet</AppText>
                <AppText color="secondary" style={styles.emptyCopy} variant="caption">
                  Be the first to share a useful note with the community.
                </AppText>
              </View>
            ) : null}

            {posts.map((entry, index) => (
              <Animated.View
                entering={FadeInDown.delay(80 + index * 40).duration(400)}
                key={entry.card.id}
                style={styles.cardWrap}>
                <FeedPostCard
                  liked={Boolean(entry.api.viewerState?.liked)}
                  onAuthorPress={() =>
                    openMemberProfile(
                      entry.card.author.username || entry.api.author?.username,
                      entry.card.author.name,
                    )
                  }
                  onComment={() => setCommentPostId(entry.api.id)}
                  onFollow={() =>
                    requireMember('follow', () => {
                      const authorId = String(
                        entry.api.author?.id || entry.api.authorId || '',
                      ).trim();
                      if (!authorId || followMutation.isPending) {
                        return;
                      }
                      followMutation.mutate(authorId);
                    })
                  }
                  onMenu={() =>
                    requireMember('moderate', () => {
                      setMenuTarget({
                        id: entry.api.id,
                        isOwn: Boolean(entry.card.isOwn),
                        pinned: Boolean(entry.api.pinnedAt),
                      });
                    })
                  }
                  onReact={() =>
                    requireMember('react', () => likeMutation.mutate(entry.api.id))
                  }
                  onSave={() =>
                    requireMember('save', () => saveMutation.mutate(entry.api.id))
                  }
                  onShare={() =>
                    requireMember('share', () => {
                      void (async () => {
                        try {
                          const payload = await feedApi.sharePost(
                            entry.api.id,
                            accessToken as string,
                          );
                          await Share.share({
                            message: payload.targets.copy || payload.url,
                            url: payload.url,
                          });
                        } catch (error) {
                          showErrorToast(error, 'Could not share this post.', 'Feed');
                        }
                      })();
                    })
                  }
                  post={entry.card}
                  saved={Boolean(entry.api.viewerState?.bookmarked)}
                />
              </Animated.View>
            ))}

            {timelineQuery.hasNextPage ? (
              <Pressable
                onPress={() => void timelineQuery.fetchNextPage()}
                style={styles.more}>
                <AppText color="brand" variant="caption" weight="semibold">
                  {timelineQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </AppText>
              </Pressable>
            ) : null}

            {!isAuthed ? (
              <Pressable
                accessibilityRole="button"
                onPress={openRegister}
                style={[
                  styles.banner,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <AppText variant="label">You’re browsing as a guest</AppText>
                <AppText color="secondary" style={styles.bannerCopy} variant="caption">
                  Join to follow officers, save posts, and share your own briefs.
                </AppText>
                <AppText color="brand" variant="caption" weight="semibold">
                  Create a free account
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </Screen>

      <JoinToContinueSheet
        message={gate ? GATE_COPY[gate].message : ''}
        onClose={() => setGate(null)}
        title={gate ? GATE_COPY[gate].title : ''}
        visible={Boolean(gate)}
      />

      <FeedComposeSheet
        busy={composeMutation.isPending}
        enableDrafts
        onClose={() => setComposeOpen(false)}
        onSubmit={(input) => composeMutation.mutate(input)}
        visible={composeOpen}
      />

      <DayBriefComposeSheet
        busy={briefMutation.isPending}
        onClose={() => {
          setBriefComposeOpen(false);
          setBriefSeedCaption(undefined);
        }}
        onSubmit={(input) => briefMutation.mutate(input)}
        seedCaption={briefSeedCaption}
        visible={briefComposeOpen}
      />

      <FeedCommentsSheet
        onAdded={invalidateFeed}
        onAuthorPress={(username, name) => openMemberProfile(username, name)}
        onClose={() => setCommentPostId(null)}
        postId={commentPostId}
        token={accessToken}
        visible={Boolean(commentPostId)}
      />

      <EditPostSheet
        onClose={() => setEditTarget(null)}
        target={editTarget}
        token={accessToken}
      />
      <FeedPostMenu
        busy={pinMutation.isPending || addPostToStoryMutation.isPending}
        onClose={() => setMenuTarget(null)}
        onSelect={(key) => {
          if (!menuTarget) {
            return;
          }
          if (key === 'add_story') {
            const postId = menuTarget.id;
            setMenuTarget(null);
            requireMember('story', () => addPostToStoryMutation.mutate(postId));
            return;
          }
          if (key === 'edit') {
            const found = posts.find((item) => item.api.id === menuTarget.id);
            setMenuTarget(null);
            setEditTarget({ id: menuTarget.id, content: found?.api.content || '' });
            return;
          }
          if (key === 'pin') {
            pinMutation.mutate(menuTarget.id);
            return;
          }
          if (key === 'delete') {
            setMenuTarget(null);
            setDeletePostId(menuTarget.id);
            return;
          }
          setMenuTarget(null);
          setReportPostId(menuTarget.id);
        }}
        target={menuTarget}
      />
      <FeedReportSheet
        busy={reportMutation.isPending}
        onClose={() => setReportPostId(null)}
        onSubmit={(reason) => {
          if (reportPostId) {
            reportMutation.mutate({ postId: reportPostId, reason });
          }
        }}
        visible={Boolean(reportPostId)}
      />
      <ConfirmModal
        Icon={Trash2}
        confirmLabel="Delete"
        isLoading={deletePostMutation.isPending}
        message="This removes the post from the feed. You can recover it from trash on web if needed."
        onCancel={() => setDeletePostId(null)}
        onConfirm={() => {
          if (deletePostId) {
            deletePostMutation.mutate(deletePostId);
          }
        }}
        title="Delete this post?"
        tone="danger"
        visible={Boolean(deletePostId)}
      />
      <DayBriefViewer
        canDelete={isAuthed}
        deleteBusy={deleteBriefMutation.isPending}
        onAddStory={() => {
          setViewerOpen(false);
          requireMember('story', () => setBriefComposeOpen(true));
        }}
        onAuthorPress={(username, name) => {
          setViewerOpen(false);
          openMemberProfile(username, name);
        }}
        onClose={() => {
          setViewerOpen(false);
          setViewerStartId(null);
          void queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
        }}
        onDelete={(brief) => {
          deleteBriefMutation.mutate(brief.id, {
            onSuccess: () => {
              const tray = briefTrays.find((item) =>
                item.items.some((entry) => entry.id === brief.id),
              );
              const remaining =
                tray?.items.filter((entry) => entry.id !== brief.id) || [];
              if (remaining.length === 0) {
                setViewerOpen(false);
                setViewerStartId(null);
                return;
              }
              setViewerStartId(remaining[0]?.id || null);
            },
          });
        }}
        onOpenViewers={(brief) => setViewersBriefId(brief.id)}
        onReact={reactToStory}
        onReply={replyToStory}
        onSegmentOpen={(brief) => {
          if (!accessToken || brief.viewed) {
            return;
          }
          void dayBriefApi.markViewed(accessToken, brief.id).then(() => {
            void queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
          });
        }}
        onShare={(brief) => {
          requireMember('story', () => setShareBrief(brief));
        }}
        onSaveHighlight={(brief) => {
          requireMember('story', () => {
            if (!accessToken) {
              return;
            }
            void dayBriefApi
              .createHighlight(accessToken, {
                title: (brief.caption || 'Highlight').slice(0, 40),
                briefId: brief.id,
                coverUrl: brief.posterUrl || brief.mediaUrl,
              })
              .then(async () => {
                await queryClient.invalidateQueries({
                  queryKey: ['day-brief-highlights', user?.id],
                });
                showToast.success('Saved to Highlights', 'Find it on your profile.');
              })
              .catch((error) => {
                showErrorToast(error, 'Could not save highlight.', 'Story');
              });
          });
        }}
        onVotePoll={(brief, stickerId, optionIndex) => {
          if (!accessToken) {
            return;
          }
          void dayBriefApi
            .votePoll(accessToken, brief.id, { stickerId, optionIndex })
            .then(() => {
              void queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
            })
            .catch((error) => {
              showErrorToast(error, 'Could not save your vote.', 'Story');
            });
        }}
        startBriefId={viewerStartId}
        trays={briefTrays}
        visible={viewerOpen && briefTrays.length > 0}
      />

      <DayBriefViewersSheet
        briefId={viewersBriefId}
        onClose={() => setViewersBriefId(null)}
        token={accessToken}
        visible={Boolean(viewersBriefId)}
      />

      <NewMessageSheet
        busy={shareBusy}
        onClose={() => setShareBrief(null)}
        onPickPerson={(person: ChatPerson) => {
          if (!shareBrief) {
            return;
          }
          void openStoryChat(
            {
              peerUserId: person.id,
              peerUsername: person.username,
              name: person.name,
            },
            `Shared a story with you${shareBrief.caption ? `: ${shareBrief.caption.slice(0, 80)}` : ''}`,
          );
        }}
        onPickUsername={(username) => {
          if (!shareBrief) {
            return;
          }
          void openStoryChat(
            { peerUsername: username },
            `Shared a story with you${shareBrief.caption ? `: ${shareBrief.caption.slice(0, 80)}` : ''}`,
          );
        }}
        visible={Boolean(shareBrief)}
      />
    </>
  );
}

function EmptyFollowing() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.empty,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}>
      <Users color={theme.colors.primary} size={ms(22)} />
      <AppText variant="label">Follow people to fill this tab</AppText>
      <AppText color="secondary" style={styles.emptyCopy} variant="caption">
        Start with officers and educators from For You.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: vs(28),
  },
  pad: {
    paddingHorizontal: s(16),
  },
  composerBlock: {
    paddingHorizontal: s(16),
    marginTop: vs(6),
    marginBottom: vs(16),
    zIndex: 0,
    elevation: 0,
  },
  tabs: {
    zIndex: 1,
    marginBottom: vs(14),
  },
  cardWrap: {
    marginBottom: vs(12),
  },
  banner: {
    borderWidth: 1,
    borderRadius: ms(18),
    padding: ms(16),
    gap: ms(6),
    marginTop: vs(4),
    marginBottom: vs(8),
  },
  bannerCopy: {
    marginBottom: vs(4),
  },
  empty: {
    borderWidth: 1,
    borderRadius: ms(18),
    padding: ms(18),
    alignItems: 'center',
    gap: ms(6),
    marginBottom: vs(12),
  },
  emptyCopy: {
    textAlign: 'center',
  },
  more: {
    alignItems: 'center',
    paddingVertical: vs(12),
  },
});
