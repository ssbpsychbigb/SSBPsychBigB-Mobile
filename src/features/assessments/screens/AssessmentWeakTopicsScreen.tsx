/**
 * Revision map from marked answers.
 * Areas, the ones under 50%, and the server’s suggested next steps.
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Target } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';
import { useAssessmentWeakTopicsQuery } from '@/features/assessments/hooks/useAssessmentQueries';
import { topicStatusLabel } from '@/features/assessments/lib/assessment-format';
import type { WeakTopicsResult } from '@/features/assessments/types/assessment.types';
import { GuestUnlockPanel } from '@/features/auth/components/GuestUnlockPanel';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme, type AppTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, usePullToRefresh } from '@/shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentWeakTopics'>;
type RoadmapRow = WeakTopicsResult['roadmap'][number];

/**
 * Where to revise. Built only from graded attempt analysis.
 */
export function AssessmentWeakTopicsScreen({ navigation }: Props) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const topics = useAssessmentWeakTopicsQuery(Boolean(token));
  const roadmap = topics.data?.roadmap ?? [];
  const weak = topics.data?.weak ?? [];
  const suggestions = topics.data?.suggestions ?? [];
  const untouched = roadmap.length > 0 && roadmap.every((row) => row.status === 'unknown');

  const refreshControl = usePullToRefresh(() => topics.refetch());

  return (
    <SocialStackChrome
      refreshControl={refreshControl}
      subtitle="From marked answers across your tests."
      subtitleLines={2}
      title="Revision">
      {!token ? (
        <GuestUnlockPanel
          description="Finish a test and this map shows which areas need another pass."
          embedded
          icon={<Target color={theme.colors.primary} size={ms(32)} />}
          title="Sign in to see revision"
        />
      ) : topics.isLoading && !topics.data ? (
        <RevisionSkeleton />
      ) : topics.isError ? (
        <LearnEmptyState
          actionLabel="Retry"
          description="Check your connection and try again."
          icon={<Target color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => void topics.refetch()}
          title="Couldn’t load revision"
        />
      ) : roadmap.length === 0 ? (
        <LearnEmptyState
          actionLabel="Browse tests"
          description="Finish a marked test and the areas will show up here."
          icon={<Target color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => navigation.goBack()}
          title="No revision map yet"
        />
      ) : (
        <View style={styles.column}>
          {untouched ? (
            <View
              style={[
                styles.note,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}>
              <AppText variant="label" weight="bold">
                Nothing marked yet
              </AppText>
              <AppText color="secondary" variant="caption">
                Finish a test with an answer key. These six areas fill in from that score.
              </AppText>
              <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
                <AppText color="brand" variant="label" weight="semibold">
                  Browse tests
                </AppText>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.section}>
            <AppText variant="label" weight="bold">
              Needs work
            </AppText>
            {weak.length === 0 ? (
              <AppText color="secondary" variant="body">
                {untouched
                  ? 'No area is weak until a test is marked.'
                  : 'Nothing is under 50% right now.'}
              </AppText>
            ) : (
              weak.map((row) => {
                const match = roadmap.find((item) => item.id === row.id);
                return (
                  <AreaCard
                    key={row.id}
                    row={{
                      id: row.id,
                      label: row.label,
                      accuracyPct: match?.accuracyPct ?? null,
                      attempted: match?.attempted ?? 0,
                      status: 'weak',
                      topics: row.topics,
                      next: row.next,
                    }}
                  />
                );
              })
            )}
          </View>

          <View style={styles.section}>
            <AppText variant="label" weight="bold">
              All areas
            </AppText>
            {roadmap.map((row) => (
              <AreaCard key={row.id} row={row} />
            ))}
          </View>

          <View style={styles.section}>
            <AppText variant="label" weight="bold">
              Suggested next
            </AppText>
            {suggestions.length === 0 ? (
              <AppText color="secondary" variant="body">
                Suggestions appear after a marked test names a weak topic.
              </AppText>
            ) : (
              <View style={styles.chips}>
                {suggestions.map((line) => (
                  <View
                    key={line}
                    style={[
                      styles.suggest,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}>
                    <AppText variant="caption">{line}</AppText>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('AssessmentHistory')}
            style={styles.link}>
            <AppText color="brand" variant="label" weight="semibold">
              Your attempts
            </AppText>
            <ChevronRight color={theme.colors.primary} size={ms(16)} />
          </Pressable>
        </View>
      )}
    </SocialStackChrome>
  );
}

function AreaCard({ row }: { row: RoadmapRow }) {
  const theme = useTheme();
  const ink = statusColor(theme, row.status);
  const pct = row.accuracyPct;
  const label = row.status === 'unknown' ? 'Not started' : topicStatusLabel(row.status);
  const answered =
    row.attempted > 0
      ? `${row.attempted} ${row.attempted === 1 ? 'answer' : 'answers'}`
      : '';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}>
      <View style={styles.cardTop}>
        <View style={styles.copy}>
          <AppText numberOfLines={1} variant="label" weight="bold">
            {row.label}
          </AppText>
          <AppText color="muted" variant="caption">
            {answered ? `${label} · ${answered}` : label}
          </AppText>
        </View>
        <AppText style={{ color: ink }} variant="label" weight="bold">
          {pct == null ? '—' : `${pct}%`}
        </AppText>
      </View>
      <View style={[styles.bar, { backgroundColor: theme.colors.border }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max(0, Math.min(100, pct ?? 0))}%`,
              backgroundColor: pct == null ? theme.colors.border : ink,
            },
          ]}
        />
      </View>
      <AppText color="secondary" variant="caption">
        {row.next}
      </AppText>
      {row.topics.length ? (
        <View style={styles.chips}>
          {row.topics.map((topic) => (
            <View
              key={topic}
              style={[styles.topic, { backgroundColor: theme.colors.background }]}>
              <AppText color="secondary" variant="caption">
                {topic}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function RevisionSkeleton() {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading revision" style={styles.column}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View
          key={index}
          style={[styles.card, styles.skel, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.skelLine, { backgroundColor: theme.colors.background }]} />
          <View style={[styles.skelLine, styles.skelShort, { backgroundColor: theme.colors.background }]} />
        </View>
      ))}
    </View>
  );
}

function statusColor(theme: AppTheme, status: RoadmapRow['status']) {
  if (status === 'strong') return theme.colors.success;
  if (status === 'weak') return theme.colors.danger;
  if (status === 'ok') return theme.colors.primary;
  return theme.colors.textMuted;
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: vs(22),
    paddingTop: vs(4),
  },
  section: {
    gap: vs(10),
  },
  note: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(18),
    paddingHorizontal: s(14),
    paddingVertical: vs(14),
    gap: vs(6),
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(18),
    paddingHorizontal: s(14),
    paddingVertical: vs(14),
    gap: vs(8),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vs(2),
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
  topic: {
    borderRadius: ms(999),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },
  suggest: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    maxWidth: '100%',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    alignSelf: 'flex-start',
    minHeight: ms(36),
  },
  skel: {
    height: vs(88),
  },
  skelLine: {
    height: vs(12),
    borderRadius: ms(6),
    width: '72%',
  },
  skelShort: {
    width: '40%',
  },
});
