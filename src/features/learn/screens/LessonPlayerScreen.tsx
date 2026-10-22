/**
 * Lesson player — gated video, YouTube, reading, live, quiz shell.
 */

import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Headphones,
  List,
  Lock,
  Radio,
  StickyNote,
} from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import {
  useLessonQuery,
  useSaveLessonProgressMutation,
} from '@/features/learn/hooks/useCourseQueries';
import { LessonNotesSheet } from '@/features/learn/components/LessonNotesSheet';
import { LessonPdfStage } from '@/features/learn/components/LessonPdfStage';
import { LessonQuizStage } from '@/features/learn/components/LessonQuizStage';
import { LessonVideoPlayer } from '@/features/learn/components/LessonVideoPlayer';
import { YouTubeLessonPlayer } from '@/features/learn/components/YouTubeLessonPlayer';
import { courseCoverSource } from '@/features/learn/lib/course-cover';
import { formatLessonClock } from '@/features/learn/lib/format-course';
import { resolveLessonExperience } from '@/features/learn/lib/lesson-experience';
import { htmlToPlain } from '@/features/learn/lib/lesson-media';
import type { LessonDetails, SaveProgressInput } from '@/features/learn/types/course.types';
import { useScreenTopPadding } from '@/shared/lib/safe-area';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen, Spinner } from '@/shared/ui';
import { showErrorToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonPlayer'>;

/**
 * Cinema-first lesson. Progress syncs to the same enrollment as web.
 */
export function LessonPlayerScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const topPad = useScreenTopPadding();
  const { slug, lessonId } = route.params;
  const lessonQuery = useLessonQuery(lessonId);
  const saveProgress = useSaveLessonProgressMutation(lessonId, slug);
  const saveMutate = saveProgress.mutate;
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const lesson = lessonQuery.data;
  const locked =
    Boolean(lessonQuery.isError) ||
    (Boolean(lesson) && !lesson?.enrollment && !lesson?.previewAvailable);

  const goLesson = (id: string) => {
    navigation.navigate('LessonPlayer', { slug, lessonId: id });
  };

  const enrolled = Boolean(lesson?.enrollment);
  const onProgress = useCallback(
    (input: SaveProgressInput) => {
      if (typeof input.lastPositionSec === 'number') {
        setPlayhead(input.lastPositionSec);
      }
      if (!enrolled) {
        return;
      }
      saveMutate(input, {
        onError: (error) => showErrorToast(error, 'Could not save progress'),
      });
    },
    [enrolled, saveMutate],
  );

  return (
    <Screen
      padded={false}
      safeBottom
      safeTop={false}
      style={{ backgroundColor: '#0B0D12' }}>
      <View style={[styles.top, { paddingTop: topPad }]}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}>
          <ArrowLeft color="#FFFFFF" size={ms(20)} strokeWidth={2} />
        </Pressable>
        <View style={styles.titles}>
          <AppText color="inverse" numberOfLines={1} variant="label" weight="bold">
            {lesson?.course.title || 'Lesson'}
          </AppText>
          <AppText color="inverse" numberOfLines={1} variant="caption">
            {lesson?.title || 'Loading…'}
          </AppText>
        </View>
        {enrolled ? (
          <Pressable
            accessibilityLabel="Notes"
            onPress={() => setNotesOpen(true)}
            style={styles.iconBtn}>
            <StickyNote color="#FFFFFF" size={ms(17)} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="Syllabus"
          onPress={() => setSyllabusOpen((value) => !value)}
          style={styles.iconBtn}>
          <List color="#FFFFFF" size={ms(18)} />
        </Pressable>
      </View>

      {lessonQuery.isLoading && !lesson ? (
        <View style={styles.stageFallback}>
          <Spinner />
        </View>
      ) : locked || !lesson ? (
        <LockedStage
          onBack={() => navigation.navigate('CourseDetail', { slug })}
        />
      ) : (
        <LessonStage
          lesson={lesson}
          onNextLesson={
            lesson.nextLesson
              ? () => goLesson(lesson.nextLesson!.id)
              : undefined
          }
          onProgress={onProgress}
          slug={slug}
        />
      )}

      {lesson && !locked ? (
        <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
          <ScrollView
            contentContainerStyle={styles.sheetBody}
            showsVerticalScrollIndicator={false}>
            <View style={styles.metaRow}>
              <AppText variant="subtitle" weight="bold">
                {lesson.title}
              </AppText>
              {lesson.progress?.completed ? (
                <View
                  style={[
                    styles.done,
                    { backgroundColor: theme.colors.primaryMuted },
                  ]}>
                  <AppText color="brand" variant="caption" weight="semibold">
                    Completed
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText color="secondary" variant="caption">
              {lesson.lessonType.replace(/_/g, ' ')}
              {lesson.durationSec
                ? ` · ${formatLessonClock(lesson.durationSec)}`
                : ''}
              {lesson.previewAvailable && !lesson.enrollment
                ? ' · Preview'
                : ''}
            </AppText>

            {syllabusOpen && lesson.sections?.length ? (
              <SyllabusList
                currentId={lesson.id}
                onPick={goLesson}
                sections={lesson.sections}
              />
            ) : null}

            <View style={styles.navRow}>
              <Button
                disabled={!lesson.prevLesson}
                onPress={() =>
                  lesson.prevLesson && goLesson(lesson.prevLesson.id)
                }
                size="sm"
                variant="secondary">
                Previous
              </Button>
              <Button
                disabled={!lesson.nextLesson}
                onPress={() =>
                  lesson.nextLesson && goLesson(lesson.nextLesson.id)
                }
                size="sm">
                Next
              </Button>
            </View>
            <Button
              onPress={() => navigation.navigate('CourseDetail', { slug })}
              variant="ghost">
              Back to course
            </Button>
          </ScrollView>
        </View>
      ) : null}

      {enrolled ? (
        <LessonNotesSheet
          lessonId={lessonId}
          onClose={() => setNotesOpen(false)}
          timestampSec={playhead || lesson?.progress?.lastPositionSec || 0}
          visible={notesOpen}
        />
      ) : null}
    </Screen>
  );
}

function LessonStage({
  lesson,
  slug,
  onProgress,
  onNextLesson,
}: {
  lesson: LessonDetails;
  slug: string;
  onProgress: (input: SaveProgressInput) => void;
  onNextLesson?: () => void;
}) {
  const theme = useTheme();
  const experience = resolveLessonExperience(lesson);
  const markRead = () =>
    onProgress({
      watchPct: 100,
      completed: true,
      timeSpentSec: 30,
    });

  if (experience.kind === 'quiz') {
    return (
      <LessonQuizStage
        lesson={lesson}
        onNextLesson={onNextLesson}
        slug={slug}
      />
    );
  }

  if (experience.kind === 'live') {
    return (
      <View style={[styles.panel, { backgroundColor: theme.colors.background }]}>
        <Radio color={theme.colors.primary} size={ms(22)} />
        <AppText variant="label" weight="bold">
          Live classroom
        </AppText>
        <AppText color="secondary" variant="caption">
          {lesson.liveStartsAt
            ? `Starts ${new Date(lesson.liveStartsAt).toLocaleString()}`
            : 'Join the session when your instructor is live.'}
        </AppText>
        {experience.url ? (
          <Button
            onPress={() => {
              void Linking.openURL(experience.url);
              onProgress({
                watchPct: 100,
                lastPositionSec: lesson.durationSec || 0,
                completed: true,
                timeSpentSec: 60,
              });
            }}>
            Join live
          </Button>
        ) : (
          <AppText color="muted" variant="caption">
            Meeting link unlocks after enroll.
          </AppText>
        )}
      </View>
    );
  }

  if (experience.kind === 'pdf') {
    return (
      <LessonPdfStage
        canComplete={Boolean(lesson.enrollment)}
        completed={Boolean(lesson.progress?.completed)}
        onComplete={markRead}
        src={experience.src}
        title={lesson.title}
      />
    );
  }

  if (experience.kind === 'article') {
    const body = htmlToPlain(lesson.bodyHtml) || lesson.title;
    return (
      <ScrollView
        contentContainerStyle={[
          styles.reading,
          { backgroundColor: theme.colors.background },
        ]}>
        <AppText color="muted" variant="caption" weight="semibold">
          Reading
        </AppText>
        <AppText variant="body">{body}</AppText>
        {lesson.enrollment ? (
          <Button onPress={markRead} size="sm">
            {lesson.progress?.completed ? 'Completed' : 'Mark complete'}
          </Button>
        ) : (
          <AppText color="muted" variant="caption">
            Preview only — enroll to save completion.
          </AppText>
        )}
      </ScrollView>
    );
  }

  if (experience.kind === 'youtube') {
    return (
      <YouTubeLessonPlayer
        onProgress={onProgress}
        resumeAtSec={lesson.progress?.lastPositionSec || 0}
        videoId={experience.videoId}
      />
    );
  }

  if (experience.kind === 'audio') {
    return (
      <LessonVideoPlayer
        audioOnly
        chapters={lesson.chapters}
        onProgress={onProgress}
        poster={courseCoverSource({ slug: lesson.course.slug })}
        resumeAtSec={lesson.progress?.lastPositionSec || 0}
        src={experience.src}
      />
    );
  }

  if (experience.kind === 'video') {
    return (
      <LessonVideoPlayer
        captionSrc={experience.captionSrc}
        chapters={lesson.chapters}
        onProgress={onProgress}
        resumeAtSec={lesson.progress?.lastPositionSec || 0}
        skipIntroSec={lesson.skipIntroSec || 0}
        skipOutroSec={lesson.skipOutroSec || 0}
        src={experience.src}
      />
    );
  }

  return (
    <View style={styles.stageFallback}>
      <Headphones color="#FFFFFF" size={ms(22)} />
      <AppText color="inverse" variant="caption">
        This lesson has no media yet. Next and Previous still work.
      </AppText>
    </View>
  );
}

function LockedStage({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.stageFallback}>
      <View style={styles.lockRing}>
        <Lock color="#FFFFFF" size={ms(26)} />
      </View>
      <AppText color="inverse" variant="label" weight="bold">
        Enroll to watch
      </AppText>
      <AppText color="inverse" style={styles.center} variant="caption">
        This lesson is gated. Preview is off — enroll from the course page.
      </AppText>
      <Button onPress={onBack} size="sm">
        View course
      </Button>
    </View>
  );
}

function SyllabusList({
  sections,
  currentId,
  onPick,
}: {
  sections: NonNullable<LessonDetails['sections']>;
  currentId: string;
  onPick: (id: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.syllabus, { borderColor: theme.colors.border }]}>
      {sections.map((section) => (
        <View key={section.id}>
          <AppText color="muted" variant="caption" weight="semibold">
            {section.title}
          </AppText>
          {section.lessons.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onPick(item.id)}
              style={styles.syllabusRow}>
              <AppText
                color={item.id === currentId ? 'brand' : 'primary'}
                numberOfLines={2}
                style={styles.flex}
                variant="caption"
                weight={item.id === currentId ? 'bold' : 'regular'}>
                {item.title}
              </AppText>
              <AppText color="muted" variant="caption">
                {formatLessonClock(item.durationSec)}
              </AppText>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingHorizontal: s(12),
    paddingBottom: vs(8),
  },
  iconBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  stageFallback: {
    height: vs(220),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(24),
    gap: vs(10),
  },
  lockRing: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
  },
  sheetBody: {
    paddingHorizontal: s(16),
    paddingTop: vs(16),
    paddingBottom: vs(20),
    gap: vs(10),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(8),
  },
  done: {
    borderRadius: ms(8),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
  },
  navRow: {
    flexDirection: 'row',
    gap: s(10),
  },
  panel: {
    minHeight: vs(220),
    paddingHorizontal: s(20),
    paddingVertical: vs(24),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(8),
  },
  reading: {
    minHeight: vs(220),
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
    gap: vs(12),
  },
  flex: {
    flex: 1,
  },
  syllabus: {
    borderWidth: 1,
    borderRadius: ms(14),
    padding: s(12),
    gap: vs(8),
  },
  syllabusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingVertical: vs(6),
  },
});
