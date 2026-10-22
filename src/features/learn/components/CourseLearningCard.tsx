/**
 * Enrolled library row — progress + continue.
 */

import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Play } from 'lucide-react-native';

import { courseCoverSource } from '@/features/learn/lib/course-cover';
import { instructorLabel } from '@/features/learn/lib/format-course';
import type { MyLearningItem } from '@/features/learn/types/course.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type CourseLearningCardProps = {
  item: MyLearningItem;
  onPress: () => void;
  onContinue: () => void;
};

/**
 * Compact in-progress card for My learning.
 */
export function CourseLearningCard({
  item,
  onPress,
  onContinue,
}: CourseLearningCardProps) {
  const theme = useTheme();
  const cover = courseCoverSource(item.course);
  const pct = Math.max(0, Math.min(100, Math.round(item.enrollment.progressPct || 0)));
  const resume = item.continueLesson?.title;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={[styles.thumb, { backgroundColor: theme.colors.primaryMuted }]}>
        {cover ? (
          <Image
            resizeMode="cover"
            source={cover}
            style={styles.thumbImage}
          />
        ) : null}
      </View>
      <View style={styles.body}>
        <AppText numberOfLines={2} variant="label" weight="bold">
          {item.course.title}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {resume ? `Continue · ${resume}` : instructorLabel(item.course)}
        </AppText>
        <View style={styles.progressRow}>
          <View
            style={[
              styles.track,
              { backgroundColor: theme.colors.primaryMuted },
            ]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${pct}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
          <AppText color="brand" variant="caption" weight="semibold">
            {pct}%
          </AppText>
        </View>
      </View>
      <Pressable
        accessibilityLabel="Continue lesson"
        accessibilityRole="button"
        hitSlop={ms(8)}
        onPress={onContinue}
        style={[styles.play, { backgroundColor: theme.colors.primary }]}>
        <Play color="#FFFFFF" fill="#FFFFFF" size={ms(14)} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ms(14),
    padding: s(8),
    gap: s(12),
    marginBottom: vs(10),
  },
  thumb: {
    width: s(72),
    height: vs(72),
    borderRadius: ms(14),
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: vs(4),
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginTop: vs(4),
  },
  track: {
    flex: 1,
    height: vs(6),
    borderRadius: ms(99),
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: ms(99),
  },
  play: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
