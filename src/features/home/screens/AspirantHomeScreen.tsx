/**
 * Aspirant command center home (DASH shell).
 */

import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BookOpen, ChevronRight, Target } from 'lucide-react-native';

import { useAppTabsActions } from '@/app/navigation/AppTabsContext';
import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { useAuthStore } from '@/features/auth';
import { CourseLearningCard } from '@/features/learn/components/CourseLearningCard';
import {
  useClaimDailyMissionMutation,
  useDailyMissionQuery,
} from '@/features/learn/hooks/useCoursePathQueries';
import { useMyLearningQuery } from '@/features/learn/hooks/useCourseQueries';
import { showErrorToast, showToast } from '@/shared/ui/toast';
import { getRoleLabel } from '@/features/home/lib/role-label';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { APP_CONFIG } from '@/shared/constants/config';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Screen } from '@/shared/ui';

/**
 * Student / officer aspirant landing after auth gates.
 */
export function AspirantHomeScreen() {
  const theme = useTheme();
  const { jumpTo } = useAppTabsActions();
  const goRoot = useRootNavigate();
  const user = useAuthStore((state) => state.user);
  const mine = useMyLearningQuery(Boolean(user));
  const mission = useDailyMissionQuery(Boolean(user));
  const claimMission = useClaimDailyMissionMutation();
  const resume = mine.data?.items?.[0];
  const today = mission.data;

  const displayName = user?.fullName?.trim() || APP_CONFIG.appName;
  const examGoal = user?.examGoal || user?.examGoals?.[0];
  const initials = getUserInitials(user?.fullName);

  return (
    <Screen contentStyle={styles.content} safeBottom={false} scroll>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.header}>
        <View style={styles.identityRow}>
          <View
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <AppText color="inverse" variant="subtitle">
              {initials}
            </AppText>
          </View>
          <View style={styles.identityCopy}>
            <AppText color="muted" variant="caption">
              Welcome back · {getRoleLabel(user?.role)}
              {user?.role === 'defence_officer' ? ' · Verified officer' : ''}
            </AppText>
            <AppText numberOfLines={1} variant="subtitle" weight="bold">
              {displayName}
            </AppText>
            {examGoal ? (
              <View
                style={[
                  styles.goalChip,
                  { backgroundColor: theme.colors.primaryMuted },
                ]}>
                <Target color={theme.colors.primary} size={ms(14)} />
                <AppText color="brand" variant="caption">
                  Preparing for {examGoal}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(80).duration(420)}
        style={[styles.mission, { backgroundColor: theme.colors.primary }]}>
        <AppText color="inverse" variant="caption">
          {"Today's mission"}
        </AppText>
        <AppText color="inverse" style={styles.missionTitle} variant="subtitle">
          {today?.streakHint || 'Warm up with focused practice'}
        </AppText>
        {today?.tasks?.length ? (
          today.tasks.slice(0, 3).map((task) => (
            <AppText key={task.id} color="inverse" variant="caption">
              {task.done ? '✓' : '○'} {task.label}
              {task.target > 1 ? `  ${task.current}/${task.target}` : ''}
            </AppText>
          ))
        ) : (
          <AppText color="inverse" style={styles.missionBody} variant="caption">
            Consistency beats intensity. Open Learn to continue your prep.
          </AppText>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (today?.complete && !today.claimed) {
              claimMission.mutate(undefined, {
                onSuccess: () => showToast.success('Mission claimed'),
                onError: (error) => showErrorToast(error, 'Could not claim'),
              });
              return;
            }
            const next = today?.continueCourse;
            if (next?.lastLessonId) {
              goRoot('LessonPlayer', {
                slug: next.slug,
                lessonId: next.lastLessonId,
              });
              return;
            }
            if (resume?.continueLesson) {
              goRoot('LessonPlayer', {
                slug: resume.course.slug,
                lessonId: resume.continueLesson.id,
              });
              return;
            }
            jumpTo('myCourse');
          }}
          style={({ pressed }) => [
            styles.missionCta,
            { opacity: pressed ? 0.88 : 1 },
          ]}>
          <AppText color="brand" variant="label">
            {today?.complete && !today.claimed
              ? 'Claim today'
              : resume
                ? 'Continue'
                : 'Start learning'}
          </AppText>
          <ChevronRight color={theme.colors.primary} size={ms(18)} />
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(160).duration(420)}
        style={styles.section}>
        <AppText style={styles.sectionTitle} variant="subtitle">
          Continue learning
        </AppText>
        {resume ? (
          <CourseLearningCard
            item={resume}
            onContinue={() => {
              if (resume.continueLesson) {
                goRoot('LessonPlayer', {
                  slug: resume.course.slug,
                  lessonId: resume.continueLesson.id,
                });
                return;
              }
              goRoot('CourseDetail', { slug: resume.course.slug });
            }}
            onPress={() => goRoot('CourseDetail', { slug: resume.course.slug })}
          />
        ) : (
          <View
            style={[
              styles.learningEmpty,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <BookOpen color={theme.colors.textMuted} size={ms(22)} />
            <View style={styles.learningCopy}>
              <AppText variant="label">No course in progress yet</AppText>
              <AppText color="secondary" variant="caption">
                When you start a course, it will show up here for one-tap resume.
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              hitSlop={ms(8)}
              onPress={() => jumpTo('myCourse')}>
              <AppText color="brand" variant="label">
                Browse
              </AppText>
            </Pressable>
          </View>
        )}
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(220).duration(420)}
        style={styles.section}>
        <AppText style={styles.sectionTitle} variant="subtitle">
          Alerts
        </AppText>
        <View
          style={[
            styles.alertRow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <AppText color="secondary" variant="body">
            {
              "You're all caught up. Notifications from community and assessments will appear here."
            }
          </AppText>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: vs(28),
    gap: ms(8),
  },
  header: {
    marginBottom: vs(12),
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
  },
  avatar: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: {
    flex: 1,
    gap: ms(4),
  },
  goalChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginTop: vs(4),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(999),
  },
  mission: {
    borderRadius: ms(16),
    paddingHorizontal: s(20),
    paddingVertical: vs(20),
    gap: ms(8),
    marginBottom: vs(16),
  },
  missionTitle: {
    marginTop: vs(2),
  },
  missionBody: {
    opacity: 0.92,
    marginBottom: vs(8),
  },
  missionCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderRadius: ms(12),
    marginTop: vs(4),
  },
  sectionTitle: {
    marginBottom: vs(12),
  },
  section: {
    marginTop: vs(12),
  },
  learningEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
  },
  learningCopy: {
    flex: 1,
    gap: ms(2),
  },
  alertRow: {
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
  },
});
