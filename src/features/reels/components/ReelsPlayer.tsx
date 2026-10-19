/**
 * Full-screen vertical Reels pager — opens from the explore grid.
 */

import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from 'react-native';

import { ReelStage } from '@/features/reels/components/ReelStage';
import type { PrepReelPreview } from '@/features/reels/data/reels-preview';

export type ReelsPlayerProps = {
  playlist: PrepReelPreview[];
  tabFocused: boolean;
  onClose: () => void;
  onComment: (id: string) => void;
  onFollow: (authorId: string) => void;
  onLike: (id: string) => void;
  onOpenMessages: () => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onCreate: () => void;
  onAuthorPress?: (reel: PrepReelPreview) => void;
  overlayOpen?: boolean;
};

const VIEWABILITY = { itemVisiblePercentThreshold: 80 };

/**
 * Paging player. First item is the tile the user tapped; the rest are shuffled.
 */
export function ReelsPlayer({
  playlist,
  tabFocused,
  onClose,
  onComment,
  onFollow,
  onLike,
  onOpenMessages,
  onSave,
  onShare,
  onCreate,
  onAuthorPress,
  overlayOpen = false,
}: ReelsPlayerProps) {
  const [page, setPage] = useState(0);
  const [muted, setMuted] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

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
        isActive={tabFocused && page === index && !overlayOpen}
        isFollowing={Boolean(item.followingAuthor)}
        isLiked={Boolean(item.liked)}
        isSaved={Boolean(item.bookmarked)}
        muted={muted}
        onClose={onClose}
        onComment={() => onComment(item.id)}
        onFollow={() => onFollow(item.authorId || item.id)}
        onLike={() => onLike(item.id)}
        onOpenMessages={onOpenMessages}
        onSave={() => onSave(item.id)}
        onShare={() => onShare(item.id)}
        onCreate={onCreate}
        onAuthorPress={() => onAuthorPress?.(item)}
        onToggleMute={() => setMuted((value) => !value)}
        onTogglePause={() => setUserPaused((value) => !value)}
        reel={item}
        userPaused={userPaused}
        width={viewport.width}
      />
    ),
    [
      muted,
      onClose,
      onComment,
      onFollow,
      onLike,
      onOpenMessages,
      onSave,
      onShare,
      onCreate,
      onAuthorPress,
      overlayOpen,
      page,
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
          data={playlist}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
