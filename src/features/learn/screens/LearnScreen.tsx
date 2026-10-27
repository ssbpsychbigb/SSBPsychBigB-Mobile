/**
 * Learn hub — library + catalogue. Wishlist lives on its own screen.
 */

import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Award, BookOpen, Compass, Heart, Search, SlidersHorizontal } from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import type { AppTabParamList } from '@/app/navigation/types';
import { TestsHub } from '@/features/assessments/components/TestsHub';
import { useAssessmentsQuery } from '@/features/assessments/hooks/useAssessmentQueries';
import { GuestUnlockPanel } from '@/features/auth/components/GuestUnlockPanel';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { CourseExploreCard } from '@/features/learn/components/CourseExploreCard';
import { CourseLearningCard } from '@/features/learn/components/CourseLearningCard';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { LearnFilterSheet } from '@/features/learn/components/LearnFilterSheet';
import { LearnModeSwitch } from '@/features/learn/components/LearnModeSwitch';
import { LearnPathsStrip } from '@/features/learn/components/LearnPathsStrip';
import { useWishlistQuery } from '@/features/learn/hooks/useCourseEngagementQueries';
import {
  useCourseCatalogueQuery,
  useMyLearningQuery,
} from '@/features/learn/hooks/useCourseQueries';
import {
  countActiveLearnFilters,
  DEFAULT_LEARN_FILTERS,
  type LearnFilterDraft,
} from '@/features/learn/lib/learn-filters';
import type { CourseListFilters, LearnHubMode } from '@/features/learn/types/course.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, Spinner, usePullToRefresh } from '@/shared/ui';
import { showErrorToast } from '@/shared/ui/toast';

/**
 * Center-tab destination. Create-course is never shown here.
 */
export function LearnScreen() {
  const theme = useTheme();
  const goRoot = useRootNavigate();
  const route = useRoute<RouteProp<AppTabParamList, 'myCourse'>>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [mode, setMode] = useState<LearnHubMode>('explore');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [testQuery, setTestQuery] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [draft, setDraft] = useState<LearnFilterDraft>(DEFAULT_LEARN_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = useMemo<CourseListFilters>(
    () => ({
      q: search,
      price: draft.price,
      examGoal: draft.examGoal || undefined,
      difficulty: draft.difficulty,
      sort: draft.sort,
    }),
    [draft, search],
  );

  const catalogue = useCourseCatalogueQuery(filters);
  const mine = useMyLearningQuery(Boolean(accessToken));
  const tests = useAssessmentsQuery(testSearch, mode === 'tests');
  const saved = useWishlistQuery(Boolean(accessToken));
  const activeCount = countActiveLearnFilters(draft);
  const savedCount = saved.data?.items.length ?? 0;

  const courses = useMemo(
    () => catalogue.data?.pages.flatMap((page) => page.items) ?? [],
    [catalogue.data],
  );
  const library = mine.data?.items ?? [];
  const exploreLoading = catalogue.isLoading && !catalogue.data;
  const mineLoading = mine.isLoading && !mine.data;
  const testsLoading = tests.isLoading && !tests.data;
  const testItems = tests.data?.items ?? [];

  useEffect(() => {
    if (route.params?.hub) {
      setMode(route.params.hub);
    }
  }, [route.params?.hub]);

  useEffect(() => {
    if (catalogue.isError) {
      showErrorToast(catalogue.error, 'Could not load courses');
    }
  }, [catalogue.isError, catalogue.error]);

  useEffect(() => {
    if (mode === 'tests' && tests.isError) {
      showErrorToast(tests.error, 'Could not load tests');
    }
  }, [mode, tests.isError, tests.error]);

  const openCourse = (slug: string) => {
    goRoot('CourseDetail', { slug });
  };

  const openLesson = (slug: string, lessonId?: string | null) => {
    if (!lessonId) {
      openCourse(slug);
      return;
    }
    goRoot('LessonPlayer', { slug, lessonId });
  };

  const refreshControl = usePullToRefresh(() => {
    if (mode === 'tests') {
      return tests.refetch();
    }
    return Promise.all([
      catalogue.refetch(),
      ...(accessToken ? [mine.refetch(), saved.refetch()] : []),
    ]);
  });

  return (
    <>
      <SocialStackChrome
        onNearEnd={() => {
          if (
            mode === 'explore' &&
            catalogue.hasNextPage &&
            !catalogue.isFetchingNextPage
          ) {
            void catalogue.fetchNextPage();
          }
        }}
        refreshControl={refreshControl}
        rightSlot={
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Certificates"
              onPress={() => goRoot('MyCertificates')}
              style={styles.iconHit}>
              <Award color={theme.colors.text} size={ms(20)} strokeWidth={2} />
            </Pressable>
            <Pressable
              accessibilityLabel="Wishlist"
              onPress={() => goRoot('CourseWishlist')}
              style={styles.iconHit}>
              <Heart color={theme.colors.text} size={ms(20)} strokeWidth={2} />
              {savedCount > 0 ? (
                <View
                  style={[
                    styles.count,
                    { backgroundColor: theme.colors.primary },
                  ]}>
                  <AppText color="inverse" variant="caption" weight="bold">
                    {savedCount > 9 ? '9+' : savedCount}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          </View>
        }
        showBack={false}
        subtitle={
          mode === 'tests'
            ? 'Practice, mocks, and psych tests.'
            : mode === 'mine'
              ? 'Pick up where you left off.'
              : 'Browse. Continue. Save for later.'
        }
        title="Learn">
        <LearnModeSwitch onChange={setMode} value={mode} />

        {mode === 'mine' ? (
          !accessToken ? (
            <GuestUnlockPanel
              description="Purchased and enrolled courses stay on this account — phone and web."
              embedded
              icon={<BookOpen color={theme.colors.primary} size={ms(32)} />}
              title="Sign in for My learning"
            />
          ) : mineLoading ? (
            <Spinner />
          ) : library.length === 0 ? (
            <LearnEmptyState
              actionLabel="Explore courses"
              description="Enroll for free or buy a course and it will show up here with resume progress."
              icon={<BookOpen color={theme.colors.textMuted} size={ms(28)} />}
              onAction={() => setMode('explore')}
              title="Your library is empty"
            />
          ) : (
            <View>
              {library.map((item) => (
                <CourseLearningCard
                  key={item.enrollment.id}
                  item={item}
                  onContinue={() =>
                    openLesson(item.course.slug, item.continueLesson?.id)
                  }
                  onPress={() => openCourse(item.course.slug)}
                />
              ))}
            </View>
          )
        ) : mode === 'tests' ? (
          <TestsHub
            isError={tests.isError}
            items={testItems}
            loading={testsLoading}
            onOpen={(slug) => goRoot('AssessmentDetail', { slug })}
            onOpenBookmarks={() => goRoot('AssessmentBookmarks')}
            onOpenHistory={() => goRoot('AssessmentHistory')}
            onOpenRevision={() => goRoot('AssessmentWeakTopics')}
            onQueryChange={setTestQuery}
            onRetry={() => void tests.refetch()}
            onSubmitSearch={(next) => setTestSearch((next ?? testQuery).trim())}
            query={testQuery}
            searching={Boolean(testSearch)}
          />
        ) : (
          <View>
            <View style={styles.searchRow}>
              <View
                style={[
                  styles.search,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <Search
                  color={theme.colors.textMuted}
                  size={ms(16)}
                  strokeWidth={2}
                />
                <TextInput
                  onChangeText={setQuery}
                  onSubmitEditing={() => setSearch(query.trim())}
                  placeholder="Search courses"
                  placeholderTextColor={theme.colors.textMuted}
                  returnKeyType="search"
                  style={[
                    styles.searchInput,
                    {
                      color: theme.colors.text,
                      fontFamily: resolveFontFamily('regular'),
                    },
                  ]}
                  value={query}
                />
              </View>
              <Pressable
                accessibilityLabel="Sort and filters"
                accessibilityRole="button"
                onPress={() => setFilterOpen(true)}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor:
                      activeCount > 0
                        ? theme.colors.primary
                        : theme.colors.surface,
                    borderColor:
                      activeCount > 0
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}>
                <SlidersHorizontal
                  color={activeCount > 0 ? '#FFFFFF' : theme.colors.text}
                  size={ms(18)}
                  strokeWidth={2}
                />
                {activeCount > 0 ? (
                  <View style={styles.badge}>
                    <AppText color="brand" variant="caption" weight="bold">
                      {activeCount}
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
            </View>

            <LearnPathsStrip />

            <View style={styles.metaLine}>
              <AppText color="muted" variant="caption">
                {exploreLoading
                  ? 'Loading…'
                  : `${courses.length}${catalogue.hasNextPage ? '+' : ''} courses`}
              </AppText>
              {activeCount > 0 ? (
                <Pressable onPress={() => setDraft(DEFAULT_LEARN_FILTERS)}>
                  <AppText color="brand" variant="caption" weight="semibold">
                    Clear filters
                  </AppText>
                </Pressable>
              ) : null}
            </View>

            {exploreLoading ? <Spinner /> : null}
            {!exploreLoading && catalogue.isError ? (
              <LearnEmptyState
                actionLabel="Retry"
                description="Check your connection and try again."
                icon={<Compass color={theme.colors.textMuted} size={ms(28)} />}
                onAction={() => void catalogue.refetch()}
                title="Couldn’t load courses"
              />
            ) : null}
            {!exploreLoading && !catalogue.isError && courses.length === 0 ? (
              <LearnEmptyState
                actionLabel="Clear filters"
                description="Try another exam or clear filters to see the full catalogue."
                icon={<Compass color={theme.colors.textMuted} size={ms(28)} />}
                onAction={() => setDraft(DEFAULT_LEARN_FILTERS)}
                title="No courses match"
              />
            ) : null}
            {courses.map((course) => (
              <CourseExploreCard
                key={course.id}
                course={course}
                onPress={() => openCourse(course.slug)}
              />
            ))}
            {catalogue.isFetchingNextPage ? (
              <AppText color="muted" style={styles.more} variant="caption">
                Loading more…
              </AppText>
            ) : null}
          </View>
        )}
      </SocialStackChrome>
      <LearnFilterSheet
        onApply={(next) => {
          setDraft(next);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
        value={draft}
        visible={filterOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconHit: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    position: 'absolute',
    top: vs(4),
    right: s(4),
    minWidth: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(3),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: vs(14),
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    height: ms(44),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  filterBtn: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: vs(-4),
    right: s(-4),
    minWidth: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(3),
  },
  metaLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  more: {
    textAlign: 'center',
    paddingVertical: vs(12),
  },
});
