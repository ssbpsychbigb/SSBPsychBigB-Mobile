/**
 * Horizontal Day Brief rings — Instagram-style circular trays.
 */

import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';

import type { FeedPreviewBrief } from '@/features/feed/data/feed-preview';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type DayBriefStripProps = {
  briefs: FeedPreviewBrief[];
  isAuthed: boolean;
  /** Empty self tile or “+” badge → create. */
  onSelfCompose: () => void;
  /** Open a person's tray (including own when they have stories). */
  onBriefPress: (brief: FeedPreviewBrief) => void;
};

const RING_SIZE = s(74);
const AVATAR_SIZE = s(64);

/**
 * Home story tray under the feed header.
 */
export function DayBriefStrip({
  briefs,
  isAuthed,
  onSelfCompose,
  onBriefPress,
}: DayBriefStripProps) {
  const theme = useTheme();

  return (
    <View style={styles.shell}>
      <ScrollView
        contentContainerStyle={styles.content}
        directionalLockEnabled
        horizontal
        nestedScrollEnabled
        overScrollMode="never"
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}>
        {briefs.map((brief) => {
          const isSelf = Boolean(brief.isSelf);
          const hasOwnStories = isSelf && (brief.briefIds?.length || 0) > 0;
          const showRing = Boolean(brief.unseen) || (isSelf && hasOwnStories);
          const ringColor = showRing
            ? brief.ringColor || theme.colors.primary
            : theme.colors.border;

          return (
            <Pressable
              key={brief.id}
              accessibilityRole="button"
              onPress={() => {
                if (isSelf && !hasOwnStories) {
                  onSelfCompose();
                  return;
                }
                onBriefPress(brief);
              }}
              style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}>
              <View style={styles.ringWrap}>
                <View
                  style={[
                    styles.ring,
                    {
                      borderColor: ringColor,
                      borderStyle: isSelf && !isAuthed ? 'dashed' : 'solid',
                      borderWidth: showRing ? ms(2.5) : ms(1.5),
                    },
                  ]}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: isSelf
                          ? theme.colors.primaryMuted
                          : theme.colors.surface,
                        borderColor: theme.colors.background,
                      },
                    ]}>
                    {brief.posterUri ? (
                      <Image source={{ uri: brief.posterUri }} style={styles.poster} />
                    ) : isSelf && !hasOwnStories ? (
                      <Plus
                        color={theme.colors.primary}
                        size={ms(26)}
                        strokeWidth={2.4}
                      />
                    ) : (
                      <AppText color="brand" style={styles.initials} weight="bold">
                        {brief.initials}
                      </AppText>
                    )}
                  </View>
                </View>

                {isSelf && isAuthed ? (
                  <Pressable
                    accessibilityLabel="Add to story"
                    hitSlop={ms(6)}
                    onPress={(event) => {
                      event.stopPropagation?.();
                      onSelfCompose();
                    }}
                    style={[
                      styles.plusBadge,
                      {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.background,
                      },
                    ]}>
                    <Plus color="#FFFFFF" size={ms(12)} strokeWidth={3} />
                  </Pressable>
                ) : null}
              </View>

              <AppText
                color={isSelf ? 'brand' : 'primary'}
                numberOfLines={1}
                style={styles.caption}
                variant="caption"
                weight="semibold">
                {brief.name}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: vs(108),
    marginBottom: vs(2),
  },
  content: {
    paddingHorizontal: s(14),
    paddingRight: s(24),
    alignItems: 'flex-start',
    paddingTop: vs(4),
  },
  item: {
    width: RING_SIZE + s(6),
    marginRight: s(10),
    alignItems: 'center',
  },
  itemPressed: {
    opacity: 0.86,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: ms(2.5),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: fontSize(18),
    lineHeight: lineHeight(18, 1.1),
  },
  plusBadge: {
    position: 'absolute',
    right: ms(0),
    bottom: ms(0),
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    borderWidth: ms(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: vs(6),
    width: '100%',
    textAlign: 'center',
    fontSize: fontSize(11),
    lineHeight: lineHeight(11, 1.2),
  },
});
