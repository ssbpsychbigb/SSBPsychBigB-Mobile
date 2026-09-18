/**
 * Horizontal Day Brief tiles (24h stories analogue — portrait, not rings).
 */

import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';

import type { FeedPreviewBrief } from '@/features/feed/data/feed-preview';
import { radius } from '@/shared/constants/spacing';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type DayBriefStripProps = {
  briefs: FeedPreviewBrief[];
  isAuthed: boolean;
  onSelfPress: () => void;
  onBriefPress: (brief: FeedPreviewBrief) => void;
};

/**
 * Reels-style brief tray under the feed header — rounded portrait cards.
 */
export function DayBriefStrip({
  briefs,
  isAuthed,
  onSelfPress,
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
          const stroke =
            brief.unseen || isSelf ? brief.ringColor : theme.colors.border;
          const fill = isSelf ? theme.colors.primaryMuted : brief.ringColor;

          return (
            <Pressable
              key={brief.id}
              accessibilityRole="button"
              onPress={() => (isSelf ? onSelfPress() : onBriefPress(brief))}
              style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}>
              <View
                style={[
                  styles.tile,
                  {
                    backgroundColor: fill,
                    borderColor: stroke,
                    borderStyle: isSelf && !isAuthed ? 'dashed' : 'solid',
                  },
                ]}>
                {brief.posterUri ? (
                  <Image source={{ uri: brief.posterUri }} style={styles.poster} />
                ) : null}
                <View style={styles.mark}>
                  {isSelf && !brief.posterUri ? (
                    <Plus
                      color={theme.colors.primary}
                      size={ms(22)}
                      strokeWidth={2.4}
                    />
                  ) : !isSelf && !brief.posterUri ? (
                    <AppText color="inverse" style={styles.initials} weight="bold">
                      {brief.initials}
                    </AppText>
                  ) : null}
                </View>

                <View style={styles.captionScrim}>
                  <AppText
                    color={isSelf ? 'brand' : 'inverse'}
                    numberOfLines={1}
                    style={styles.caption}
                    variant="caption"
                    weight="semibold">
                    {brief.name}
                  </AppText>
                </View>

                {isSelf && isAuthed ? (
                  <View
                    style={[
                      styles.plusBadge,
                      { backgroundColor: theme.colors.primary },
                    ]}>
                    <Plus color="#FFFFFF" size={ms(10)} strokeWidth={3} />
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: vs(128),
    marginBottom: vs(4),
  },
  content: {
    paddingHorizontal: s(16),
    paddingRight: s(28),
    alignItems: 'center',
  },
  item: {
    marginRight: s(8),
  },
  itemPressed: {
    opacity: 0.86,
  },
  tile: {
    width: s(78),
    height: vs(112),
    borderRadius: radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  poster: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  mark: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: fontSize(18),
    lineHeight: lineHeight(18, 1.1),
    letterSpacing: 0.4,
  },
  captionScrim: {
    paddingHorizontal: s(6),
    paddingTop: vs(10),
    paddingBottom: vs(8),
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  caption: {
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  plusBadge: {
    position: 'absolute',
    right: s(6),
    top: vs(6),
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
