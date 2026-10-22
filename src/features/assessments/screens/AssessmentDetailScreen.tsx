/**
 * Test detail — rules, start, and the gate back into a course.
 */

import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, ClipboardList } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import {
  asmtKindLabel,
  formatAssessmentDuration,
  formatAssessmentPrice,
} from '@/features/assessments/lib/assessment-format';
import {
  useAssessmentDetailQuery,
  useStartAssessmentMutation,
} from '@/features/assessments/hooks/useAssessmentQueries';
import { revealRuleLabel, startGateFromError, type StartGate } from '@/features/assessments/lib/start-gate';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  useScreenBottomPadding,
  useScreenTopPadding,
} from '@/shared/lib/safe-area';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen, Spinner } from '@/shared/ui';
import { showErrorToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentDetail'>;

/**
 * Opens from the Tests list. Guests browse; Start asks them to join.
 */
export function AssessmentDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const topPad = useScreenTopPadding();
  const dockPad = useScreenBottomPadding(vs(12));
  const { slug } = route.params;
  const token = useAuthStore((state) => state.accessToken);
  const detail = useAssessmentDetailQuery(slug);
  const start = useStartAssessmentMutation();
  const [joinOpen, setJoinOpen] = useState(false);
  const [gate, setGate] = useState<StartGate | null>(null);
  const item = detail.data;
  const cover = resolveUploadUrl(item?.coverUrl);
  const needsPurchase = Boolean(
    item && item.priceInr > 0 && !item.my?.purchased && !item.my?.isAuthor,
  );

  const onStart = async () => {
    if (!item) return;
    if (!token) {
      setJoinOpen(true);
      return;
    }
    setGate(null);
    try {
      const attempt = await start.mutateAsync(item.slug || item.id);
      navigation.navigate('AssessmentAttempt', {
        slug: item.slug || slug,
        attemptId: attempt.id,
      });
    } catch (error) {
      setGate(startGateFromError(error));
      showErrorToast(error, 'Could not start this test');
    }
  };

  return (
    <Screen
      contentStyle={styles.frame}
      padded={false}
      safeBottom={false}
      safeTop={false}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={ms(10)}
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
        <AppText numberOfLines={1} variant="subtitle" weight="bold">
          Test
        </AppText>
      </View>

      {detail.isLoading ? (
        <Spinner />
      ) : !item ? (
        <LearnEmptyState
          actionLabel="Back"
          description="This test is not published, or it is limited to a course you have not joined."
          icon={<ClipboardList color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => navigation.goBack()}
          title="Not available"
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: vs(24) }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
            <View style={styles.column}>
              {cover ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: cover }}
                  style={styles.cover}
                />
              ) : (
                <View
                  style={[
                    styles.cover,
                    styles.coverFallback,
                    { backgroundColor: theme.colors.primaryMuted },
                  ]}>
                  <ClipboardList
                    color={theme.colors.primary}
                    size={ms(28)}
                    strokeWidth={1.8}
                  />
                </View>
              )}

              <AppText color="brand" variant="caption" weight="bold">
                {item.official
                  ? `BIGB · ${asmtKindLabel(item.kind)}`
                  : asmtKindLabel(item.kind)}
              </AppText>
              <AppText variant="title" weight="bold">
                {item.title}
              </AppText>
              <AppText color="secondary" variant="body">
                {item.description ||
                  'Answer on this account. A timed paper keeps its server clock if you leave.'}
              </AppText>

              <View style={styles.stats}>
                <Stat
                  label="Questions"
                  value={String(item.itemCount)}
                />
                <Stat
                  label="Time"
                  value={formatAssessmentDuration(item.durationSec)}
                />
                <Stat label="Pass" value={`${item.passPct}%`} />
                <Stat
                  label="Price"
                  value={formatAssessmentPrice(item.priceInr)}
                />
              </View>

              {item.my?.attemptsUsed ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    navigation.navigate('AssessmentHistory', {
                      slug: item.slug || slug,
                    })
                  }
                  style={styles.historyLink}>
                  <AppText color="brand" variant="label" weight="semibold">
                    {item.my.lastScorePct != null
                      ? `Last score ${item.my.lastScorePct}% · See attempts`
                      : `See your ${item.my.attemptsUsed} attempts`}
                  </AppText>
                </Pressable>
              ) : (
                <AppText color="muted" variant="caption">
                  {`Up to ${item.maxAttempts} attempts`}
                </AppText>
              )}
              <AppText color="muted" variant="caption">
                {revealRuleLabel(item.revealAnswers)}
                {item.negativeMarkPerWrong
                  ? ` · −${item.negativeMarkPerWrong} for a wrong answer`
                  : ''}
              </AppText>
              {item.requiredForCertificate ? (
                <AppText color="secondary" variant="caption">
                  Required for the linked course certificate.
                </AppText>
              ) : null}
              {item.leaderboardEnabled ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (!token) {
                      setJoinOpen(true);
                      return;
                    }
                    navigation.navigate('AssessmentLeaderboard', {
                      slug: item.slug || slug,
                    });
                  }}
                  style={styles.historyLink}>
                  <AppText color="brand" variant="label" weight="semibold">
                    Leaderboard
                  </AppText>
                </Pressable>
              ) : null}
              {item.visibility === 'course' ? (
                <AppText color="secondary" variant="caption">
                  Enrolled learners only.
                </AppText>
              ) : null}

              {needsPurchase ? (
                <AppText color="secondary" variant="caption">
                  Buy once on this account. Start stays available here and on the website.
                </AppText>
              ) : null}
              {gate ? (
                <View style={styles.gate}>
                  <AppText color="danger" variant="caption">
                    {gate.line}
                  </AppText>
                  {gate.courseSlug ? (
                    <Button
                      onPress={() =>
                        navigation.navigate('CourseDetail', {
                          slug: gate.courseSlug as string,
                        })
                      }
                      size="sm"
                      variant="secondary">
                      Open course
                    </Button>
                  ) : null}
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View
            style={[
              styles.dock,
              {
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                paddingBottom: dockPad,
              },
            ]}>
            <View style={styles.column}>
              <Button
                disabled={start.isPending}
                fullWidth
                loading={needsPurchase ? false : start.isPending}
                onPress={() => {
                  if (needsPurchase) {
                    if (!token) {
                      setJoinOpen(true);
                      return;
                    }
                    navigation.navigate('AssessmentCheckout', {
                      slug: item.slug || slug,
                    });
                    return;
                  }
                  void onStart();
                }}>
                {needsPurchase
                  ? `Buy · ${formatAssessmentPrice(item.priceInr)}`
                  : item.my?.isAuthor
                    ? 'Preview'
                    : 'Start'}
              </Button>
            </View>
          </View>
        </>
      )}

      <JoinToContinueSheet
        message="Attempts stay on this account, including tests you already opened on the web."
        onClose={() => setJoinOpen(false)}
        title="Sign in to start"
        visible={joinOpen}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.stat,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText numberOfLines={1} variant="label" weight="bold">
        {value}
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
    gap: s(12),
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
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: s(16),
    gap: vs(8),
  },
  cover: {
    width: '100%',
    height: vs(168),
    borderRadius: ms(16),
    marginBottom: vs(8),
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginTop: vs(8),
  },
  stat: {
    flexGrow: 1,
    flexBasis: '46%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    gap: vs(2),
  },
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: vs(12),
    alignItems: 'center',
  },
  gate: {
    gap: vs(8),
    marginTop: vs(4),
  },
  historyLink: {
    alignSelf: 'flex-start',
    minHeight: ms(36),
    justifyContent: 'center',
  },
});
