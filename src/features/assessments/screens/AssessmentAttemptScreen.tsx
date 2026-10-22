/**
 * Assessment player — one question, server clock, autosave.
 * Answer keys stay off this screen.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ClipboardList, Timer } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { assessmentApi } from '@/features/assessments/api/assessment.api';
import { AttemptQuestion } from '@/features/assessments/components/AttemptQuestion';
import {
  asmtKeys,
  useAttemptQuery,
  useSubmitAttemptMutation,
} from '@/features/assessments/hooks/useAssessmentQueries';
import {
  clockDriftMs,
  draftIsAnswered,
  draftsFromAttempt,
  formatClock,
  payloadFromDrafts,
  remainingSec,
  type AnswerDraft,
} from '@/features/assessments/lib/assessment-player';
import type { AttemptState } from '@/features/assessments/types/assessment.types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import {
  useScreenBottomPadding,
  useScreenTopPadding,
} from '@/shared/lib/safe-area';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ConfirmModal, Screen, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentAttempt'>;

/**
 * Full paper. Leaving asks first. The deadline does not pause.
 */
export function AssessmentAttemptScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { slug, attemptId } = route.params;
  const attempt = useAttemptQuery(attemptId);
  const data = attempt.data;
  const replaced = useRef(false);

  useEffect(() => {
    if (!data || data.status === 'in_progress' || replaced.current) return;
    replaced.current = true;
    navigation.replace('AssessmentResult', { slug, attemptId });
  }, [attemptId, data, navigation, slug]);

  if (attempt.isLoading) {
    return (
      <Screen padded={false}>
        <Spinner />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen padded={false}>
        <LearnEmptyState
          actionLabel="Back to test"
          description="This attempt is not on the signed-in account."
          icon={<ClipboardList color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => navigation.navigate('AssessmentDetail', { slug })}
          title="Attempt unavailable"
        />
      </Screen>
    );
  }

  if (data.status !== 'in_progress') {
    return (
      <Screen padded={false}>
        <Spinner />
      </Screen>
    );
  }

  return (
    <AttemptPaper
      attempt={data}
      attemptId={attemptId}
      navigation={navigation}
      slug={slug}
    />
  );
}

function AttemptPaper({
  attempt,
  attemptId,
  navigation,
  slug,
}: {
  attempt: AttemptState;
  attemptId: string;
  navigation: Props['navigation'];
  slug: string;
}) {
  const theme = useTheme();
  const topPad = useScreenTopPadding();
  const dockPad = useScreenBottomPadding(vs(12));
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();
  const submit = useSubmitAttemptMutation();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => draftsFromAttempt(attempt.answers));
  const [nowMs, setNowMs] = useState(() => Date.now() - clockDriftMs(attempt.serverNow));
  const [itemEndsAt, setItemEndsAt] = useState<number | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const driftRef = useRef(clockDriftMs(attempt.serverNow));
  const itemEndRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const indexRef = useRef(index);
  indexRef.current = index;
  const itemsRef = useRef(attempt.items);
  itemsRef.current = attempt.items;
  const submittingRef = useRef(false);
  const allowLeave = useRef(false);
  const leftLogged = useRef(false);
  const advancedItem = useRef<string | null>(null);
  const paperFired = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const items = attempt.items;
  const current = items[index];
  const paperLeft = remainingSec(attempt.deadlineAt, nowMs);
  const itemLeft =
    itemEndsAt == null ? null : Math.max(0, Math.floor((itemEndsAt - nowMs) / 1000));
  const answered = items.filter((item) => draftIsAnswered(answers[item.id])).length;

  const goResult = useCallback(
    (next?: AttemptState) => {
      if (next) {
        client.setQueryData(asmtKeys.attempt(attemptId, token || 'guest'), next);
      }
      allowLeave.current = true;
      navigation.replace('AssessmentResult', { slug, attemptId });
    },
    [attemptId, client, navigation, slug, token],
  );

  const finish = useCallback(
    (silent?: boolean) => {
      if (!token || submittingRef.current) return;
      submittingRef.current = true;
      submit
        .mutateAsync({
          attemptId,
          answers: payloadFromDrafts(answersRef.current),
        })
        .then(() => {
          if (!silent) showToast.success('Submitted');
          goResult();
        })
        .catch((error: unknown) => {
          submittingRef.current = false;
          showErrorToast(error, 'Could not submit');
        });
    },
    [attemptId, goResult, submit, token],
  );

  const finishRef = useRef(finish);
  finishRef.current = finish;

  const goNext = useCallback(() => {
    const list = itemsRef.current;
    const at = indexRef.current;
    if (at >= list.length - 1) {
      finishRef.current(true);
      return;
    }
    Keyboard.dismiss();
    setIndex(at + 1);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now() - driftRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (paperLeft == null) return;
    if (paperLeft > 0) {
      paperFired.current = false;
      return;
    }
    if (paperFired.current) return;
    paperFired.current = true;
    finishRef.current(true);
  }, [paperLeft]);

  useEffect(() => {
    advancedItem.current = null;
    if (!current?.timeLimitSec) {
      itemEndRef.current = null;
      setItemEndsAt(null);
      return;
    }
    const end = Date.now() - driftRef.current + current.timeLimitSec * 1000;
    itemEndRef.current = end;
    setItemEndsAt(end);
  }, [current?.id, current?.timeLimitSec]);

  useEffect(() => {
    if (!current) return;
    const end = itemEndRef.current;
    if (end == null || end - nowMs > 0) return;
    if (advancedItem.current === current.id) return;
    advancedItem.current = current.id;
    goNext();
  }, [current, goNext, nowMs]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!token || submittingRef.current) return;
      assessmentApi
        .save(attemptId, payloadFromDrafts(answersRef.current), token)
        .then((next) => {
          if (next.status !== 'in_progress') goResult(next);
        })
        .catch(() => undefined);
    }, 10_000);
    return () => clearInterval(timer);
  }, [attemptId, goResult, token]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'background' && next !== 'inactive') return;
      if (!token || leftLogged.current || submittingRef.current) return;
      leftLogged.current = true;
      assessmentApi
        .recordEvent(attemptId, { type: 'tab_leave' }, token)
        .then(() => {
          showToast.info('Timer still running', 'Leaving the paper is logged.');
        })
        .catch(() => undefined);
    });
    return () => sub.remove();
  }, [attemptId, token]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (event) => {
      if (allowLeave.current) return;
      event.preventDefault();
      setLeaveOpen(true);
    });
    return unsub;
  }, [navigation]);

  const patch = (itemId: string, partial: AnswerDraft) => {
    setAnswers((prev) => {
      const next = { ...prev, [itemId]: { ...prev[itemId], ...partial } };
      answersRef.current = next;
      if (token) {
        assessmentApi
          .save(attemptId, payloadFromDrafts(next), token)
          .then((saved) => {
            if (saved.status !== 'in_progress') goResult(saved);
          })
          .catch(() => undefined);
      }
      return next;
    });
  };

  const paperUrgent = paperLeft != null && paperLeft <= 60;
  const itemUrgent = itemLeft != null && itemLeft <= 10;

  return (
    <Screen
      contentStyle={styles.frame}
      padded={false}
      safeBottom={false}
      safeTop={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.frame}>
        <View style={[styles.header, { paddingTop: topPad }]}>
          <Pressable
            accessibilityLabel="Leave test"
            accessibilityRole="button"
            hitSlop={ms(10)}
            onPress={() => setLeaveOpen(true)}
            style={[
              styles.back,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}>
            <ArrowLeft color={theme.colors.text} size={ms(20)} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="label" weight="bold">
              {items.length ? `Question ${index + 1}` : 'Paper'}
            </AppText>
            <AppText color="muted" variant="caption">
              {items.length
                ? `${answered} of ${items.length} answered`
                : 'No questions'}
            </AppText>
          </View>
          <View style={styles.clocks}>
            {itemLeft != null ? (
              <Clock
                label={formatClock(itemLeft)}
                urgent={itemUrgent}
              />
            ) : null}
            {paperLeft != null ? (
              <Clock label={formatClock(paperLeft)} urgent={paperUrgent} />
            ) : null}
          </View>
        </View>
        <View style={styles.trackWrap}>
          <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
            <View
              style={[
                styles.trackFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${items.length ? ((index + 1) / items.length) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {!current ? (
          <LearnEmptyState
            description="This paper has no questions."
            icon={<ClipboardList color={theme.colors.textMuted} size={ms(28)} />}
            title="Nothing to answer"
          />
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.frame}>
            <View style={styles.column}>
              <AttemptQuestion
                draft={answers[current.id] || {}}
                item={current}
                key={current.id}
                onChange={(partial) => patch(current.id, partial)}
                position={index + 1}
                total={items.length}
              />
            </View>
          </ScrollView>
        )}

        <View
          style={[
            styles.dock,
            {
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.background,
              paddingBottom: dockPad,
            },
          ]}>
          <View style={styles.dockRow}>
            <View style={styles.dockBtn}>
              <Button
                disabled={index === 0}
                fullWidth
                onPress={() => {
                  Keyboard.dismiss();
                  setIndex((value) => Math.max(0, value - 1));
                }}
                variant="secondary">
                Previous
              </Button>
            </View>
            <View style={styles.dockBtn}>
              {index < items.length - 1 ? (
                <Button fullWidth onPress={() => {
                  Keyboard.dismiss();
                  setIndex((value) => value + 1);
                }}>
                  Next
                </Button>
              ) : (
                <Button
                  disabled={!current || submit.isPending}
                  fullWidth
                  loading={submit.isPending}
                  onPress={() => finish(false)}>
                  Submit
                </Button>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        Icon={Timer}
        cancelLabel="Stay"
        confirmLabel="Leave"
        message="Saved answers stay on this attempt. A timed paper keeps the server clock."
        onCancel={() => setLeaveOpen(false)}
        onConfirm={() => {
          allowLeave.current = true;
          setLeaveOpen(false);
          navigation.goBack();
        }}
        title="Leave this test?"
        visible={leaveOpen}
      />
    </Screen>
  );
}

function Clock({ label, urgent }: { label: string; urgent: boolean }) {
  const theme = useTheme();
  const backgroundColor = urgent
    ? theme.mode === 'dark'
      ? theme.palette.warning[900]
      : theme.palette.warning[50]
    : theme.colors.primaryMuted;
  const color = urgent
    ? theme.mode === 'dark'
      ? theme.palette.warning[300]
      : theme.palette.warning[700]
    : theme.colors.primary;

  return (
    <View style={[styles.clock, { backgroundColor }]}>
      <AppText style={{ color }} variant="caption" weight="bold">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingHorizontal: s(16),
    paddingBottom: vs(8),
  },
  back: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  clocks: {
    flexDirection: 'row',
    gap: s(6),
  },
  clock: {
    minWidth: ms(52),
    height: ms(32),
    borderRadius: ms(999),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(10),
  },
  trackWrap: {
    paddingHorizontal: s(16),
    paddingBottom: vs(4),
  },
  track: {
    height: ms(4),
    borderRadius: ms(2),
    overflow: 'hidden',
  },
  trackFill: {
    height: ms(4),
    borderRadius: ms(2),
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: vs(16),
    paddingBottom: vs(28),
  },
  column: {
    width: '100%',
    maxWidth: 640,
    paddingHorizontal: s(16),
  },
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: vs(12),
    paddingHorizontal: s(16),
  },
  dockRow: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: s(10),
  },
  dockBtn: {
    flex: 1,
  },
});
