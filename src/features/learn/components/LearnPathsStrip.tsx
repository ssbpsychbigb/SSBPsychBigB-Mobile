/**
 * Horizontal learning-path chips on Explore.
 */

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Route } from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { useLearningPathsQuery } from '@/features/learn/hooks/useCoursePathQueries';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

/**
 * Quiet strip — skip render when the catalogue has no paths.
 */
export function LearnPathsStrip() {
  const theme = useTheme();
  const goRoot = useRootNavigate();
  const paths = useLearningPathsQuery();
  const items = paths.data?.items ?? [];

  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.block}>
      <AppText variant="label" weight="bold">
        Learning paths
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {items.map((path) => (
          <Pressable
            key={path.id}
            onPress={() =>
              goRoot('LearningPathDetail', { pathSlug: path.slug })
            }
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <Route color={theme.colors.primary} size={ms(14)} />
            <View style={styles.copy}>
              <AppText numberOfLines={1} variant="caption" weight="semibold">
                {path.title}
              </AppText>
              <AppText color="muted" numberOfLines={1} variant="caption">
                {path.courseCount} courses
                {path.estimatedWeeks ? ` · ${path.estimatedWeeks}w` : ''}
              </AppText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: vs(16),
    gap: vs(10),
  },
  row: {
    gap: s(10),
    paddingRight: s(8),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    maxWidth: s(220),
  },
  copy: {
    minWidth: 0,
    flexShrink: 1,
  },
});
