/**
 * Network — follow graph hub (live suggestions, join to follow).
 */

import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { feedApi } from '@/features/feed/api/feed.api';
import { NetworkPersonCard } from '@/features/network/components/NetworkPersonCard';
import {
  NETWORK_FILTERS,
  type NetworkFilterKey,
  type NetworkPersonPreview,
} from '@/features/network/data/network-preview';
import {
  networkKeys,
  useNetworkOverviewQuery,
  useNetworkSuggestionsQuery,
} from '@/features/network/hooks/useNetworkQueries';
import { toNetworkPersonCard } from '@/features/network/lib/to-network-person-card';
import { requireMemberProfileParams } from '@/features/profile';
import type { NetworkSuggestionsPage } from '@/features/network/types/network.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

/**
 * Officers, educators, and institutes to follow — live `/profile/me/suggestions`.
 */
export function NetworkScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isAuthed = Boolean(accessToken);
  const session = accessToken || 'guest';
  const openRegister = useOpenAuth('Register');
  const goRoot = useRootNavigate();
  const [joinOpen, setJoinOpen] = useState(false);
  const [filter, setFilter] = useState<NetworkFilterKey>('all');

  const suggestionsQuery = useNetworkSuggestionsQuery(accessToken);
  const overviewQuery = useNetworkOverviewQuery(accessToken);

  const people = useMemo(() => {
    const items =
      suggestionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return items
      .filter((item) => !item.isSelf)
      .map(toNetworkPersonCard);
  }, [suggestionsQuery.data]);

  const list = useMemo(() => {
    if (filter === 'all') {
      return people;
    }
    return people.filter((person) => person.kind === filter);
  }, [filter, people]);

  const featured = list[0];
  const rest = featured ? list.slice(1) : [];

  const followMutation = useMutation({
    mutationFn: (userId: string) => feedApi.toggleFollow(userId, accessToken as string),
    onSuccess: (result, userId) => {
      queryClient.setQueryData(
        networkKeys.suggestions(session),
        (current: { pages: NetworkSuggestionsPage[]; pageParams: unknown[] } | undefined) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === userId
                  ? { ...item, followingAuthor: result.following }
                  : item,
              ),
            })),
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: networkKeys.overview(session) });
      showToast.success(result.following ? 'Following' : 'Unfollowed');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not update follow.', 'Network');
    },
  });

  const openProfile = (person: NetworkPersonPreview) => {
    const params = requireMemberProfileParams(person.username, person.name);
    if (params) {
      goRoot('MemberProfile', params);
    }
  };

  const onFollow = (person: NetworkPersonPreview) => {
    if (!accessToken) {
      setJoinOpen(true);
      return;
    }
    followMutation.mutate(person.id);
  };

  const overview = overviewQuery.data;
  const peopleCount = overview?.followers ?? people.length;
  const followingCount = overview?.following ?? people.filter((row) => row.followingAuthor).length;
  const mutualCount = overview?.mutual ?? 0;

  const openOwnGraph = (kind: 'followers' | 'following' | 'mutual') => {
    if (!accessToken) {
      setJoinOpen(true);
      return;
    }
    const handle = user?.username?.trim();
    if (!handle) {
      showToast.error(
        'Profile unavailable',
        'This member has no public username yet.',
      );
      return;
    }
    goRoot('MemberNetwork', {
      username: handle,
      name: user?.fullName,
      kind,
    });
  };

  return (
    <>
      <SocialStackChrome
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void suggestionsQuery.refetch();
              if (isAuthed) {
                void overviewQuery.refetch();
              }
            }}
            refreshing={suggestionsQuery.isRefetching}
            tintColor={theme.colors.primary}
          />
        }
        subtitle="Officers, mentors, and academies that raise the quality of your prep."
        subtitleLines={2}
        title="Network">
        <View style={styles.stats}>
          <Stat
            label="Followers"
            onPress={() => openOwnGraph('followers')}
            value={String(peopleCount)}
          />
          <View style={[styles.statRule, { backgroundColor: theme.colors.border }]} />
          <Stat
            label="Following"
            onPress={() => openOwnGraph('following')}
            value={String(followingCount)}
          />
          <View style={[styles.statRule, { backgroundColor: theme.colors.border }]} />
          <Stat
            label="Mutual"
            onPress={() => openOwnGraph('mutual')}
            value={String(mutualCount)}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.filters}
          directionalLockEnabled
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}>
          {NETWORK_FILTERS.map((item) => {
            const selected = filter === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.background,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}>
                <AppText
                  color={selected ? 'inverse' : 'secondary'}
                  style={styles.chipLabel}
                  variant="caption"
                  weight="semibold">
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {suggestionsQuery.isPending ? <Spinner /> : null}

        {suggestionsQuery.isError ? (
          <EmptyCard
            copy="Pull to refresh, or retry once your API is reachable."
            cta="Retry"
            onCta={() => void suggestionsQuery.refetch()}
            title="Could not load people"
          />
        ) : null}

        {!suggestionsQuery.isPending && !suggestionsQuery.isError && people.length === 0 ? (
          <EmptyCard
            copy={
              isAuthed
                ? 'No new people to suggest right now. Follow officers and mentors from the feed.'
                : 'Join BIGB to follow aspirants, educators, and institutes.'
            }
            cta={isAuthed ? undefined : 'Create a free account'}
            icon
            onCta={isAuthed ? undefined : openRegister}
            title={isAuthed ? 'Your circle is quiet' : 'Sign in to grow your network'}
          />
        ) : null}

        {featured && !suggestionsQuery.isPending ? (
          <>
            <AppText color="muted" style={styles.section} variant="caption" weight="semibold">
              Suggested for you
            </AppText>
            <NetworkPersonCard
              featured
              following={Boolean(featured.followingAuthor)}
              onFollow={() => onFollow(featured)}
              onPressProfile={() => openProfile(featured)}
              person={featured}
            />
          </>
        ) : null}

        {!suggestionsQuery.isPending && filter !== 'all' && list.length === 0 && people.length > 0 ? (
          <EmptyCard
            copy="Switch to All to see everyone we can suggest."
            title="Nothing in this filter"
          />
        ) : (
          rest.map((person) => (
            <NetworkPersonCard
              key={person.id}
              following={Boolean(person.followingAuthor)}
              onFollow={() => onFollow(person)}
              onPressProfile={() => openProfile(person)}
              person={person}
            />
          ))
        )}

        {suggestionsQuery.hasNextPage ? (
          <Pressable
            onPress={() => void suggestionsQuery.fetchNextPage()}
            style={styles.more}>
            <AppText color="brand" variant="caption" weight="semibold">
              {suggestionsQuery.isFetchingNextPage ? 'Loading…' : 'See more people'}
            </AppText>
          </Pressable>
        ) : null}
      </SocialStackChrome>
      <JoinToContinueSheet
        message="Follow officers and mentors after you join BIGB."
        onClose={() => setJoinOpen(false)}
        title="Build your prep circle"
        visible={joinOpen}
      />
    </>
  );
}

function EmptyCard({
  title,
  copy,
  icon,
  cta,
  onCta,
}: {
  title: string;
  copy: string;
  icon?: boolean;
  cta?: string;
  onCta?: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.empty,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}>
      {icon ? <Users color={theme.colors.primary} size={ms(22)} /> : null}
      <AppText variant="label" weight="semibold">
        {title}
      </AppText>
      <AppText color="secondary" style={styles.emptyCopy} variant="caption">
        {copy}
      </AppText>
      {cta && onCta ? (
        <Pressable onPress={onCta} style={styles.emptyCta}>
          <AppText color="brand" variant="caption" weight="semibold">
            {cta}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={styles.stat}>
      <AppText style={styles.statValue} weight="bold">
        {value}
      </AppText>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(14),
    paddingVertical: vs(4),
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: vs(2),
  },
  statValue: {
    fontSize: ms(18),
  },
  statRule: {
    width: StyleSheet.hairlineWidth,
    height: vs(28),
  },
  filters: {
    flexDirection: 'row',
    gap: s(8),
    paddingRight: s(8),
    marginBottom: vs(16),
  },
  chip: {
    height: ms(34),
    paddingHorizontal: s(14),
    borderRadius: ms(17),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    includeFontPadding: false,
  },
  section: {
    marginBottom: vs(8),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  empty: {
    borderWidth: 1,
    borderRadius: ms(18),
    paddingHorizontal: s(16),
    paddingVertical: vs(22),
    alignItems: 'center',
    gap: vs(6),
  },
  emptyCopy: {
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: vs(4),
  },
  more: {
    alignItems: 'center',
    paddingVertical: vs(12),
  },
});
