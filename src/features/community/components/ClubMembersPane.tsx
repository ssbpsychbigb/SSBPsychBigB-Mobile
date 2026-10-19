/**
 * Members list and join-request queue.
 */

import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  useCommunityMembersQuery,
  useCommunityRequestsQuery,
  useDecideJoinMutation,
  useKickMemberMutation,
  useMuteMemberMutation,
} from '@/features/community/hooks/useCommunityQueries';
import type { Community } from '@/features/community/types/community.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type ClubMembersPaneProps = {
  community: Community;
  mode: 'members' | 'requests';
};

/**
 * Primary / Co-Admin approve from Requests. Members can browse the roster.
 */
export function ClubMembersPane({ community, mode }: ClubMembersPaneProps) {
  const theme = useTheme();
  const membersQuery = useCommunityMembersQuery(
    community.slug,
    mode === 'members',
  );
  const requestsQuery = useCommunityRequestsQuery(
    community.slug,
    mode === 'requests' && Boolean(community.canManageMembers || community.canModerate),
  );
  const decide = useDecideJoinMutation(community.slug);
  const kick = useKickMemberMutation(community.slug);
  const mute = useMuteMemberMutation(community.slug);

  const members = useMemo(
    () => membersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [membersQuery.data],
  );
  const requests = useMemo(
    () => requestsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [requestsQuery.data],
  );

  if (mode === 'requests') {
    if (!community.canManageMembers && !community.canModerate) {
      return (
        <AppText color="muted" variant="caption">
          Only Primary and Co-Admin with member rights see join requests.
        </AppText>
      );
    }
    if (requestsQuery.isLoading && !requestsQuery.data) {
      return <Spinner />;
    }
    if (requests.length === 0) {
      return (
        <AppText color="muted" variant="caption">
          No pending requests.
        </AppText>
      );
    }
    return (
      <View style={styles.stack}>
        {requests.map((row) => (
          <View
            key={row.userId}
            style={[
              styles.card,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}>
            <AppText variant="label" weight="semibold">
              {row.user.fullName}
            </AppText>
            <AppText color="muted" variant="caption">
              @{row.user.username}
            </AppText>
            <View style={styles.row}>
              <Pressable
                onPress={() => {
                  decide.mutate(
                    { userId: row.userId, decision: 'approve' },
                    {
                      onSuccess: () => showToast.success('Approved'),
                      onError: (error) =>
                        showErrorToast(error, 'Could not approve.', 'Community'),
                    },
                  );
                }}
                style={[styles.cta, { backgroundColor: theme.colors.primary }]}>
                <AppText color="inverse" variant="caption" weight="semibold">
                  Approve
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  decide.mutate(
                    { userId: row.userId, decision: 'reject' },
                    {
                      onSuccess: () => showToast.success('Rejected'),
                      onError: (error) =>
                        showErrorToast(error, 'Could not reject.', 'Community'),
                    },
                  );
                }}
                style={[
                  styles.cta,
                  {
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <AppText color="danger" variant="caption" weight="semibold">
                  Reject
                </AppText>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (membersQuery.isLoading && !membersQuery.data) {
    return <Spinner />;
  }

  return (
    <View style={styles.stack}>
      {members.map((row) => (
        <View
          key={row.userId}
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="semibold">
            {row.user.fullName}
          </AppText>
          <AppText color="muted" variant="caption">
            @{row.user.username} · {row.role.replace('_', ' ')}
            {row.isMuted ? ' · muted' : ''}
          </AppText>
          {community.canManageMembers && row.role !== 'primary_admin' ? (
            <View style={styles.row}>
              <Pressable
                onPress={() => {
                  const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                  mute.mutate({
                    userId: row.userId,
                    mutedUntil: row.isMuted ? null : until,
                  });
                }}>
                <AppText color="brand" variant="caption" weight="semibold">
                  {row.isMuted ? 'Unmute' : 'Mute 24h'}
                </AppText>
              </Pressable>
              <Pressable onPress={() => kick.mutate(row.userId)}>
                <AppText color="danger" variant="caption" weight="semibold">
                  Remove
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: vs(10),
  },
  card: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(14),
    gap: vs(4),
  },
  row: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: vs(8),
  },
  cta: {
    height: ms(34),
    paddingHorizontal: s(16),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
