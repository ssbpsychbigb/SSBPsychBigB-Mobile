/**
 * Learning path — ordered course steps.
 */

import { StyleSheet, View } from 'react-native';
import { Route } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';
import { CourseExploreCard } from '@/features/learn/components/CourseExploreCard';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { useLearningPathQuery } from '@/features/learn/hooks/useCoursePathQueries';
import { ms, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, Spinner, usePullToRefresh } from '@/shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'LearningPathDetail'>;

/**
 * Path detail. Each step opens the published course.
 */
export function LearningPathDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { pathSlug } = route.params;
  const query = useLearningPathQuery(pathSlug);
  const path = query.data;

  const refreshControl = usePullToRefresh(() => query.refetch());

  return (
    <SocialStackChrome
      refreshControl={refreshControl}
      subtitle={
        path
          ? `${path.steps.length} courses · ${path.progress.pct}% in path`
          : 'Guided sequence'
      }
      title={path?.title || 'Path'}>
      {query.isLoading && !path ? (
        <Spinner />
      ) : !path ? (
        <LearnEmptyState
          description="This path may be unpublished."
          icon={<Route color={theme.colors.textMuted} size={ms(28)} />}
          title="Path unavailable"
        />
      ) : (
        <View>
          {path.description ? (
            <AppText color="secondary" style={styles.lead} variant="body">
              {path.description}
            </AppText>
          ) : null}
          {path.steps.map((step) => (
            <View key={`${step.sequence}-${step.course.id}`}>
              <AppText color="muted" variant="caption" weight="semibold">
                Step {step.sequence}
                {step.enrolled ? ' · Enrolled' : ''}
              </AppText>
              <CourseExploreCard
                course={step.course}
                onPress={() =>
                  navigation.navigate('CourseDetail', { slug: step.course.slug })
                }
              />
            </View>
          ))}
        </View>
      )}
    </SocialStackChrome>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginBottom: vs(16),
  },
});
