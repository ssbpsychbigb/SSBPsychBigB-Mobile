/**
 * Public community feed — first tab for guests and signed-in users.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Users } from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { DayBriefStrip } from '@/features/feed/components/DayBriefStrip';
import { FeedComposerCard } from '@/features/feed/components/FeedComposerCard';
import { FeedHeader } from '@/features/feed/components/FeedHeader';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import { FeedSegmentTabs } from '@/features/feed/components/FeedSegmentTabs';
import {
  FEED_PREVIEW_BRIEFS,
  FEED_PREVIEW_POSTS,
  type FeedTabKey,
} from '@/features/feed/data/feed-preview';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Screen } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

type GateReason =
  | 'react'
  | 'comment'
  | 'save'
  | 'follow'
  | 'compose'
  | 'story'
  | 'share';

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
    title: 'Share a Day Brief',
    message: '24-hour briefs are for members. You can still watch public posts.',
  },
  share: {
    title: 'Share this post',
    message: 'Outbound share unlocks after you join so we can count it fairly.',
  },
};

/**
 * Instagram + LinkedIn hybrid feed. Preview data until Feed APIs wire in.
 */
export function FeedScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthed = Boolean(accessToken);
  const openRegister = useOpenAuth('Register');
  const goRoot = useRootNavigate();

  const [tab, setTab] = useState<FeedTabKey>('forYou');
  const [gate, setGate] = useState<GateReason | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const posts = useMemo(
    () => FEED_PREVIEW_POSTS.filter((post) => post.tab.includes(tab)),
    [tab],
  );

  const requireMember = (reason: GateReason, authedFallback?: () => void) => {
    if (!isAuthed) {
      setGate(reason);
      return;
    }
    authedFallback?.();
  };

  const canvas =
    theme.mode === 'dark' ? theme.colors.background : theme.palette.primary[50];

  return (
    <>
    <Screen
      contentStyle={styles.shell}
      padded={false}
      safeBottom={false}
      style={{ backgroundColor: canvas }}>
      <View style={styles.pad}>
        <FeedHeader
          hasUnreadMessages={isAuthed}
          isAuthed={isAuthed}
          onOpenMessages={() => goRoot('Messages')}
          onOpenNotifications={() => goRoot('Notifications')}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.flex}>
      <DayBriefStrip
        briefs={FEED_PREVIEW_BRIEFS}
        isAuthed={isAuthed}
        onBriefPress={() => {
          showToast.info('Day Brief', 'Full-screen viewer lands with the Feed API.');
        }}
        onSelfPress={() => requireMember('story')}
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
            requireMember('compose');
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
        {tab === 'following' && isAuthed && posts.length === 0 ? (
          <EmptyFollowing />
        ) : null}

        {posts.map((post, index) => (
          <Animated.View
            entering={FadeInDown.delay(80 + index * 60).duration(400)}
            key={post.id}
            style={styles.cardWrap}>
            <FeedPostCard
              liked={likedIds.includes(post.id)}
              onComment={() => requireMember('comment')}
              onFollow={() => requireMember('follow')}
              onMenu={() =>
                requireMember('follow', () => {
                  showToast.info('Post options', 'Report and pin land with Feed APIs.');
                })
              }
              onReact={() =>
                requireMember('react', () => {
                  setLikedIds((current) =>
                    current.includes(post.id)
                      ? current.filter((id) => id !== post.id)
                      : [...current, post.id],
                  );
                })
              }
              onSave={() =>
                requireMember('save', () => {
                  setSavedIds((current) =>
                    current.includes(post.id)
                      ? current.filter((id) => id !== post.id)
                      : [...current, post.id],
                  );
                })
              }
              onShare={() =>
                requireMember('share', () => {
                  showToast.info('Share', 'Share sheet wires in with the Feed API.');
                })
              }
              post={post}
              saved={savedIds.includes(post.id)}
            />
          </Animated.View>
        ))}

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
});
