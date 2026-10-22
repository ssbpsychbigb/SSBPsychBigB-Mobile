/**
 * In-lesson MCQ — one question at a time, like Udemy / Coursera.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CheckCircle2, CircleHelp, Timer } from 'lucide-react-native';

import { useSubmitLessonQuizMutation } from '@/features/learn/hooks/useCourseQueries';
import { formatLessonClock } from '@/features/learn/lib/format-course';
import type { LessonDetails, QuizSubmitResult } from '@/features/learn/types/course.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';
import { showErrorToast } from '@/shared/ui/toast';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export type LessonQuizStageProps = {
  lesson: LessonDetails;
  slug: string;
  onNextLesson?: () => void;
};

/**
 * Player-slot quiz. Attempts and pass mark come from the same backend as web.
 */
export function LessonQuizStage({
  lesson,
  slug,
  onNextLesson,
}: LessonQuizStageProps) {
  const theme = useTheme();
  const quiz = lesson.quiz;
  const questions = quiz?.questions || [];
  const submit = useSubmitLessonQuizMutation(lesson.id, slug);
  const startedAt = useRef(Date.now());
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<number[]>(() =>
    questions.map(() => -1),
  );
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [remainSec, setRemainSec] = useState(quiz?.timeLimitSec || 0);

  const attempts = lesson.progress?.quizAttemptCount || 0;
  const remaining = Math.max(0, 5 - attempts);
  const current = questions[index];
  const allAnswered = picks.length === questions.length && picks.every((n) => n >= 0);
  const last = index >= questions.length - 1;
  const timed = (quiz?.timeLimitSec || 0) > 0;

  useEffect(() => {
    if (!timed || result) {
      return;
    }
    const id = setInterval(() => {
      setRemainSec((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timed, result]);

  const send = () => {
    if (!allAnswered || remaining < 1 || submit.isPending) {
      return;
    }
    const spent = Math.round((Date.now() - startedAt.current) / 1000);
    submit.mutate(
      { answers: picks, timeSpentSec: spent },
      {
        onSuccess: (data) => setResult(data.result),
        onError: (error) => showErrorToast(error, 'Could not submit quiz'),
      },
    );
  };

  useEffect(() => {
    if (timed && remainSec === 0 && !result && allAnswered) {
      send();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-submit once
  }, [remainSec]);

  const progress = useMemo(
    () => (questions.length ? (index + 1) / questions.length : 0),
    [index, questions.length],
  );

  if (!quiz || !questions.length) {
    return (
      <View style={[styles.panel, { backgroundColor: theme.colors.background }]}>
        <CircleHelp color={theme.colors.primary} size={ms(28)} />
        <AppText variant="label" weight="bold">
          Quiz coming soon
        </AppText>
        <AppText color="secondary" style={styles.center} variant="caption">
          This lesson has no questions yet.
        </AppText>
      </View>
    );
  }

  if (result) {
    return (
      <View style={[styles.panel, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.scoreRing,
            {
              borderColor: result.passed
                ? theme.colors.success
                : theme.colors.warning,
            },
          ]}>
          <AppText variant="title" weight="bold">
            {Math.round(result.scorePct)}%
          </AppText>
        </View>
        <AppText variant="subtitle" weight="bold">
          {result.passed ? 'Passed' : 'Not yet passed'}
        </AppText>
        <AppText color="secondary" style={styles.center} variant="caption">
          {result.correct} of {result.total} correct · pass at {quiz.passPct}%
          {' · '}
          {result.remainingAttempts} of 5 attempts left
        </AppText>
        {result.passed && onNextLesson ? (
          <Button onPress={onNextLesson}>Continue</Button>
        ) : result.remainingAttempts > 0 && !result.passed ? (
          <Button
            onPress={() => {
              setResult(null);
              setIndex(0);
              setPicks(questions.map(() => -1));
              startedAt.current = Date.now();
              setRemainSec(quiz.timeLimitSec || 0);
            }}
            variant="secondary">
            Try again
          </Button>
        ) : null}
      </View>
    );
  }

  if (!lesson.enrollment) {
    return (
      <View style={[styles.panel, { backgroundColor: theme.colors.background }]}>
        <CircleHelp color={theme.colors.primary} size={ms(28)} />
        <AppText variant="label" weight="bold">
          Enroll to take the quiz
        </AppText>
        <AppText color="secondary" style={styles.center} variant="caption">
          {questions.length} questions · pass at {quiz.passPct}%
        </AppText>
      </View>
    );
  }

  if (remaining < 1) {
    return (
      <View style={[styles.panel, { backgroundColor: theme.colors.background }]}>
        <AppText variant="label" weight="bold">
          No attempts left
        </AppText>
        <AppText color="secondary" style={styles.center} variant="caption">
          Last score {Math.round(lesson.progress?.quizScorePct || 0)}%
          {lesson.progress?.quizPassed ? ' · already passed' : ''}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.background }]}>
      <View style={styles.meta}>
        <AppText color="muted" variant="caption" weight="semibold">
          Question {index + 1} of {questions.length}
        </AppText>
        <View style={styles.chips}>
          {timed ? (
            <View style={styles.chip}>
              <Timer color={theme.colors.textMuted} size={ms(12)} />
              <AppText color="muted" variant="caption">
                {formatLessonClock(remainSec)}
              </AppText>
            </View>
          ) : null}
          <AppText color="muted" variant="caption">
            {remaining} left · pass {quiz.passPct}%
          </AppText>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: theme.colors.primary,
            },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}>
        <AppText variant="label" weight="bold">
          {current?.prompt}
        </AppText>
        {(current?.options || []).map((option, oi) => {
          const selected = picks[index] === oi;
          return (
            <Pressable
              key={`${index}-${oi}`}
              onPress={() =>
                setPicks((prev) => {
                  const next = [...prev];
                  next[index] = oi;
                  return next;
                })
              }
              style={[
                styles.option,
                {
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: selected
                    ? theme.colors.primaryMuted
                    : theme.colors.surface,
                },
              ]}>
              <View
                style={[
                  styles.letter,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.background,
                  },
                ]}>
                <AppText
                  color={selected ? 'inverse' : 'primary'}
                  variant="caption"
                  weight="bold">
                  {LETTERS[oi] || String(oi + 1)}
                </AppText>
              </View>
              <AppText style={styles.flex} variant="body">
                {option}
              </AppText>
              {selected ? (
                <CheckCircle2 color={theme.colors.primary} size={ms(18)} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.nav}>
        <Button
          disabled={index === 0}
          onPress={() => setIndex((value) => Math.max(0, value - 1))}
          size="sm"
          variant="secondary">
          Back
        </Button>
        {last ? (
          <Button
            disabled={!allAnswered || remaining < 1}
            loading={submit.isPending}
            onPress={send}
            size="sm">
            Submit
          </Button>
        ) : (
          <Button
            disabled={(picks[index] ?? -1) < 0}
            onPress={() =>
              setIndex((value) => Math.min(questions.length - 1, value + 1))
            }
            size="sm">
            Next
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: vs(280),
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(10),
  },
  panel: {
    minHeight: vs(240),
    paddingHorizontal: s(20),
    paddingVertical: vs(28),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(10),
  },
  center: {
    textAlign: 'center',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: s(8),
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  track: {
    height: vs(4),
    borderRadius: ms(2),
    marginTop: vs(10),
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: ms(2),
  },
  body: {
    paddingTop: vs(16),
    paddingBottom: vs(12),
    gap: vs(10),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    minHeight: ms(52),
  },
  letter: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(10),
  },
  scoreRing: {
    width: ms(108),
    height: ms(108),
    borderRadius: ms(54),
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
