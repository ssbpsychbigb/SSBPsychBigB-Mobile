/**
 * Wishlist row — full-bleed cover, no bordered “white card”.
 */

import { Image, Pressable, StyleSheet, View } from 'react-native';

import { WishlistHeart } from '@/features/learn/components/WishlistHeart';
import { courseCoverSource } from '@/features/learn/lib/course-cover';
import {
  formatCoursePrice,
  instructorLabel,
} from '@/features/learn/lib/format-course';
import type { CourseCard } from '@/features/learn/types/course.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type CourseSavedCardProps = {
  course: CourseCard;
  onPress: () => void;
};

/**
 * Saved-course tile used on the wishlist screen.
 */
export function CourseSavedCard({ course, onPress }: CourseSavedCardProps) {
  const theme = useTheme();
  const cover = courseCoverSource(course);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.94 : 1 }]}>
      <View style={[styles.cover, { backgroundColor: theme.colors.surface }]}>
        {cover ? (
          <Image resizeMode="cover" source={cover} style={styles.coverImage} />
        ) : null}
        <View style={styles.heart}>
          <WishlistHeart light size={18} slug={course.slug} wishlisted />
        </View>
      </View>
      <View style={styles.meta}>
        <AppText numberOfLines={2} variant="label" weight="bold">
          {course.title}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {instructorLabel(course)}
          {' · '}
          {formatCoursePrice(course.price, course.currency)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: vs(22),
  },
  cover: {
    width: '100%',
    height: vs(168),
    borderRadius: ms(16),
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  heart: {
    position: 'absolute',
    top: vs(8),
    right: s(8),
    backgroundColor: 'rgba(11,13,18,0.55)',
    borderRadius: ms(20),
  },
  meta: {
    marginTop: vs(10),
    gap: vs(2),
    paddingHorizontal: s(2),
  },
});
