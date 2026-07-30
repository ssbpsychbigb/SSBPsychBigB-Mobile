/**
 * Institute home — share code, hire freelancers from list, Accept/Reject joins.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  LogOut,
  Search,
  Share2,
  UserRound,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react-native';

import {
  instituteTeamApi,
  isPendingEducatorJoin,
  isPendingResignRequest,
  listApprovedLeaveItems,
  listPendingLeaveItems,
  type FreelancerDirectoryItem,
  type InstituteTeamMember,
  type PendingLeaveItem,
} from '@/features/institute/api/institute-team.api';
import {
  getActiveInstituteProfile,
  useAuthStore,
  useSwitchEducatorProfile,
} from '@/features/auth';
import { formatDisplayDate } from '@/shared/ui/AppDateField';
import { ApiError } from '@/shared/api/types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs, fontSize, lineHeight } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ConfirmModal, Screen } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

const teamKeys = {
  code: (token: string | null) => ['institute', 'code', token] as const,
  list: (token: string | null) => ['institute', 'team', token] as const,
  freelancers: (token: string | null, q: string) =>
    ['institute', 'freelancers', token, q] as const,
};

type ConfirmAction =
  | {
      kind: 'accept';
      id: string;
      name: string;
    }
  | {
      kind: 'reject';
      id: string;
      name: string;
    }
  | {
      kind: 'hire';
      id: string;
      name: string;
    }
  | {
      kind: 'leave_accept';
      id: string;
      leaveRequestId?: string;
      name: string;
      detail?: string;
    }
  | {
      kind: 'leave_reject';
      id: string;
      leaveRequestId?: string;
      name: string;
      detail?: string;
    }
  | {
      kind: 'resign_accept';
      id: string;
      name: string;
      detail?: string;
    }
  | {
      kind: 'resign_reject';
      id: string;
      name: string;
      detail?: string;
    };

/**
 * Institute home — share code, hire, join Accept/Reject, leave/resign decide.
 */
export function InstituteHomeScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const {
    canSwitchToFreelancer,
    isSwitching,
    switchToFreelancer,
  } = useSwitchEducatorProfile();
  const activeInstitute = getActiveInstituteProfile(user);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [educatorSearch, setEducatorSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  const codeQuery = useQuery({
    queryKey: teamKeys.code(accessToken),
    enabled: Boolean(accessToken),
    queryFn: () => instituteTeamApi.getCode(accessToken as string),
  });

  const teamQuery = useQuery({
    queryKey: teamKeys.list(accessToken),
    enabled: Boolean(accessToken),
    queryFn: () => instituteTeamApi.list(accessToken as string),
  });

  const freelancersQuery = useQuery({
    queryKey: teamKeys.freelancers(accessToken, educatorSearch.trim()),
    enabled: Boolean(accessToken),
    queryFn: () =>
      instituteTeamApi.searchFreelancers(
        accessToken as string,
        educatorSearch,
      ),
  });

  const pending = (teamQuery.data || []).filter(isPendingEducatorJoin);
  const leaveRequests = listPendingLeaveItems(teamQuery.data || []);
  const resignRequests = (teamQuery.data || []).filter(isPendingResignRequest);
  const onLeaveMembers = listApprovedLeaveItems(teamQuery.data || []);
  const freelancers = freelancersQuery.data || [];

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: teamKeys.code(accessToken) }),
      queryClient.invalidateQueries({ queryKey: teamKeys.list(accessToken) }),
      queryClient.invalidateQueries({
        queryKey: ['institute', 'freelancers'],
      }),
    ]);
  }, [accessToken, queryClient]);

  const acceptMutation = useMutation({
    mutationFn: (profileId: string) =>
      instituteTeamApi.acceptJoinRequest(accessToken as string, profileId),
    onMutate: (profileId) => {
      setBusyId(profileId);
      setActionError(null);
    },
    onSuccess: async () => {
      setConfirmAction(null);
      await refresh();
      showToast.success('Request accepted', 'Educator can now collaborate.');
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not accept join request.';
      setActionError(message);
      showErrorToast(error, message, 'Accept failed');
    },
    onSettled: () => setBusyId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: (profileId: string) =>
      instituteTeamApi.rejectJoinRequest(accessToken as string, profileId),
    onMutate: (profileId) => {
      setBusyId(profileId);
      setActionError(null);
    },
    onSuccess: async () => {
      setConfirmAction(null);
      await refresh();
      showToast.info('Request rejected', 'The join request was declined.');
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not reject join request.';
      setActionError(message);
      showErrorToast(error, message, 'Reject failed');
    },
    onSettled: () => setBusyId(null),
  });

  const hireMutation = useMutation({
    mutationFn: (userId: string) =>
      instituteTeamApi.hireFreelancer(accessToken as string, { userId }),
    onMutate: (userId) => {
      setBusyId(userId);
      setActionError(null);
    },
    onSuccess: async () => {
      setConfirmAction(null);
      await refresh();
      showToast.success(
        'Hire invite sent',
        'They can accept from Collaborations.',
      );
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not send hire invite.';
      setActionError(message);
      showErrorToast(error, message, 'Hire failed');
    },
    onSettled: () => setBusyId(null),
  });

  const decideLeaveMutation = useMutation({
    mutationFn: (input: {
      profileId: string;
      decision: 'accept' | 'reject';
      leaveRequestId?: string;
    }) =>
      instituteTeamApi.decideLeave(accessToken as string, input.profileId, {
        decision: input.decision,
        leaveRequestId: input.leaveRequestId,
      }),
    onMutate: (input) => {
      setBusyId(input.leaveRequestId || input.profileId);
      setActionError(null);
    },
    onSuccess: async (_data, input) => {
      setConfirmAction(null);
      await refresh();
      if (input.decision === 'accept') {
        showToast.success('Leave approved', 'Educator is now on leave.');
      } else {
        showToast.info('Leave rejected', 'Educator stays active on the team.');
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not decide leave request.';
      setActionError(message);
      showErrorToast(error, message, 'Leave decision failed');
    },
    onSettled: () => setBusyId(null),
  });

  const decideResignMutation = useMutation({
    mutationFn: (input: {
      profileId: string;
      decision: 'accept' | 'reject';
    }) =>
      instituteTeamApi.decideResign(accessToken as string, input.profileId, {
        decision: input.decision,
      }),
    onMutate: (input) => {
      setBusyId(input.profileId);
      setActionError(null);
    },
    onSuccess: async (_data, input) => {
      setConfirmAction(null);
      await refresh();
      if (input.decision === 'accept') {
        showToast.success(
          'Resign accepted',
          '14-day notice period started.',
        );
      } else {
        showToast.info('Resign rejected', 'Educator stays on the team.');
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not decide resign request.';
      setActionError(message);
      showErrorToast(error, message, 'Resign decision failed');
    },
    onSettled: () => setBusyId(null),
  });

  const confirmBusy =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    hireMutation.isPending ||
    decideLeaveMutation.isPending ||
    decideResignMutation.isPending;

  const confirmCopy = useMemo(() => {
    if (!confirmAction) {
      return null;
    }

    const name = confirmAction.name;

    if (confirmAction.kind === 'accept') {
      return {
        title: `Accept ${name}?`,
        message:
          'They will join your institute team and can collaborate under your institute profile.',
        confirmLabel: 'Accept request',
        cancelLabel: 'Not now',
        tone: 'default' as const,
        Icon: CheckCircle2,
      };
    }

    if (confirmAction.kind === 'reject') {
      return {
        title: `Reject ${name}?`,
        message:
          'This join request will be removed. They can request again later with your code or from the institute list.',
        confirmLabel: 'Reject request',
        cancelLabel: 'Keep request',
        tone: 'danger' as const,
        Icon: UserX,
      };
    }

    if (confirmAction.kind === 'hire') {
      return {
        title: `Hire ${name}?`,
        message:
          'A hire invite will be sent. They must accept it from Collaborations before joining your team.',
        confirmLabel: 'Send hire invite',
        cancelLabel: 'Cancel',
        tone: 'default' as const,
        Icon: UserPlus,
      };
    }

    if (confirmAction.kind === 'leave_accept') {
      return {
        title: `Approve leave for ${name}?`,
        message:
          confirmAction.detail ||
          'Temporary leave — they stay on your team and return after the leave period.',
        confirmLabel: 'Accept leave',
        cancelLabel: 'Not now',
        tone: 'default' as const,
        Icon: CalendarDays,
      };
    }

    if (confirmAction.kind === 'leave_reject') {
      return {
        title: `Reject leave for ${name}?`,
        message:
          confirmAction.detail ||
          'Their leave request will be declined and they stay active.',
        confirmLabel: 'Reject leave',
        cancelLabel: 'Keep request',
        tone: 'danger' as const,
        Icon: UserX,
      };
    }

    if (confirmAction.kind === 'resign_accept') {
      return {
        title: `Accept resign for ${name}?`,
        message:
          confirmAction.detail ||
          'Starts a fixed 14-day notice period. Membership ends after notice completes.',
        confirmLabel: 'Accept + notice',
        cancelLabel: 'Not now',
        tone: 'danger' as const,
        Icon: LogOut,
      };
    }

    if (confirmAction.kind === 'resign_reject') {
      return {
        title: `Reject resign for ${name}?`,
        message:
          confirmAction.detail ||
          'Their resign request will be declined and they stay on the team.',
        confirmLabel: 'Reject resign',
        cancelLabel: 'Keep request',
        tone: 'danger' as const,
        Icon: UserX,
      };
    }

    return null;
  }, [confirmAction]);

  const handleConfirm = () => {
    if (!confirmAction) {
      return;
    }

    if (confirmAction.kind === 'accept') {
      acceptMutation.mutate(confirmAction.id);
      return;
    }

    if (confirmAction.kind === 'reject') {
      rejectMutation.mutate(confirmAction.id);
      return;
    }

    if (confirmAction.kind === 'hire') {
      hireMutation.mutate(confirmAction.id);
      return;
    }

    if (confirmAction.kind === 'leave_accept') {
      decideLeaveMutation.mutate({
        profileId: confirmAction.id,
        leaveRequestId: confirmAction.leaveRequestId,
        decision: 'accept',
      });
      return;
    }

    if (confirmAction.kind === 'leave_reject') {
      decideLeaveMutation.mutate({
        profileId: confirmAction.id,
        leaveRequestId: confirmAction.leaveRequestId,
        decision: 'reject',
      });
      return;
    }

    if (confirmAction.kind === 'resign_accept') {
      decideResignMutation.mutate({
        profileId: confirmAction.id,
        decision: 'accept',
      });
      return;
    }

    if (confirmAction.kind === 'resign_reject') {
      decideResignMutation.mutate({
        profileId: confirmAction.id,
        decision: 'reject',
      });
    }
  };

  const shareCode = async () => {
    const code = codeQuery.data?.instituteCode;
    if (!code) {
      showToast.warning('No code yet', 'Institute code is still loading.');
      return;
    }

    try {
      const result = await Share.share({
        message: `Join ${codeQuery.data?.instituteName || 'our institute'} on BIGB with code: ${code}`,
      });
      if (result.action === Share.sharedAction) {
        showToast.success('Code shared', 'Educators can join with your code.');
      }
    } catch {
      showToast.error('Share failed', 'Could not open the share sheet.');
    }
  };

  return (
    <>
      <Screen contentStyle={styles.content} safeBottom={false} scroll>
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.colors.primaryMuted },
          ]}>
          <Building2 color={theme.colors.primary} size={ms(22)} />
        </View>
        <AppText variant="subtitle" weight="bold">
          {codeQuery.data?.instituteName ||
            user?.instituteName ||
            user?.fullName ||
            'Institute'}
        </AppText>
        <AppText color="secondary" variant="caption">
          Share your code, hire educators, and approve join, leave, or resign
          requests.
        </AppText>
      </View>

      {canSwitchToFreelancer ? (
        <View
          style={[
            styles.switchBanner,
            {
              backgroundColor: theme.colors.primaryMuted,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.switchCopy}>
            <AppText variant="label">
              Working as{' '}
              {activeInstitute?.instituteName ||
                codeQuery.data?.instituteName ||
                'institute'}
            </AppText>
            <AppText color="secondary" variant="caption">
              Switch back to your freelancer brand anytime.
            </AppText>
          </View>
          <Button
            loading={isSwitching}
            onPress={() => {
              void switchToFreelancer();
            }}
            size="sm"
            variant="secondary">
            <View style={styles.switchBtnRow}>
              <UserRound color={theme.colors.text} size={ms(14)} />
              <AppText variant="label">Freelancer</AppText>
            </View>
          </Button>
        </View>
      ) : null}

      <View
        style={[
          styles.codeCard,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}>
        <AppText color="inverse" variant="caption">
          Institute code
        </AppText>
        {codeQuery.isLoading ? (
          <ActivityIndicator
            color="#FFFFFF"
            style={{ marginVertical: vs(8) }}
          />
        ) : (
          <AppText
            color="inverse"
            selectable
            style={styles.codeValue}
            variant="title"
            weight="bold">
            {codeQuery.data?.instituteCode || '—'}
          </AppText>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={shareCode}
          style={({ pressed }) => [
            styles.shareBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}>
          <Share2 color={theme.colors.primary} size={ms(15)} />
          <AppText color="brand" variant="label">
            Share code
          </AppText>
        </Pressable>
      </View>

      {actionError ? (
        <AppText color="danger" style={styles.error} variant="caption">
          {actionError}
        </AppText>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Users color={theme.colors.text} size={ms(16)} />
          <AppText variant="subtitle" weight="semibold">
            Hire educators
          </AppText>
        </View>
        <AppText color="secondary" style={styles.sectionHint} variant="caption">
          Browse verified freelancers and send a hire invite — no code needed.
        </AppText>

        <View
          style={[
            styles.searchField,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <Search color={theme.colors.textMuted} size={ms(14)} />
          <TextInput
            maxFontSizeMultiplier={1.3}
            onChangeText={setEducatorSearch}
            placeholder="Search name or mobile…"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
                fontFamily: resolveFontFamily('regular'),
              },
            ]}
            value={educatorSearch}
          />
        </View>

        {freelancersQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : null}

        {!freelancersQuery.isLoading && freelancers.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText color="secondary" variant="caption">
              No educators found. Try another search.
            </AppText>
          </View>
        ) : null}

        {freelancers.map((educator) => (
          <FreelancerRow
            key={educator.id}
            busy={busyId === educator.id}
            educator={educator}
            onHire={() =>
              setConfirmAction({
                kind: 'hire',
                id: educator.id,
                name: educator.fullName || 'this educator',
              })
            }
          />
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <CalendarDays color={theme.colors.text} size={ms(16)} />
          <AppText variant="subtitle" weight="semibold">
            Leave requests ({leaveRequests.length})
          </AppText>
        </View>
        <AppText color="secondary" style={styles.sectionHint} variant="caption">
          Temporary leave — faculty stays on the team after accept.
        </AppText>

        {teamQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : null}

        {!teamQuery.isLoading && leaveRequests.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText color="secondary" variant="caption">
              No pending leave requests.
            </AppText>
          </View>
        ) : null}

        {leaveRequests.map((item) => {
          const range =
            item.startsAt && item.endsAt
              ? `${formatHrDay(item.startsAt)} → ${formatHrDay(item.endsAt)}`
              : null;
          const detailParts = [
            range ? `Dates: ${range}` : null,
            item.reason ? `Reason: ${item.reason}` : null,
          ].filter(Boolean);
          const detail = detailParts.length
            ? detailParts.join('\n')
            : undefined;
          const busyKey = item.leaveRequestId || item.profileId;

          return (
            <LeaveRequestCard
              key={item.key}
              busy={busyId === busyKey}
              item={item}
              onAccept={() =>
                setConfirmAction({
                  kind: 'leave_accept',
                  id: item.profileId,
                  leaveRequestId: item.leaveRequestId,
                  name: item.member.fullName || 'this educator',
                  detail,
                })
              }
              onReject={() =>
                setConfirmAction({
                  kind: 'leave_reject',
                  id: item.profileId,
                  leaveRequestId: item.leaveRequestId,
                  name: item.member.fullName || 'this educator',
                  detail,
                })
              }
            />
          );
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <CalendarDays color={theme.colors.text} size={ms(16)} />
          <AppText variant="subtitle" weight="semibold">
            Faculty on leave ({onLeaveMembers.length})
          </AppText>
        </View>
        <AppText color="secondary" style={styles.sectionHint} variant="caption">
          Approved leave — educator is away for these dates.
        </AppText>

        {!teamQuery.isLoading && onLeaveMembers.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText color="secondary" variant="caption">
              No educators currently on leave.
            </AppText>
          </View>
        ) : null}

        {onLeaveMembers.map((item) => (
          <OnLeaveCard key={item.key} item={item} />
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <LogOut color={theme.colors.text} size={ms(16)} />
          <AppText variant="subtitle" weight="semibold">
            Resign requests ({resignRequests.length})
          </AppText>
        </View>
        <AppText color="secondary" style={styles.sectionHint} variant="caption">
          Accept starts a fixed 14-day notice period.
        </AppText>

        {!teamQuery.isLoading && resignRequests.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText color="secondary" variant="caption">
              No pending resign requests.
            </AppText>
          </View>
        ) : null}

        {resignRequests.map((member) => {
          const detail = member.resignReason
            ? `Reason: ${member.resignReason}`
            : undefined;

          return (
            <ResignRequestCard
              key={`resign-${member.id}`}
              busy={busyId === member.id}
              member={member}
              onAccept={() =>
                setConfirmAction({
                  kind: 'resign_accept',
                  id: member.id,
                  name: member.fullName || 'this educator',
                  detail,
                })
              }
              onReject={() =>
                setConfirmAction({
                  kind: 'resign_reject',
                  id: member.id,
                  name: member.fullName || 'this educator',
                  detail,
                })
              }
            />
          );
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <UserPlus color={theme.colors.text} size={ms(16)} />
          <AppText variant="subtitle" weight="semibold">
            Join requests ({pending.length})
          </AppText>
        </View>

        {teamQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : null}

        {!teamQuery.isLoading && pending.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText color="secondary" variant="caption">
              No pending educator join requests.
            </AppText>
          </View>
        ) : null}

        {pending.map((member) => (
          <JoinRequestCard
            key={member.id}
            busy={busyId === member.id}
            member={member}
            onAccept={() =>
              setConfirmAction({
                kind: 'accept',
                id: member.id,
                name: member.fullName || 'this educator',
              })
            }
            onReject={() =>
              setConfirmAction({
                kind: 'reject',
                id: member.id,
                name: member.fullName || 'this educator',
              })
            }
          />
        ))}

        <Pressable onPress={refresh} style={styles.refresh}>
          <AppText color="brand" variant="label">
            Refresh
          </AppText>
        </Pressable>
      </View>
      </Screen>

      <ConfirmModal
        Icon={confirmCopy?.Icon}
        cancelLabel={confirmCopy?.cancelLabel}
        confirmLabel={confirmCopy?.confirmLabel}
        isLoading={confirmBusy}
        message={confirmCopy?.message || ''}
        onCancel={() => {
          if (!confirmBusy) {
            setConfirmAction(null);
          }
        }}
        onConfirm={handleConfirm}
        title={confirmCopy?.title || ''}
        tone={confirmCopy?.tone}
        visible={Boolean(confirmAction && confirmCopy)}
      />
    </>
  );
}

function formatHrDay(value?: string): string {
  if (!value) {
    return '';
  }
  const dayPart = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) {
    return formatDisplayDate(dayPart);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return formatDisplayDate(
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  );
}

function FreelancerRow({
  educator,
  busy,
  onHire,
}: {
  educator: FreelancerDirectoryItem;
  busy: boolean;
  onHire: () => void;
}) {
  const theme = useTheme();
  const photo = resolveUploadUrl(educator.profilePhotoPath);
  const isActive = educator.collabStatus === 'active';
  const isPending = educator.collabStatus === 'invited';
  const isBlocked = Boolean(
    educator.collabStatus &&
      educator.collabStatus !== 'ended' &&
      educator.collabStatus !== 'deleted',
  );
  const goals =
    educator.examGoals?.length > 0
      ? educator.examGoals.slice(0, 2).join(', ')
      : null;

  return (
    <View
      style={[
        styles.directoryRow,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: theme.colors.primaryMuted },
        ]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatarImage} />
        ) : (
          <AppText color="brand" variant="caption">
            {(educator.fullName || 'E').slice(0, 1).toUpperCase()}
          </AppText>
        )}
      </View>
      <View style={styles.directoryCopy}>
        <AppText numberOfLines={1} variant="label">
          {educator.fullName || 'Educator'}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {educator.mobileNumber}
          {goals ? ` · ${goals}` : ''}
        </AppText>
      </View>
      {isBlocked ? (
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isActive
                ? theme.palette.success[50]
                : theme.colors.primaryMuted,
            },
          ]}>
          <AppText
            color={isActive ? 'primary' : 'brand'}
            style={isActive ? { color: theme.colors.success } : undefined}
            variant="caption">
            {isActive ? 'Joined' : isPending ? 'Pending' : 'Linked'}
          </AppText>
        </View>
      ) : (
        <Button disabled={busy} loading={busy} onPress={onHire} size="sm">
          Hire
        </Button>
      )}
    </View>
  );
}

function JoinRequestCard({
  member,
  busy,
  onAccept,
  onReject,
}: {
  member: InstituteTeamMember;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.requestCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText variant="label">{member.fullName || 'Educator'}</AppText>
      <AppText color="secondary" variant="caption">
        {member.email}
      </AppText>
      <AppText color="muted" variant="caption">
        {member.mobileNumber}
      </AppText>
      <View style={styles.rowActions}>
        <Button
          disabled={busy}
          loading={busy}
          onPress={onAccept}
          size="sm"
          style={styles.actionBtn}>
          Accept
        </Button>
        <Button
          disabled={busy}
          onPress={onReject}
          size="sm"
          style={styles.actionBtn}
          variant="secondary">
          Reject
        </Button>
      </View>
    </View>
  );
}

function LeaveRequestCard({
  item,
  busy,
  onAccept,
  onReject,
}: {
  item: PendingLeaveItem;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const theme = useTheme();
  const range =
    item.startsAt && item.endsAt
      ? `${formatHrDay(item.startsAt)} → ${formatHrDay(item.endsAt)}`
      : null;

  return (
    <View
      style={[
        styles.requestCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText variant="label">{item.member.fullName || 'Educator'}</AppText>
      {range ? (
        <AppText color="muted" variant="caption">
          {range}
        </AppText>
      ) : null}
      {item.reason ? (
        <AppText color="secondary" numberOfLines={3} variant="caption">
          {item.reason}
        </AppText>
      ) : null}
      <View style={styles.rowActions}>
        <Button
          disabled={busy}
          loading={busy}
          onPress={onAccept}
          size="sm"
          style={styles.actionBtn}>
          Accept leave
        </Button>
        <Button
          disabled={busy}
          onPress={onReject}
          size="sm"
          style={styles.actionBtn}
          variant="secondary">
          Reject
        </Button>
      </View>
    </View>
  );
}

function OnLeaveCard({
  item,
}: {
  item: {
    member: InstituteTeamMember;
    reason?: string;
    startsAt?: string;
    endsAt?: string;
  };
}) {
  const theme = useTheme();
  const range =
    item.startsAt && item.endsAt
      ? `${formatHrDay(item.startsAt)} → ${formatHrDay(item.endsAt)}`
      : null;

  return (
    <View
      style={[
        styles.requestCard,
        {
          backgroundColor: theme.colors.primaryMuted,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText variant="label">{item.member.fullName || 'Educator'}</AppText>
      <AppText color="brand" variant="caption">
        On leave
        {item.endsAt ? ` until ${formatHrDay(item.endsAt)}` : ''}
      </AppText>
      {range ? (
        <AppText color="muted" variant="caption">
          {range}
        </AppText>
      ) : null}
      {item.reason ? (
        <AppText color="secondary" numberOfLines={3} variant="caption">
          {item.reason}
        </AppText>
      ) : null}
    </View>
  );
}

function ResignRequestCard({
  member,
  busy,
  onAccept,
  onReject,
}: {
  member: InstituteTeamMember;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.requestCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText variant="label">{member.fullName || 'Educator'}</AppText>
      {member.resignReason ? (
        <AppText color="secondary" numberOfLines={3} variant="caption">
          {member.resignReason}
        </AppText>
      ) : null}
      <View style={styles.rowActions}>
        <Button
          disabled={busy}
          loading={busy}
          onPress={onAccept}
          size="sm"
          style={styles.actionBtn}>
          Accept + notice
        </Button>
        <Button
          disabled={busy}
          onPress={onReject}
          size="sm"
          style={styles.actionBtn}
          variant="secondary">
          Reject
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: vs(32),
    gap: ms(8),
  },
  header: {
    alignItems: 'flex-start',
    gap: ms(6),
    marginBottom: vs(10),
  },
  switchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    marginBottom: vs(12),
  },
  switchCopy: {
    flex: 1,
    gap: ms(2),
    minWidth: 0,
  },
  switchBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  iconWrap: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(2),
  },
  codeCard: {
    borderRadius: ms(14),
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    gap: ms(6),
    marginBottom: vs(14),
  },
  codeValue: {
    letterSpacing: 2,
    fontSize: fontSize(22),
    lineHeight: lineHeight(22, 1.25),
  },
  shareBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(12),
    height: ms(36),
    borderRadius: ms(10),
    marginTop: vs(4),
  },
  section: {
    gap: ms(10),
    marginBottom: vs(16),
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  sectionHint: {
    marginTop: vs(-4),
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    borderWidth: 1,
    borderRadius: ms(10),
    paddingHorizontal: s(10),
    height: ms(40),
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: fontSize(14),
    lineHeight: lineHeight(14, 1.3),
  },
  directoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(10),
  },
  avatar: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  directoryCopy: {
    flex: 1,
    minWidth: 0,
    gap: ms(2),
  },
  statusPill: {
    borderRadius: ms(8),
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
  },
  empty: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
  },
  requestCard: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    gap: ms(4),
  },
  rowActions: {
    flexDirection: 'row',
    gap: ms(8),
    marginTop: vs(8),
  },
  actionBtn: {
    flex: 1,
  },
  error: {
    marginBottom: vs(4),
  },
  refresh: {
    alignSelf: 'center',
    paddingVertical: vs(8),
  },
});
