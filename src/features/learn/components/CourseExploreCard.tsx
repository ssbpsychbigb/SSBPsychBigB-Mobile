/**
 * Catalogue row — cover, title, faculty, rating, price.
 */

import { Image, Pressable, StyleSheet, View } from 'react-native';
import { BookOpen, Star } from 'lucide-react-native';

import { courseCoverSource } from '@/features/learn/lib/course-cover';
import {
  formatCoursePrice,
  formatDurationMinutes,
  formatEnrollmentCount,
  instructorLabel,
} from '@/features/learn/lib/format-course';
import type { CourseCard } from '@/features/learn/types/course.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type CourseExploreCardProps = {
  course: CourseCard;
  onPress: () => void;
};

/**
 * Quiet marketplace card — image left, copy right.
 */
export function CourseExploreCard({ course, onPress }: CourseExploreCardProps) {
  const theme = useTheme();
  const cover = courseCoverSource(course);
  const duration = formatDurationMinutes(course.durationMinutes);
  const exam = course.examGoals?.[0]
    ? String(course.examGoals[0]).toUpperCase()
    : '';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.92 : 1 },
      ]}>
      <View style={[styles.cover, { backgroundColor: theme.colors.primaryMuted }]}>
        {cover ? (
          <Image
            resizeMode="cover"
            source={cover}
            style={styles.coverImage}
          />
        ) : (
          <View style={styles.coverFallback}>
            <BookOpen color={theme.colors.primary} size={ms(22)} strokeWidth={1.8} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        {course.bestseller ? (
          <AppText color="brand" variant="caption" weight="semibold">
            Bestseller
          </AppText>
        ) : exam ? (
          <AppText color="muted" variant="caption" weight="semibold">
            {exam}
          </AppText>
        ) : null}
        <AppText numberOfLines={2} variant="label" weight="bold">
          {course.title}
        </AppText>
        <AppText color="secondary" numberOfLines={1} variant="caption">
          {instructorLabel(course)}
        </AppText>
        <View style={styles.meta}>
          {course.ratingCount > 0 ? (
            <View style={styles.metaItem}>
              <Star
                color={theme.colors.warning}
                fill={theme.colors.warning}
                size={ms(11)}
                strokeWidth={0}
              />
              <AppText variant="caption" weight="semibold">
                {course.ratingAvg.toFixed(1)}
              </AppText>
            </View>
          ) : (
            <AppText color="muted" variant="caption">
              {formatEnrollmentCount(course.enrollmentCount)}
            </AppText>
          )}
          {duration ? (
            <AppText color="muted" variant="caption">
              {duration}
            </AppText>
          ) : null}
        </View>
        <AppText variant="label" weight="bold">
          {formatCoursePrice(course.price, course.currency)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: s(12),
    marginBottom: vs(18),
  },
  cover: {
    width: s(112),
    height: vs(84),
    borderRadius: ms(12),
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: vs(2),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginTop: vs(2),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
});
