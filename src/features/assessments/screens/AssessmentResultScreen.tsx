/**
 * Attempt result — score, analysis, topics, and review.
 * Keys render only when the server includes `review`.
 */

import { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Bookmark, ClipboardList, Flag } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import {
  BookmarkSheet,
  ChallengeSheet,
} from '@/features/assessments/components/ResultSheets';
import { useAttemptQuery } from '@/features/assessments/hooks/useAssessmentQueries';
import {
  formatSpent,
  topicStatusLabel,
} from '@/features/assessments/lib/assessment-format';
import type {
  AttemptReviewItem,
  AttemptState,
  AttemptTopic,
} from '@/features/assessments/types/assessment.types';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import {
  useScreenBottomPadding,
  useScreenTopPadding,
} from '@/shared/lib/safe-area';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen, Spinner } from '@/shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentResult'>;

/**
 * Scrollable result. Bookmark and challenge open sheets.
 */
export function AssessmentResultScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const topPad = useScreenTopPadding();
  const dockPad = useScreenBottomPadding(vs(12));
  const { slug, attemptId } = route.params;
  const attempt = useAttemptQuery(attemptId);
  const data = attempt.data;
  const [bookmark, setBookmark] = useState<AttemptReviewItem | null>(null);
  const [challenge, setChallenge] = useState<AttemptReviewItem | null>(null);
  const open = data?.status === 'in_progress';

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
          Result
        </AppText>
      </View>

      {attempt.isLoading ? (
        <Spinner />
      ) : !data ? (
        <LearnEmptyState
          actionLabel="Back to test"
          description="This result is not on the signed-in account."
          icon={<ClipboardList color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => navigation.navigate('AssessmentDetail', { slug })}
          title="Result unavailable"
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.frame}>
            <View style={styles.column}>
              <ScoreHero data={data} />
              <AnalysisGrid data={data} />
              <TopicList topics={data.analysis?.topics} />
              <RevisionList lines={data.analysis?.suggestedRevision} />
              <CaptureList data={data} />
              <ReviewList
                data={data}
                onBookmark={setBookmark}
                onChallenge={setChallenge}
              />
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
            <View style={styles.dockInner}>
              {open ? (
                <Button
                  fullWidth
                  onPress={() =>
                    navigation.replace('AssessmentAttempt', { slug, attemptId })
                  }>
                  Back to attempt
                </Button>
              ) : (
                <>
                  <Button
                    fullWidth
                    onPress={() =>
                      navigation.navigate('AssessmentHistory', { slug })
                    }>
                    Your attempts
                  </Button>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('AssessmentDetail', { slug })}
                    style={styles.textLink}>
                    <AppText color="secondary" variant="label" weight="semibold">
                      Back to test
                    </AppText>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </>
      )}

      {bookmark ? (
        <BookmarkSheet
          attemptId={attemptId}
          folder={bookmark.bookmarkFolder}
          itemId={bookmark.id}
          onClose={() => setBookmark(null)}
          visible
        />
      ) : null}
      {challenge ? (
        <ChallengeSheet
          attemptId={attemptId}
          itemId={challenge.id}
          onClose={() => setChallenge(null)}
          visible
        />
      ) : null}
    </Screen>
  );
}

function ScoreHero({ data }: { data: AttemptState }) {
  const theme = useTheme();
  const pending = data.status === 'pending_grade';
  const open = data.status === 'in_progress';
  const passed = data.passed;
  const ranked = !pending && !open && data.percentile != null;

  return (
    <View style={styles.hero}>
      <View
        style={[
          styles.ring,
          {
            borderColor: open
              ? theme.colors.border
              : pending
                ? theme.colors.primary
                : passed
                  ? theme.colors.success
                  : theme.colors.danger,
          },
        ]}>
        <AppText variant="title" weight="bold">
          {open ? '—' : pending ? '…' : `${data.scorePct}%`}
        </AppText>
      </View>
      <AppText variant="subtitle" weight="bold">
        {open
          ? 'This paper is still open'
          : pending
            ? 'Under evaluation'
            : passed
              ? 'Passed'
              : 'Not passed'}
      </AppText>
      <AppText color="secondary" style={styles.heroCopy} variant="body">
        {open
          ? 'Submit it before a score can appear.'
          : pending
            ? 'A mentor still has to mark this paper.'
            : `${data.correct} of ${data.total} correct`}
        {data.status === 'auto_submitted' ? ' · Time expired' : ''}
        {data.isPreview ? ' · Preview' : ''}
      </AppText>
      {ranked ? (
        <AppText color="muted" variant="caption">
          {data.rank != null
            ? `Rank ${data.rank}${data.rankedCount ? ` of ${data.rankedCount}` : ''}`
            : 'Ranked'}
          {` · ${data.percentile} percentile`}
        </AppText>
      ) : null}
    </View>
  );
}

function AnalysisGrid({ data }: { data: AttemptState }) {
  const theme = useTheme();
  const analysis = data.analysis;
  if (!analysis || data.status === 'in_progress') return null;
  const tiles: Array<[string, string]> = [
    ['Accuracy', `${analysis.accuracyPct}%`],
    ['Attempted', `${analysis.attemptRatePct}%`],
    ['Time / Q', formatSpent(analysis.timePerQuestionSec)],
    ['Duration', formatSpent(analysis.timeSpentSec)],
  ];
  return (
    <View style={styles.section}>
      <SectionTitle title="How you did" />
      <View
        style={[
          styles.strip,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}>
        {tiles.map(([label, value], index) => (
          <View
            key={label}
            style={[
              styles.stat,
              index % 2 === 1
                ? { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.colors.border }
                : null,
              index > 1
                ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }
                : null,
            ]}>
            <AppText color="muted" variant="caption">
              {label}
            </AppText>
            <AppText numberOfLines={1} variant="label" weight="bold">
              {value}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function TopicList({ topics }: { topics?: AttemptTopic[] }) {
  const theme = useTheme();
  if (!topics?.length) return null;
  return (
    <View style={styles.section}>
      <SectionTitle title="Topics" />
      <View
        style={[
          styles.list,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}>
        {topics.map((topic, index) => {
          const color =
            topic.status === 'strong'
              ? theme.colors.success
              : topic.status === 'weak'
                ? theme.colors.danger
                : theme.colors.textMuted;
          return (
            <View
              key={topic.topic}
              style={[
                styles.topic,
                index > 0
                  ? {
                      borderTopColor: theme.colors.border,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    }
                  : null,
              ]}>
              <View style={styles.row}>
                <AppText numberOfLines={1} style={styles.flex} variant="label" weight="semibold">
                  {topic.topic}
                </AppText>
                <AppText style={{ color }} variant="caption" weight="bold">
                  {topicStatusLabel(topic.status)}
                </AppText>
              </View>
              <View style={[styles.bar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: color,
                      width: `${Math.max(0, Math.min(100, topic.accuracyPct))}%`,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function RevisionList({ lines }: { lines?: string[] }) {
  const theme = useTheme();
  if (!lines?.length) return null;
  return (
    <View style={styles.section}>
      <SectionTitle title="Revise next" />
      <View style={styles.chips}>
        {lines.map((line) => (
          <View
            key={line}
            style={[
              styles.chip,
              { backgroundColor: theme.colors.primaryMuted },
            ]}>
            <AppText color="brand" variant="caption" weight="semibold">
              {line}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function CaptureList({ data }: { data: AttemptState }) {
  const theme = useTheme();
  if (!data.capture?.length) return null;
  return (
    <View style={styles.section}>
      <SectionTitle title="Your response" />
      {data.capture.map((row) => {
        const media = resolveUploadUrl(row.mediaUrl);
        return (
          <View
            key={row.id}
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}>
            {media ? (
              <Image
                resizeMode="contain"
                source={{ uri: media }}
                style={[styles.media, { backgroundColor: theme.colors.background }]}
              />
            ) : null}
            <AppText variant="label" weight="semibold">
              {row.prompt}
            </AppText>
            {row.text ? <AppText color="secondary" variant="body">{row.text}</AppText> : null}
            {row.characters ? (
              <AppText color="muted" variant="caption">{`Characters · ${row.characters}`}</AppText>
            ) : null}
            {row.theme ? (
              <AppText color="muted" variant="caption">{`Theme · ${row.theme}`}</AppText>
            ) : null}
            {row.story ? <AppText color="secondary" variant="body">{row.story}</AppText> : null}
            {data.status === 'graded' && row.marksAwarded != null ? (
              <AppText variant="caption" weight="semibold">
                {`Marks ${row.marksAwarded}${row.graderComment ? ` · ${row.graderComment}` : ''}`}
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function ReviewList({
  data,
  onBookmark,
  onChallenge,
}: {
  data: AttemptState;
  onBookmark: (item: AttemptReviewItem) => void;
  onChallenge: (item: AttemptReviewItem) => void;
}) {
  const theme = useTheme();
  if (data.status === 'in_progress') return null;
  if (!data.review?.length) {
    if (data.capture?.length) return null;
    const hidden =
      data.revealAnswers === 'after_window'
        ? 'Review opens after the test window.'
        : 'Answer keys stay hidden for this test.';
    return (
      <AppText color="muted" variant="body">
        {hidden}
      </AppText>
    );
  }

  return (
    <View style={styles.section}>
      <SectionTitle title="Review" />
      {data.review.map((row) => {
        const yours =
          row.selectedIndex == null ? 'Not answered' : row.options[row.selectedIndex] || '—';
        const correct = row.selectedIndex === row.correctIndex;
        const correctText = row.options[row.correctIndex] || '—';
        return (
          <View
            key={row.id}
            style={[
              styles.card,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}>
            <AppText variant="label" weight="semibold">
              {row.prompt}
            </AppText>
            {row.topic ? (
              <AppText color="muted" variant="caption">
                {row.subtopic ? `${row.topic} · ${row.subtopic}` : row.topic}
              </AppText>
            ) : null}
            <AppText
              style={{ color: correct ? theme.colors.success : theme.colors.danger }}
              variant="body">
              {`Your answer · ${yours}`}
            </AppText>
            {!correct ? (
              <AppText color="secondary" variant="body">
                {`Correct · ${correctText}`}
              </AppText>
            ) : null}
            {row.explanation ? (
              <AppText color="secondary" variant="caption">
                {row.explanation}
              </AppText>
            ) : null}
            {row.references ? (
              <AppText color="muted" variant="caption">
                {`Ref · ${row.references}`}
              </AppText>
            ) : null}
            {row.videoExplanationUrl ? (
              <Pressable
                onPress={() => {
                  void Linking.openURL(row.videoExplanationUrl as string);
                }}>
                <AppText color="brand" variant="label" weight="semibold">
                  Watch explanation
                </AppText>
              </Pressable>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onBookmark(row)}
                style={styles.action}>
                <Bookmark
                  color={row.bookmarked ? theme.colors.primary : theme.colors.textMuted}
                  size={ms(16)}
                  strokeWidth={2}
                />
                <AppText color={row.bookmarked ? 'brand' : 'secondary'} variant="caption" weight="semibold">
                  {row.bookmarked ? row.bookmarkFolder || 'Saved' : 'Save'}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onChallenge(row)}
                style={styles.action}>
                <Flag color={theme.colors.textMuted} size={ms(16)} strokeWidth={2} />
                <AppText color="secondary" variant="caption" weight="semibold">
                  Challenge
                </AppText>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <AppText variant="label" weight="bold">
      {title}
    </AppText>
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
  scroll: {
    alignItems: 'center',
    paddingTop: vs(8),
    paddingBottom: vs(28),
  },
  column: {
    width: '100%',
    maxWidth: 640,
    paddingHorizontal: s(16),
    gap: vs(22),
  },
  section: {
    gap: vs(10),
  },
  stack: {
    gap: s(10),
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(20),
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
    gap: vs(8),
  },
  hero: {
    alignItems: 'center',
    gap: vs(8),
    paddingTop: vs(8),
    paddingBottom: vs(4),
  },
  ring: {
    width: ms(112),
    height: ms(112),
    borderRadius: ms(56),
    borderWidth: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(4),
  },
  heroCopy: {
    textAlign: 'center',
  },
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(20),
    overflow: 'hidden',
  },
  stat: {
    width: '50%',
    paddingHorizontal: s(14),
    paddingVertical: vs(14),
    gap: vs(2),
  },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(20),
    overflow: 'hidden',
  },
  topic: {
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    gap: vs(8),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  bar: {
    height: ms(6),
    borderRadius: ms(3),
    overflow: 'hidden',
  },
  barFill: {
    height: ms(6),
    borderRadius: ms(3),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  chip: {
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  media: {
    width: '100%',
    height: vs(160),
    borderRadius: ms(14),
  },
  actions: {
    flexDirection: 'row',
    gap: s(16),
    marginTop: vs(4),
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    minHeight: ms(36),
  },
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: vs(12),
    paddingHorizontal: s(16),
    alignItems: 'center',
  },
  dockInner: {
    width: '100%',
    maxWidth: 640,
    gap: vs(8),
    alignItems: 'center',
  },
  textLink: {
    minHeight: ms(36),
    justifyContent: 'center',
    paddingHorizontal: s(12),
  },
});
