/**
 * Course detail — one scroll (cover + content). Sticky enroll dock.
 */

import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  Play,
  Star,
  Users,
} from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { CourseTestsSection } from '@/features/assessments/components/CourseTestsSection';
import { CourseEngagementSection } from '@/features/learn/components/CourseEngagementSection';
import { CourseProgressPanel } from '@/features/learn/components/CourseProgressPanel';
import { WishlistHeart } from '@/features/learn/components/WishlistHeart';
import {
  useCourseDetailQuery,
  useEnrollCourseMutation,
} from '@/features/learn/hooks/useCourseQueries';
import {
  difficultyLabel,
  formatCoursePrice,
  formatDurationMinutes,
  formatEnrollmentCount,
  formatLessonClock,
  instructorLabel,
} from '@/features/learn/lib/format-course';
import {
  useScreenBottomPadding,
  useScreenTopPadding,
} from '@/shared/lib/safe-area';
import { courseCoverSource } from '@/features/learn/lib/course-cover';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

const AnimatedScroll = Animated.createAnimatedComponent(ScrollView);
const COVER_H = vs(188);

type Props = NativeStackScreenProps<RootStackParamList, 'CourseDetail'>;

/**
 * App Store / Udemy-style product page. Cover scrolls with the body.
 */
export function CourseDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const topPad = useScreenTopPadding();
  const dockPad = useScreenBottomPadding(vs(16));
  const { slug } = route.params;
  const token = useAuthStore((state) => state.accessToken);
  const detail = useCourseDetailQuery(slug);
  const enroll = useEnrollCourseMutation(slug);
  const [joinOpen, setJoinOpen] = useState(false);
  const scrollY = useSharedValue(0);

  const course = detail.data;
  const cover = course ? courseCoverSource(course) : null;
  const enrolled = Boolean(course?.enrollment);
  const free = (course?.price ?? 0) <= 0;

  const firstLesson = useMemo(() => {
    const lessons = course?.sections.flatMap((section) => section.lessons) ?? [];
    const resumeId = course?.enrollment?.lastLessonId;
    return lessons.find((lesson) => lesson.id === resumeId) || lessons[0] || null;
  }, [course]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerBarStyle = useAnimatedStyle(() => ({
    backgroundColor:
      theme.mode === 'dark'
        ? `rgba(29,30,31,${interpolate(scrollY.value, [0, COVER_H * 0.55], [0, 1], 'clamp')})`
        : `rgba(255,255,255,${interpolate(scrollY.value, [0, COVER_H * 0.55], [0, 1], 'clamp')})`,
    borderBottomColor:
      theme.mode === 'dark'
        ? `rgba(58,59,63,${interpolate(scrollY.value, [40, COVER_H * 0.7], [0, 1], 'clamp')})`
        : `rgba(220,221,223,${interpolate(scrollY.value, [40, COVER_H * 0.7], [0, 1], 'clamp')})`,
  }));

  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [COVER_H * 0.35, COVER_H * 0.7], [0, 1], 'clamp'),
  }));

  const openLesson = (lessonId: string) => {
    navigation.navigate('LessonPlayer', { slug, lessonId });
  };

  const onPrimary = () => {
    if (!course) {
      return;
    }
    if (enrolled && firstLesson) {
      openLesson(firstLesson.id);
      return;
    }
    if (!token) {
      setJoinOpen(true);
      return;
    }
    if (free || course.canEnrollFree) {
      enroll.mutate(undefined, {
        onSuccess: (result) => {
          showToast.success('Enrolled', 'This course is in My learning.');
          const next =
            firstLesson?.id ||
            result.course.sections?.flatMap((section) => section.lessons)[0]?.id;
          if (next) {
            openLesson(next);
          }
        },
        onError: (error) => {
          showErrorToast(error, 'Could not enroll');
        },
      });
      return;
    }
    navigation.navigate('CourseCheckout', { slug });
  };

  if (detail.isLoading && !course) {
    return (
      <Screen safeBottom={false}>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (!course) {
    return (
      <Screen>
        <Pressable onPress={() => navigation.goBack()} style={styles.backPlain}>
          <ArrowLeft color={theme.colors.text} size={ms(20)} />
        </Pressable>
        <AppText variant="subtitle" weight="bold">
          Course unavailable
        </AppText>
        <AppText color="secondary" variant="body">
          This listing may be unpublished.
        </AppText>
      </Screen>
    );
  }

  const canStartFree = !enrolled && (free || course.canEnrollFree);
  const primaryLabel = enrolled
    ? 'Continue'
    : canStartFree
      ? 'Enroll for free'
      : 'Buy';

  return (
    <Screen
      padded={false}
      safeBottom={false}
      safeTop={false}
      style={{ backgroundColor: theme.colors.background }}>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.topBar,
          { paddingTop: topPad, borderBottomWidth: StyleSheet.hairlineWidth },
          headerBarStyle,
        ]}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={[
            styles.back,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <ArrowLeft color={theme.colors.text} size={ms(20)} strokeWidth={2} />
        </Pressable>
        <Animated.View
          pointerEvents="none"
          style={[styles.topTitle, headerTitleStyle]}>
          <AppText numberOfLines={1} variant="label" weight="bold">
            {course.title}
          </AppText>
        </Animated.View>
        <View
          style={[
            styles.wishWrap,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <WishlistHeart slug={course.slug} wishlisted={course.wishlisted} />
        </View>
      </Animated.View>

      <AnimatedScroll
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scrollFlex}>
        <View
          style={[
            styles.coverWrap,
            { backgroundColor: theme.colors.primaryMuted },
          ]}>
          {cover ? (
            <Image
              resizeMode="cover"
              source={cover}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.coverFallback}>
              <BookOpen
                color={theme.colors.primary}
                size={ms(40)}
                strokeWidth={1.6}
              />
            </View>
          )}
        </View>

        <View style={styles.body}>
          {course.bestseller ? (
            <AppText color="brand" variant="caption" weight="semibold">
              Bestseller
            </AppText>
          ) : null}
          <AppText variant="title" weight="bold">
            {course.title}
          </AppText>
          <AppText color="secondary" variant="caption">
            {instructorLabel(course)}
            {course.institute?.name ? ` · ${course.institute.name}` : ''}
          </AppText>

          <View style={styles.stats}>
            {course.ratingCount > 0 ? (
              <View style={styles.stat}>
                <Star
                  color={theme.colors.warning}
                  fill={theme.colors.warning}
                  size={ms(13)}
                  strokeWidth={0}
                />
                <AppText variant="caption" weight="semibold">
                  {course.ratingAvg.toFixed(1)}
                </AppText>
              </View>
            ) : null}
            <View style={styles.stat}>
              <Users color={theme.colors.textMuted} size={ms(13)} />
              <AppText color="muted" variant="caption">
                {formatEnrollmentCount(course.enrollmentCount)}
              </AppText>
            </View>
            {course.durationMinutes ? (
              <View style={styles.stat}>
                <Clock color={theme.colors.textMuted} size={ms(13)} />
                <AppText color="muted" variant="caption">
                  {formatDurationMinutes(course.durationMinutes)}
                </AppText>
              </View>
            ) : null}
            {course.difficulty ? (
              <AppText color="muted" variant="caption">
                {difficultyLabel(course.difficulty)}
              </AppText>
            ) : null}
          </View>

          {course.description ? (
            <AppText color="secondary" style={styles.desc} variant="body">
              {course.description}
            </AppText>
          ) : null}

          {course.learningOutcomes?.length ? (
            <View style={styles.block}>
              <AppText variant="label" weight="bold">
                What you’ll learn
              </AppText>
              {course.learningOutcomes.slice(0, 6).map((line) => (
                <View key={line} style={styles.outcome}>
                  <Check color={theme.colors.primary} size={ms(15)} strokeWidth={2.4} />
                  <AppText style={styles.flex} variant="body">
                    {line}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.block}>
            <AppText variant="label" weight="bold">
              Syllabus
            </AppText>
            <AppText color="muted" variant="caption">
              {course.sectionCount} sections · {course.lessonCount} lessons
            </AppText>
            {(course.sections ?? []).map((section) => (
              <View key={section.id} style={styles.sectionBlock}>
                <AppText variant="label" weight="semibold">
                  {section.title}
                </AppText>
                {section.lessons.map((lesson, index) => {
                  const canOpen = enrolled || Boolean(lesson.previewAvailable);
                  return (
                    <Pressable
                      key={lesson.id}
                      disabled={!canOpen}
                      onPress={() => canOpen && openLesson(lesson.id)}
                      style={styles.lesson}>
                      <AppText color="muted" variant="caption">
                        {index + 1}
                      </AppText>
                      {canOpen ? (
                        <Play color={theme.colors.primary} size={ms(14)} />
                      ) : (
                        <View style={styles.dot} />
                      )}
                      <View style={styles.flex}>
                        <AppText
                          color={canOpen ? 'primary' : 'muted'}
                          numberOfLines={2}
                          variant="body">
                          {lesson.title}
                        </AppText>
                        {lesson.previewAvailable && !enrolled ? (
                          <AppText color="brand" variant="caption" weight="semibold">
                            Preview
                          </AppText>
                        ) : null}
                      </View>
                      <AppText color="muted" variant="caption">
                        {formatLessonClock(lesson.durationSec)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <CourseTestsSection
            onOpen={(testSlug) =>
              navigation.navigate('AssessmentDetail', { slug: testSlug })
            }
            slug={course.slug}
          />

          <CourseProgressPanel course={course} />
          <CourseEngagementSection course={course} />
        </View>
      </AnimatedScroll>

      <View
        style={[
          styles.dock,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingBottom: dockPad,
          },
        ]}>
        <View style={styles.dockCopy}>
          <AppText variant="label" weight="bold">
            {formatCoursePrice(course.price, course.currency)}
          </AppText>
          <AppText color="muted" numberOfLines={1} variant="caption">
            {enrolled
              ? `${Math.round(course.enrollment?.progressPct || 0)}% complete`
              : free
                ? 'Join instantly'
                : 'Secure checkout'}
          </AppText>
        </View>
        <Button
          fullWidth
          loading={enroll.isPending}
          onPress={onPrimary}
          size="lg"
          variant="primary">
          <AppText
            color="inverse"
            variant="label"
            weight="bold">
            {primaryLabel}
          </AppText>
        </Button>
      </View>

      <JoinToContinueSheet
        message="Create a BIGB account to enroll and keep progress on phone and web."
        onClose={() => setJoinOpen(false)}
        title="Join to enroll"
        visible={joinOpen}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingBottom: vs(8),
    gap: s(10),
  },
  topTitle: {
    flex: 1,
    minWidth: 0,
  },
  wishWrap: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlain: {
    width: ms(40),
    marginBottom: vs(12),
  },
  scrollFlex: {
    flex: 1,
  },
  scroll: {
    paddingBottom: vs(16),
    flexGrow: 1,
  },
  coverWrap: {
    width: '100%',
    height: COVER_H,
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
    paddingHorizontal: s(16),
    paddingTop: vs(16),
    gap: vs(8),
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: s(12),
    marginTop: vs(4),
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  desc: {
    marginTop: vs(6),
  },
  block: {
    gap: vs(10),
    marginTop: vs(14),
  },
  outcome: {
    flexDirection: 'row',
    gap: s(10),
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  sectionBlock: {
    gap: vs(2),
    marginTop: vs(8),
  },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingVertical: vs(10),
  },
  dot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: '#C0C2C6',
  },
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    gap: vs(10),
  },
  dockCopy: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: s(12),
  },
});
