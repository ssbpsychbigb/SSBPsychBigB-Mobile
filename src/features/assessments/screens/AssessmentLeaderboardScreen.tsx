/**
 * Rankings for one test. Scopes follow what the server allows.
 * A hidden ranking does not show this account’s place.
 */

import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Trophy } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';
import {
  useAssessmentLeaderboardQuery,
  useRankingPrivacyMutation,
} from '@/features/assessments/hooks/useAssessmentQueries';
import { formatSpent } from '@/features/assessments/lib/assessment-format';
import type { LeaderboardResult } from '@/features/assessments/types/assessment.types';
import { GuestUnlockPanel } from '@/features/auth/components/GuestUnlockPanel';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentLeaderboard'>;

const SCOPES: Array<{ id: string; label: string; key: keyof LeaderboardResult['scopes'] }> = [
  { id: 'national', label: 'National', key: 'national' },
  { id: 'course', label: 'Course', key: 'course' },
  { id: 'institute', label: 'Institute', key: 'institute' },
  { id: 'community', label: 'Community', key: 'community' },
];

/**
 * `/assessments/:slug/leaderboard`
 */
export function AssessmentLeaderboardScreen({ route }: Props) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const slug = route.params.slug;
  const [scope, setScope] = useState('national');
  const board = useAssessmentLeaderboardQuery(slug, scope);
  const privacy = useRankingPrivacyMutation(slug);
  const data = board.data;
  const visibleScopes = SCOPES.filter((item) => (data?.scopes ? data.scopes[item.key] : item.id === 'national'));

  return (
    <SocialStackChrome
      refreshControl={
        <RefreshControl
          onRefresh={() => void board.refetch()}
          refreshing={Boolean(board.isRefetching && board.data)}
          tintColor={theme.colors.primary}
        />
      }
      subtitle={data?.title || 'Best score on this test.'}
      subtitleLines={2}
      title="Leaderboard">
      {!token ? (
        <GuestUnlockPanel
          description="Sign in to see ranks. Practice quizzes do not have a board."
          embedded
          icon={<Trophy color={theme.colors.primary} size={ms(32)} />}
          title="Sign in for rankings"
        />
      ) : board.isLoading && !data ? (
        <BoardSkeleton />
      ) : board.isError ? (
        <LearnEmptyState
          actionLabel="Retry"
          description="Rankings are off for practice quizzes, or this test has the board turned off."
          icon={<Trophy color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => void board.refetch()}
          title="No leaderboard"
        />
      ) : (
        <View style={styles.column}>
          <View style={styles.filters}>
            {visibleScopes.map((item) => {
              const selected = scope === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setScope(item.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                    },
                  ]}>
                  <AppText
                    style={{ color: selected ? '#FFFFFF' : theme.colors.text }}
                    variant="caption"
                    weight="semibold">
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {data?.hideRanking ? (
            <AppText color="secondary" variant="body">
              Your place is hidden on this account.
            </AppText>
          ) : data?.me ? (
            <View
              style={[
                styles.me,
                { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.border },
              ]}>
              <AppText color="muted" variant="caption">
                Your place
              </AppText>
              <AppText variant="title" weight="bold">
                {`#${data.me.rank}`}
              </AppText>
              <AppText color="secondary" variant="caption">
                {`${data.me.scorePct}%`}
                {data.me.percentile != null ? ` · ${data.me.percentile} percentile` : ''}
              </AppText>
            </View>
          ) : (
            <AppText color="secondary" variant="body">
              Sit this test to appear on the board.
            </AppText>
          )}

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: Boolean(data?.hideRanking) }}
            disabled={privacy.isPending}
            onPress={() => {
              privacy.mutate(!data?.hideRanking, {
                onSuccess: (row) => {
                  showToast.success(row.hideRanking ? 'Ranking hidden' : 'Ranking visible');
                },
                onError: (error) => showErrorToast(error),
              });
            }}
            style={[
              styles.toggle,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}>
            <View style={styles.copy}>
              <AppText variant="label" weight="semibold">
                Hide my name
              </AppText>
              <AppText color="muted" variant="caption">
                Other learners see “Hidden” instead of your name.
              </AppText>
            </View>
            <View
              style={[
                styles.knobTrack,
                {
                  backgroundColor: data?.hideRanking
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}>
              <View
                style={[
                  styles.knob,
                  data?.hideRanking ? styles.knobOn : null,
                  { backgroundColor: theme.colors.background },
                ]}
              />
            </View>
          </Pressable>

          {data?.note ? (
            <AppText color="muted" variant="caption">
              {data.note}
            </AppText>
          ) : null}

          {(data?.items.length || 0) === 0 ? (
            <LearnEmptyState
              description="No ranked attempts in this scope yet."
              icon={<Trophy color={theme.colors.textMuted} size={ms(28)} />}
              title="Board is empty"
            />
          ) : (
            <View
              style={[
                styles.list,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}>
              {data?.items.map((row, index) => (
                <View
                  key={`${row.rank}-${row.name}-${index}`}
                  style={[
                    styles.rankRow,
                    index > 0
                      ? {
                          borderTopColor: theme.colors.border,
                          borderTopWidth: StyleSheet.hairlineWidth,
                        }
                      : null,
                    row.isSelf && !data.hideRanking
                      ? { backgroundColor: theme.colors.primaryMuted }
                      : null,
                  ]}>
                  <AppText style={styles.rank} variant="label" weight="bold">
                    {String(row.rank)}
                  </AppText>
                  <View style={styles.copy}>
                    <AppText numberOfLines={1} variant="label" weight="semibold">
                      {row.isSelf && !data.hideRanking ? `${row.name} · you` : row.name}
                    </AppText>
                    {row.timeSpentSec ? (
                      <AppText color="muted" variant="caption">
                        {formatSpent(row.timeSpentSec)}
                      </AppText>
                    ) : null}
                  </View>
                  <AppText variant="label" weight="bold">
                    {`${row.scorePct}%`}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </SocialStackChrome>
  );
}

function BoardSkeleton() {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading rankings" style={styles.column}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View
          key={index}
          style={[styles.skel, { backgroundColor: theme.colors.surface }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: vs(14),
    paddingTop: vs(4),
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
  me: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(18),
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    gap: vs(2),
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(16),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vs(2),
  },
  knobTrack: {
    width: ms(44),
    height: ms(26),
    borderRadius: ms(13),
    justifyContent: 'center',
    paddingHorizontal: ms(3),
  },
  knob: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(18),
    overflow: 'hidden',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
  },
  rank: {
    width: ms(28),
  },
  skel: {
    height: vs(52),
    borderRadius: ms(14),
  },
});
