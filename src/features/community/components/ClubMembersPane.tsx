/**
 * Members list, join-request queue, and Co-Admin seat (mirrors web).
 */

import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Shield } from 'lucide-react-native';

import { ClubCoAdminSheet } from '@/features/community/components/ClubCoAdminSheet';
import {
  useCommunityMembersQuery,
  useCommunityRequestsQuery,
  useDecideJoinMutation,
  useKickMemberMutation,
  useMuteMemberMutation,
  useRemoveCoAdminMutation,
  useSetCoAdminMutation,
} from '@/features/community/hooks/useCommunityQueries';
import {
  clubSeatLabel,
  isCoAdminSeat,
  isPrimarySeat,
  type CoAdminRights,
} from '@/features/community/lib/community-rights';
import type { Community, CommunityMember } from '@/features/community/types/community.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type ClubMembersPaneProps = {
  community: Community;
  mode: 'members' | 'requests';
};

/**
 * Primary / Co-Admin approve from Requests. Primary appoints Co-Admin here.
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
  const setCoAdmin = useSetCoAdminMutation(community.slug);
  const removeCoAdmin = useRemoveCoAdminMutation(community.slug);

  const [seatMember, setSeatMember] = useState<CommunityMember | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [kickTarget, setKickTarget] = useState<CommunityMember | null>(null);

  const members = useMemo(
    () => membersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [membersQuery.data],
  );
  const requests = useMemo(
    () => requestsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [requestsQuery.data],
  );

  const canAppoint = Boolean(community.canAppointAdmins);
  const canManageMembers = Boolean(community.canManageMembers);

  const onSaveRights = async (rights: CoAdminRights) => {
    if (!seatMember) {
      return;
    }
    try {
      await setCoAdmin.mutateAsync({ userId: seatMember.userId, rights });
      showToast.success(
        isCoAdminSeat(seatMember.role) ? 'Rights updated' : 'Co-Admin appointed',
      );
      setSeatMember(null);
    } catch (error) {
      showErrorToast(error, 'Could not update Co-Admin.', 'Community');
    }
  };

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
            <MemberIdentity member={row} />
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
      {canAppoint && !community.coAdminId ? (
        <View
          style={[
            styles.banner,
            { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.border },
          ]}>
          <AppText variant="caption" weight="semibold">
            Appoint a Co-Admin so archive and delete can use dual-key.
          </AppText>
        </View>
      ) : null}

      {members.map((row) => {
        const primary = isPrimarySeat(row.role);
        const coAdmin = isCoAdminSeat(row.role);
        const canActOn = canManageMembers && !primary && !coAdmin;
        return (
          <View
            key={row.userId}
            style={[
              styles.card,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}>
            <View style={styles.identityRow}>
              <MemberIdentity member={row} />
              <View
                style={[
                  styles.seat,
                  {
                    backgroundColor: primary
                      ? theme.colors.primaryMuted
                      : coAdmin
                        ? theme.palette.primary[50]
                        : theme.colors.surface,
                  },
                ]}>
                <AppText color={primary || coAdmin ? 'brand' : 'muted'} variant="caption" weight="semibold">
                  {clubSeatLabel(row.role)}
                </AppText>
              </View>
            </View>
            {row.isMuted ? (
              <AppText color="muted" variant="caption">
                Muted
              </AppText>
            ) : null}

            <View style={styles.actions}>
              {canAppoint && !primary && !coAdmin ? (
                <Pressable
                  onPress={() => setSeatMember(row)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: theme.colors.primaryMuted,
                      borderColor: theme.colors.primary,
                    },
                  ]}>
                  <Shield color={theme.colors.primary} size={ms(12)} />
                  <AppText color="brand" variant="caption" weight="semibold">
                    Make Co-Admin
                  </AppText>
                </Pressable>
              ) : null}
              {canAppoint && coAdmin ? (
                <>
                  <Pressable
                    onPress={() => setSeatMember(row)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}>
                    <AppText color="secondary" variant="caption" weight="semibold">
                      Edit rights
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => setConfirmRemove(true)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}>
                    <AppText color="secondary" variant="caption" weight="semibold">
                      Remove seat
                    </AppText>
                  </Pressable>
                </>
              ) : null}
              {canActOn ? (
                <>
                  <Pressable
                    onPress={() => {
                      const until = new Date(
                        Date.now() + 7 * 24 * 60 * 60 * 1000,
                      ).toISOString();
                      mute.mutate(
                        {
                          userId: row.userId,
                          mutedUntil: row.isMuted ? null : until,
                        },
                        {
                          onSuccess: () =>
                            showToast.success(row.isMuted ? 'Unmuted' : 'Muted for 7 days'),
                          onError: (error) =>
                            showErrorToast(error, 'Could not update mute.', 'Community'),
                        },
                      );
                    }}>
                    <AppText color="brand" variant="caption" weight="semibold">
                      {row.isMuted ? 'Unmute' : 'Mute 7d'}
                    </AppText>
                  </Pressable>
                  <Pressable onPress={() => setKickTarget(row)}>
                    <AppText color="danger" variant="caption" weight="semibold">
                      Remove
                    </AppText>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        );
      })}

      {membersQuery.hasNextPage ? (
        <Pressable onPress={() => void membersQuery.fetchNextPage()}>
          <AppText color="brand" variant="caption" weight="semibold">
            {membersQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </AppText>
        </Pressable>
      ) : null}

      <ClubCoAdminSheet
        isSaving={setCoAdmin.isPending}
        member={seatMember}
        onClose={() => setSeatMember(null)}
        onSave={(rights) => void onSaveRights(rights)}
      />
      <ConfirmModal
        confirmLabel="Remove Co-Admin"
        isLoading={removeCoAdmin.isPending}
        message="Archive and delete stay blocked until you appoint someone else. They remain a regular member."
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          void removeCoAdmin
            .mutateAsync()
            .then(() => {
              showToast.success('Co-Admin seat emptied');
              setConfirmRemove(false);
            })
            .catch((error) =>
              showErrorToast(error, 'Could not remove Co-Admin.', 'Community'),
            );
        }}
        title="Empty Co-Admin seat?"
        visible={confirmRemove}
      />
      <ConfirmModal
        confirmLabel="Remove member"
        isLoading={kick.isPending}
        message="They lose club access. They can request to join again later."
        onCancel={() => setKickTarget(null)}
        onConfirm={() => {
          if (!kickTarget) {
            return;
          }
          void kick
            .mutateAsync(kickTarget.userId)
            .then(() => {
              showToast.success('Member removed');
              setKickTarget(null);
            })
            .catch((error) =>
              showErrorToast(error, 'Could not remove member.', 'Community'),
            );
        }}
        title={`Remove ${kickTarget?.user.fullName || 'this member'}?`}
        tone="danger"
        visible={Boolean(kickTarget)}
      />
    </View>
  );
}

function MemberIdentity({ member }: { member: CommunityMember }) {
  const theme = useTheme();
  const uri = resolveUploadUrl(member.user.profilePhotoPath);
  return (
    <View style={styles.who}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primaryMuted }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.avatarImage} />
        ) : (
          <AppText color="brand" variant="caption" weight="bold">
            {getUserInitials(member.user.fullName || member.user.username)}
          </AppText>
        )}
      </View>
      <View style={styles.titles}>
        <AppText numberOfLines={1} variant="label" weight="semibold">
          {member.user.fullName}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          @{member.user.username}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: vs(10),
  },
  banner: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(12),
  },
  card: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(14),
    gap: vs(8),
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  who: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    minWidth: 0,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  seat: {
    borderRadius: ms(999),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
  },
  row: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: vs(4),
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    height: ms(32),
    paddingHorizontal: s(10),
    borderRadius: ms(16),
    borderWidth: 1,
  },
  cta: {
    height: ms(34),
    paddingHorizontal: s(16),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
