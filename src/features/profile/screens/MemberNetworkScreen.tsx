/**
 * Public follow graph — `/profile/:username/network?kind=`.
 */

import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { feedApi } from '@/features/feed/api/feed.api';
import { NetworkPersonCard } from '@/features/network/components/NetworkPersonCard';
import {
  networkKeys,
  useProfileNetworkQuery,
} from '@/features/network/hooks/useNetworkQueries';
import { toNetworkPersonCard } from '@/features/network/lib/to-network-person-card';
import type { NetworkGraphKind } from '@/features/network/types/network.types';
import { requireMemberProfileParams } from '@/features/profile/lib/require-member-profile';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'MemberNetwork'>;

const TABS: { key: NetworkGraphKind; label: string }[] = [
  { key: 'followers', label: 'Followers' },
  { key: 'following', label: 'Following' },
  { key: 'mutual', label: 'Mutual' },
];

/**
 * Same person cards as Network, scoped to one member’s graph.
 */
export function MemberNetworkScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);
  const { username, name, kind: kindParam } = route.params;
  const [kind, setKind] = useState<NetworkGraphKind>(
    kindParam === 'following' || kindParam === 'mutual' ? kindParam : 'followers',
  );
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    setKind(
      kindParam === 'following' || kindParam === 'mutual' ? kindParam : 'followers',
    );
  }, [kindParam]);

  const graphQuery = useProfileNetworkQuery(username, kind, token);

  const people = useMemo(
    () =>
      (graphQuery.data?.pages.flatMap((page) => page.items) ?? []).map(
        toNetworkPersonCard,
      ),
    [graphQuery.data],
  );

  const followMutation = useMutation({
    mutationFn: (userId: string) => feedApi.toggleFollow(userId, token as string),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: networkKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['member-profile', username] });
      showToast.success(result.following ? 'Following' : 'Unfollowed');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not update follow.', 'Network');
    },
  });

  const title = name || username;

  return (
    <>
      <SocialStackChrome
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void graphQuery.refetch();
            }}
            refreshing={graphQuery.isRefetching}
            tintColor={theme.colors.primary}
          />
        }
        subtitle={`@${username}`}
        title={title}>
        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const selected = kind === tab.key;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setKind(tab.key)}
                style={styles.tab}>
                <AppText
                  color={selected ? 'brand' : 'muted'}
                  variant="caption"
                  weight="semibold">
                  {tab.label}
                </AppText>
                <View
                  style={[
                    styles.tabLine,
                    {
                      backgroundColor: selected ? theme.colors.primary : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {graphQuery.isPending ? <Spinner /> : null}

        {graphQuery.isError ? (
          <View style={styles.empty}>
            <AppText variant="label" weight="semibold">
              Could not load this list
            </AppText>
            <Pressable onPress={() => void graphQuery.refetch()}>
              <AppText color="brand" variant="caption" weight="semibold">
                Retry
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {!graphQuery.isPending && !graphQuery.isError && people.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}>
            <Users color={theme.colors.primary} size={ms(22)} />
            <AppText variant="label" weight="semibold">
              {kind === 'followers'
                ? 'No followers yet'
                : kind === 'following'
                  ? 'Not following anyone'
                  : 'No mutual follows yet'}
            </AppText>
            <AppText color="secondary" style={styles.emptyCopy} variant="caption">
              {kind === 'following'
                ? 'Accounts this member follows will appear here.'
                : kind === 'mutual'
                  ? 'Mutual people follow each other.'
                  : 'When people follow this member, they show up here.'}
            </AppText>
          </View>
        ) : null}

        {people.map((person) => (
          <View key={person.id} style={styles.cardWrap}>
            <NetworkPersonCard
              following={Boolean(person.followingAuthor)}
              onFollow={() => {
                if (!token) {
                  setJoinOpen(true);
                  return;
                }
                followMutation.mutate(person.id);
              }}
              onPressProfile={() => {
                const params = requireMemberProfileParams(person.username, person.name);
                if (params) {
                  navigation.push('MemberProfile', params);
                }
              }}
              person={person}
            />
          </View>
        ))}

        {graphQuery.hasNextPage ? (
          <Pressable
            onPress={() => void graphQuery.fetchNextPage()}
            style={styles.more}>
            <AppText color="brand" variant="caption" weight="semibold">
              {graphQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
            </AppText>
          </Pressable>
        ) : null}
      </SocialStackChrome>

      <JoinToContinueSheet
        message="Follow officers and mentors once you are signed in."
        onClose={() => setJoinOpen(false)}
        title="Build your prep circle"
        visible={joinOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginBottom: vs(12),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: vs(4),
  },
  tabLine: {
    marginTop: vs(8),
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  cardWrap: {
    marginBottom: vs(12),
  },
  empty: {
    alignItems: 'center',
    paddingVertical: vs(28),
    gap: vs(8),
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: ms(18),
    paddingHorizontal: s(16),
    paddingVertical: vs(22),
    alignItems: 'center',
    gap: vs(6),
    marginBottom: vs(12),
  },
  emptyCopy: {
    textAlign: 'center',
  },
  more: {
    alignItems: 'center',
    paddingVertical: vs(12),
  },
});
