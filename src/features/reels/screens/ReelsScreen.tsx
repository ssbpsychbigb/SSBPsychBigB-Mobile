/**
 * Public Prep Reels tab — each page is a looping video, no still poster.
 */

import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from 'react-native';

import { useAppTabs } from '@/app/navigation/AppTabsContext';
import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ReelStage } from '@/features/reels/components/ReelStage';
import { PREP_REELS_PREVIEW, type PrepReelPreview } from '@/features/reels/data/reels-preview';

type GateKind = 'like' | 'comment' | 'share' | 'save' | 'follow';

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
};

const VIEWABILITY = { itemVisiblePercentThreshold: 80 };

/**
 * Immersive public reels — lives in the second tab, not on Feed.
 */
export function ReelsScreen() {
  const { activeKey } = useAppTabs();
  const goRoot = useRootNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [gate, setGate] = useState<GateKind | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [muted, setMuted] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const tabFocused = activeKey === 'reels';
  const copy = gate ? GATE_COPY[gate] : GATE_COPY.like;

  const requireMember = (kind: GateKind, authedFn?: () => void) => {
    if (!accessToken) {
      setGate(kind);
      return;
    }
    authedFn?.();
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const next = viewableItems[0]?.index;
      if (typeof next === 'number') {
        setPage(next);
        setUserPaused(false);
      }
    },
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: PrepReelPreview; index: number }) => (
      <ReelStage
        height={viewport.height}
        isActive={tabFocused && page === index}
        isFollowing={following.includes(item.id)}
        isLiked={liked.includes(item.id)}
        isSaved={saved.includes(item.id)}
        muted={muted}
        onComment={() => requireMember('comment')}
        onFollow={() =>
          requireMember('follow', () => {
            setFollowing((currentIds) =>
              currentIds.includes(item.id)
                ? currentIds.filter((id) => id !== item.id)
                : [...currentIds, item.id],
            );
          })
        }
        onLike={() =>
          requireMember('like', () => {
            setLiked((currentIds) =>
              currentIds.includes(item.id)
                ? currentIds.filter((id) => id !== item.id)
                : [...currentIds, item.id],
            );
          })
        }
        onOpenMessages={() => goRoot('Messages')}
        onSave={() =>
          requireMember('save', () => {
            setSaved((currentIds) =>
              currentIds.includes(item.id)
                ? currentIds.filter((id) => id !== item.id)
                : [...currentIds, item.id],
            );
          })
        }
        onShare={() => requireMember('share')}
        onToggleMute={() => setMuted((value) => !value)}
        onTogglePause={() => setUserPaused((value) => !value)}
        reel={item}
        userPaused={userPaused}
        width={viewport.width}
      />
    ),
    [
      accessToken,
      following,
      goRoot,
      liked,
      muted,
      page,
      saved,
      tabFocused,
      userPaused,
      viewport.height,
      viewport.width,
    ],
  );

  return (
    <View onLayout={onLayout} style={styles.root}>
      {viewport.height > 0 ? (
        <FlatList
          data={PREP_REELS_PREVIEW}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: viewport.height,
            offset: viewport.height * index,
            index,
          })}
          initialNumToRender={1}
          keyExtractor={(item) => item.id}
          maxToRenderPerBatch={2}
          onViewableItemsChanged={onViewableItemsChanged}
          pagingEnabled
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          viewabilityConfig={VIEWABILITY}
          windowSize={3}
        />
      ) : null}

      <JoinToContinueSheet
        message={copy.message}
        onClose={() => setGate(null)}
        title={copy.title}
        visible={Boolean(gate)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
