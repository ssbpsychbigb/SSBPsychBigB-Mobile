/**
 * Finished and in-progress attempts for this account.
 * A card opens the result, or the paper if it is still open.
 */

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, ClipboardList } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';
import { useAssessmentHistoryQuery } from '@/features/assessments/hooks/useAssessmentQueries';
import {
  asmtKindLabel,
  formatAssessmentDuration,
} from '@/features/assessments/lib/assessment-format';
import type { AssessmentHistory } from '@/features/assessments/types/assessment.types';
import { GuestUnlockPanel } from '@/features/auth/components/GuestUnlockPanel';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { formatRelativeTime } from '@/features/learn/lib/format-course';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme, type AppTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, usePullToRefresh } from '@/shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentHistory'>;
type HistoryItem = AssessmentHistory['items'][number];
type HistorySummary = AssessmentHistory['summary'];
type FilterId = 'all' | 'open' | 'passed' | 'missed' | 'marking';

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'passed', label: 'Passed' },
  { id: 'missed', label: 'Not passed' },
  { id: 'marking', label: 'Marking' },
];

/**
 * My attempts. Pass `slug` to keep the list on one test.
 */
export function AssessmentHistoryScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const slug = route.params?.slug;
  const history = useAssessmentHistoryQuery(Boolean(token));
  const [filter, setFilter] = useState<FilterId>('all');
  const scoped = useMemo(
    () => (history.data?.items ?? []).filter((row) => (slug ? row.slug === slug : true)),
    [history.data?.items, slug],
  );
  const counts = useMemo(() => countBuckets(scoped), [scoped]);
  const visibleFilters = FILTERS.filter((item) => item.id === 'all' || counts[item.id] > 0);
  const items = scoped.filter((row) => matchesFilter(row, filter));
  const groups = useMemo(() => groupAttempts(items), [items]);
  const summary = slug || filter !== 'all' ? summarize(items) : history.data?.summary;
  const focusedTitle = slug ? scoped[0]?.title : undefined;

  const refreshControl = usePullToRefresh(() => history.refetch());

  return (
    <SocialStackChrome
      refreshControl={refreshControl}
      subtitle={focusedTitle || 'Tap a paper to open that score again.'}
      subtitleLines={focusedTitle ? 2 : 1}
      title="Your attempts">
      {!token ? (
        <GuestUnlockPanel
          description="Scores stay on this account, including tests you finished on the web."
          embedded
          icon={<ClipboardList color={theme.colors.primary} size={ms(32)} />}
          title="Sign in to see attempts"
        />
      ) : history.isLoading && !history.data ? (
        <HistorySkeleton />
      ) : history.isError ? (
        <LearnEmptyState
          actionLabel="Retry"
          description="Check your connection and try again."
          icon={<ClipboardList color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => void history.refetch()}
          title="Couldn’t load attempts"
        />
      ) : scoped.length === 0 ? (
        <LearnEmptyState
          actionLabel="Browse tests"
          description="Finish a test and it will stay in this list."
          icon={<ClipboardList color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => navigation.goBack()}
          title="No attempts yet"
        />
      ) : (
        <View style={styles.column}>
          {summary && summary.attempts > 0 ? (
            <SummaryHero
              hasScore={
                slug || filter !== 'all'
                  ? items.some(
                      (row) =>
                        row.status !== 'in_progress' && row.status !== 'pending_grade',
                    )
                  : true
              }
              summary={summary}
            />
          ) : null}

          {visibleFilters.length > 2 ? (
            <View style={styles.filters}>
              {visibleFilters.map((item) => {
                const selected = filter === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setFilter(item.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}>
                    <AppText
                      style={{ color: selected ? '#FFFFFF' : theme.colors.text }}
                      variant="caption"
                      weight="semibold">
                      {item.id === 'all' ? item.label : `${item.label} ${counts[item.id]}`}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {items.length === 0 ? (
            <LearnEmptyState
              actionLabel="Show all"
              description="Nothing in this filter. The other papers are still here."
              icon={<ClipboardList color={theme.colors.textMuted} size={ms(28)} />}
              onAction={() => setFilter('all')}
              title="No papers here"
            />
          ) : (
            groups.map((group) => (
              <View key={group.title} style={styles.section}>
                <AppText color="muted" variant="caption" weight="semibold">
                  {group.title}
                </AppText>
                {group.items.map((row) => (
                  <AttemptCard
                    key={row.id}
                    onPress={() => openAttempt(navigation, row)}
                    row={row}
                  />
                ))}
              </View>
            ))
          )}
        </View>
      )}
    </SocialStackChrome>
  );
}

function SummaryHero({
  summary,
  hasScore,
}: {
  summary: HistorySummary;
  hasScore: boolean;
}) {
  const theme = useTheme();
  const finished = hasScore;
  const time =
    summary.totalTimeSec > 0 ? formatAssessmentDuration(summary.totalTimeSec) : '';
  const stats: Array<[string, string]> = [
    ['Attempts', String(summary.attempts)],
    ['Average', finished ? `${summary.avgPct}%` : '—'],
    ['Passed', String(summary.passed)],
  ];

  return (
    <View style={styles.heroBlock}>
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}>
        <View style={styles.best}>
          <AppText variant="title" weight="bold">
            {finished ? `${summary.bestPct}%` : '—'}
          </AppText>
          <AppText color="muted" variant="caption">
            Best score
          </AppText>
        </View>
        <View style={[styles.stats, { borderLeftColor: theme.colors.border }]}>
          {stats.map(([label, value], index) => (
            <View
              key={label}
              style={[
                styles.stat,
                index > 0
                  ? { borderTopColor: theme.colors.border, borderTopWidth: StyleSheet.hairlineWidth }
                  : null,
              ]}>
              <AppText color="muted" variant="caption">
                {label}
              </AppText>
              <AppText variant="label" weight="bold">
                {value}
              </AppText>
            </View>
          ))}
        </View>
      </View>
      {time ? (
        <AppText color="muted" variant="caption">
          {`${time} on these papers`}
        </AppText>
      ) : null}
    </View>
  );
}

function AttemptCard({
  row,
  onPress,
}: {
  row: HistoryItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const tone = outcomeTone(row);
  const ink = toneColor(theme, tone);
  const when = formatRelativeTime(row.submittedAt);
  const spent = row.timeSpentSec ? formatAssessmentDuration(row.timeSpentSec) : '';
  const meta = [
    `Attempt ${row.attemptNo}`,
    when,
    spent,
  ].filter(Boolean).join(' · ');
  const open = row.status === 'in_progress';
  const pending = row.status === 'pending_grade';
  const score = open || pending ? (open ? '—' : '…') : `${row.scorePct}%`;

  return (
    <Pressable
      accessibilityHint={open ? 'Resumes this paper' : 'Opens this score'}
      accessibilityLabel={`${row.title}, ${outcomeLabel(row)}`}
      accessibilityRole="button"
      disabled={!row.slug}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={[styles.ring, { borderColor: ink }]}>
        <AppText style={{ color: ink }} variant="label" weight="bold">
          {score}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText color="brand" variant="caption" weight="semibold">
          {asmtKindLabel(row.kind || '')}
        </AppText>
        <AppText numberOfLines={2} variant="label" weight="bold">
          {row.title}
        </AppText>
        <AppText color="muted" variant="caption">
          {meta}
        </AppText>
        <View style={[styles.pill, { backgroundColor: toneFill(theme, tone) }]}>
          <AppText style={{ color: ink }} variant="caption" weight="semibold">
            {outcomeLabel(row)}
          </AppText>
        </View>
      </View>
      <ChevronRight color={theme.colors.textMuted} size={ms(18)} />
    </Pressable>
  );
}

function HistorySkeleton() {
  const theme = useTheme();
  const bone = { backgroundColor: theme.colors.surface };
  return (
    <View accessibilityLabel="Loading attempts" style={styles.column}>
      <View style={[styles.hero, styles.skelHero, bone]} />
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={[styles.card, bone]}>
          <View style={[styles.skelRing, { backgroundColor: theme.colors.background }]} />
          <View style={styles.copy}>
            <View style={[styles.skelLine, styles.skelShort, { backgroundColor: theme.colors.background }]} />
            <View style={[styles.skelLine, { backgroundColor: theme.colors.background }]} />
            <View style={[styles.skelLine, styles.skelMid, { backgroundColor: theme.colors.background }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function openAttempt(
  navigation: Props['navigation'],
  row: HistoryItem,
) {
  if (!row.slug) return;
  if (row.status === 'in_progress') {
    navigation.navigate('AssessmentAttempt', { slug: row.slug, attemptId: row.id });
    return;
  }
  navigation.navigate('AssessmentResult', { slug: row.slug, attemptId: row.id });
}

function matchesFilter(row: HistoryItem, filter: FilterId) {
  if (filter === 'all') return true;
  if (filter === 'open') return row.status === 'in_progress';
  if (filter === 'marking') return row.status === 'pending_grade';
  if (filter === 'passed') return row.passed && row.status !== 'in_progress';
  return !row.passed && row.status !== 'in_progress' && row.status !== 'pending_grade';
}

function countBuckets(items: HistoryItem[]) {
  return {
    open: items.filter((row) => matchesFilter(row, 'open')).length,
    passed: items.filter((row) => matchesFilter(row, 'passed')).length,
    missed: items.filter((row) => matchesFilter(row, 'missed')).length,
    marking: items.filter((row) => matchesFilter(row, 'marking')).length,
  };
}

function summarize(items: HistoryItem[]): HistorySummary {
  const finished = items.filter(
    (row) => row.status !== 'in_progress' && row.status !== 'pending_grade',
  );
  const scores = finished.map((row) => row.scorePct);
  const total = scores.reduce((sum, score) => sum + score, 0);
  return {
    attempts: items.length,
    bestPct: scores.length ? Math.max(...scores) : 0,
    avgPct: scores.length ? Math.round(total / scores.length) : 0,
    passed: items.filter((row) => row.passed).length,
    totalTimeSec: items.reduce((sum, row) => sum + (row.timeSpentSec || 0), 0),
  };
}

function groupAttempts(items: HistoryItem[]) {
  const open = items.filter((row) => row.status === 'in_progress');
  const rest = items.filter((row) => row.status !== 'in_progress');
  const order: string[] = [];
  const buckets = new Map<string, HistoryItem[]>();
  for (const row of rest) {
    const title = dayBucket(row.submittedAt);
    const list = buckets.get(title);
    if (list) {
      list.push(row);
    } else {
      buckets.set(title, [row]);
      order.push(title);
    }
  }
  const groups: Array<{ title: string; items: HistoryItem[] }> = [];
  if (open.length) groups.push({ title: 'Still open', items: open });
  for (const title of order) {
    const list = buckets.get(title);
    if (list) groups.push({ title, items: list });
  }
  return groups;
}

function dayBucket(iso: string | null) {
  if (!iso) return 'Earlier';
  const then = new Date(iso);
  if (!Number.isFinite(then.getTime())) return 'Earlier';
  const now = new Date();
  const start = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((start(now) - start(then)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function outcomeLabel(row: HistoryItem) {
  if (row.status === 'in_progress') return 'Resume';
  if (row.status === 'pending_grade') return 'Marking';
  if (row.status === 'auto_submitted' && !row.passed) return 'Time up';
  return row.passed ? 'Passed' : 'Not passed';
}

function outcomeTone(row: HistoryItem): 'primary' | 'warning' | 'success' | 'danger' {
  if (row.status === 'in_progress') return 'primary';
  if (row.status === 'pending_grade') return 'warning';
  return row.passed ? 'success' : 'danger';
}

function toneColor(theme: AppTheme, tone: 'primary' | 'warning' | 'success' | 'danger') {
  if (tone === 'primary') return theme.colors.primary;
  return theme.colors[tone];
}

function toneFill(theme: AppTheme, tone: 'primary' | 'warning' | 'success' | 'danger') {
  if (tone === 'primary') return theme.colors.primaryMuted;
  const scale = theme.palette[tone];
  return theme.mode === 'dark' ? scale[900] : scale[100];
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: vs(18),
    paddingTop: vs(4),
  },
  heroBlock: {
    gap: vs(8),
  },
  hero: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(20),
    overflow: 'hidden',
  },
  best: {
    width: '42%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(2),
    paddingVertical: vs(18),
    paddingHorizontal: s(8),
  },
  stats: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    gap: s(8),
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  chip: {
    minHeight: ms(34),
    borderRadius: ms(999),
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: vs(10),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(18),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
  },
  ring: {
    width: ms(58),
    height: ms(58),
    borderRadius: ms(29),
    borderWidth: ms(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vs(3),
    alignItems: 'flex-start',
  },
  pill: {
    marginTop: vs(4),
    borderRadius: ms(999),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },
  skelHero: {
    height: vs(108),
  },
  skelRing: {
    width: ms(58),
    height: ms(58),
    borderRadius: ms(29),
  },
  skelLine: {
    height: vs(10),
    borderRadius: ms(6),
    width: '100%',
  },
  skelShort: {
    width: '28%',
  },
  skelMid: {
    width: '62%',
  },
});
