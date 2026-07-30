/**
 * Educator collaborations — join by code/list, Accept/Decline hire, switch profile.
 */

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, KeyRound, Search, Shuffle, UserX } from 'lucide-react-native';

import { authApi, useAuthStore, useSwitchEducatorProfile } from '@/features/auth';
import type {
  EducatorProfileSummary,
  LeaveRequestSummary,
} from '@/features/auth/types/auth.types';
import { AuthField, AuthTextInput } from '@/features/auth/components/AuthFields';
import { authSessionKeys } from '@/features/auth/hooks/useAuthSessionReady';
import {
  CollabHrRequestModal,
  type CollabHrMode,
} from '@/features/educator/components/CollabHrRequestModal';
import { MembershipHrActions } from '@/features/educator/components/MembershipHrActions';
import { ApiError } from '@/shared/api/types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ConfirmModal, Screen } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

const ENTERABLE = new Set([
  'active',
  'leave_pending',
  'on_leave',
  'resign_pending',
  'notice_period',
]);

type InstituteDirectoryItem = {
  id: string;
  instituteName: string;
  instituteLogoPath?: string;
  instituteCode?: string;
  collabStatus: string | null;
};

type ConfirmAction =
  | {
      kind: 'accept';
      profile: EducatorProfileSummary;
    }
  | {
      kind: 'decline';
      profile: EducatorProfileSummary;
    }
  | {
      kind: 'join';
      instituteId?: string;
      instituteCode?: string;
      name: string;
    }
  | {
      kind: 'cancelLeave';
      profile: EducatorProfileSummary;
      leaveRequest?: LeaveRequestSummary;
    }
  | {
      kind: 'cancelResign';
      profile: EducatorProfileSummary;
    };

function isRealLeaveRequestId(id?: string): id is string {
  return Boolean(id) && !id.startsWith('legacy-');
}

/**
 * Freelancer educator inbox for institute collaborations.
 */
export function EducatorCollaborationsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { isSwitching, switchToInstitute } = useSwitchEducatorProfile();

  const [code, setCode] = useState('');
  const [instituteSearch, setInstituteSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [hrOpen, setHrOpen] = useState(false);
  const [hrMode, setHrMode] = useState<CollabHrMode>('leave');
  const [hrTarget, setHrTarget] = useState<EducatorProfileSummary | null>(
    null,
  );
  const [editingLeave, setEditingLeave] = useState<LeaveRequestSummary | null>(
    null,
  );

  const profiles = user?.profiles || [];

  const pending = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.type === 'institute' && profile.status === 'invited',
      ),
    [profiles],
  );

  const memberships = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.type === 'institute' && ENTERABLE.has(profile.status),
      ),
    [profiles],
  );

  const institutesQuery = useQuery({
    queryKey: ['educator', 'institutes', accessToken, instituteSearch.trim()],
    enabled: Boolean(accessToken),
    queryFn: () =>
      authApi.listInstitutes(accessToken as string, instituteSearch),
  });

  const institutes = (institutesQuery.data || []) as InstituteDirectoryItem[];

  const refreshMe = async () => {
    if (!accessToken) {
      return;
    }
    const latest = await authApi.me(accessToken);
    setUser(latest);
    await queryClient.invalidateQueries({
      queryKey: authSessionKeys.me(accessToken),
    });
    await queryClient.invalidateQueries({
      queryKey: ['educator', 'institutes'],
    });
  };

  const joinMutation = useMutation({
    mutationFn: (input: { instituteCode?: string; instituteId?: string }) =>
      authApi.requestJoin(accessToken as string, input),
    onMutate: () => setError(null),
    onSuccess: async () => {
      setCode('');
      setConfirmAction(null);
      await refreshMe();
      showToast.success(
        'Request sent',
        'Waiting for the institute to accept you.',
      );
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Could not send join request.';
      setError(message);
      showErrorToast(err, message, 'Join failed');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (profileId: string) =>
      authApi.acceptHireInvite(accessToken as string, profileId),
    onMutate: (id) => {
      setBusyId(id);
      setError(null);
    },
    onSuccess: async () => {
      setConfirmAction(null);
      await refreshMe();
      showToast.success('Invite accepted', 'Collaboration is now active.');
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : 'Could not accept invite.';
      setError(message);
      showErrorToast(err, message, 'Accept failed');
    },
    onSettled: () => setBusyId(null),
  });

  const declineMutation = useMutation({
    mutationFn: (profileId: string) =>
      authApi.declineCollaboration(accessToken as string, profileId),
    onMutate: (id) => {
      setBusyId(id);
      setError(null);
    },
    onSuccess: async () => {
      setConfirmAction(null);
      await refreshMe();
      showToast.info('Invite declined', 'The collaboration request was closed.');
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : 'Could not decline request.';
      setError(message);
      showErrorToast(err, message, 'Decline failed');
    },
    onSettled: () => setBusyId(null),
  });

  const leaveMutation = useMutation({
    mutationFn: (input: {
      profileId: string;
      reason: string;
      leaveStartsAt: string;
      leaveEndsAt: string;
      leaveRequestId?: string;
      updatePending?: boolean;
    }) =>
      authApi.requestLeave(accessToken as string, input.profileId, {
        reason: input.reason,
        leaveStartsAt: input.leaveStartsAt,
        leaveEndsAt: input.leaveEndsAt,
        leaveRequestId: input.leaveRequestId,
        updatePending: input.updatePending,
      }),
    onSuccess: async (_data, input) => {
      setHrOpen(false);
      setHrTarget(null);
      setEditingLeave(null);
      const wasUpdate = Boolean(input.leaveRequestId || input.updatePending);
      await refreshMe();
      showToast.success(
        wasUpdate ? 'Leave updated' : 'Leave requested',
        wasUpdate
          ? 'Pending leave updated for institute review.'
          : 'Waiting for the institute to review.',
      );
    },
    onError: (err) => {
      showErrorToast(
        err,
        err instanceof ApiError ? err.message : 'Could not request leave.',
        'Leave failed',
      );
    },
  });

  const resignMutation = useMutation({
    mutationFn: (input: { profileId: string; reason: string }) =>
      authApi.requestResign(accessToken as string, input.profileId, {
        reason: input.reason,
      }),
    onSuccess: async () => {
      setHrOpen(false);
      setHrTarget(null);
      setEditingLeave(null);
      await refreshMe();
      showToast.success(
        'Resign requested',
        'Notice starts only after institute accepts.',
      );
    },
    onError: (err) => {
      showErrorToast(
        err,
        err instanceof ApiError ? err.message : 'Could not request resign.',
        'Resign failed',
      );
    },
  });

  const cancelLeaveMutation = useMutation({
    mutationFn: (input: { profileId: string; leaveRequestId?: string }) =>
      authApi.cancelLeave(
        accessToken as string,
        input.profileId,
        input.leaveRequestId ? { leaveRequestId: input.leaveRequestId } : undefined,
      ),
    onMutate: (input) => setBusyId(input.profileId),
    onError: (err) => {
      showErrorToast(
        err,
        err instanceof ApiError ? err.message : 'Could not cancel leave.',
        'Cancel failed',
      );
    },
    onSettled: () => setBusyId(null),
  });

  const cancelResignMutation = useMutation({
    mutationFn: (profileId: string) =>
      authApi.cancelResign(accessToken as string, profileId),
    onMutate: (id) => setBusyId(id),
    onSuccess: async () => {
      setConfirmAction(null);
      await refreshMe();
      showToast.info('Resign cancelled', 'Your resign request was withdrawn.');
    },
    onError: (err) => {
      showErrorToast(
        err,
        err instanceof ApiError ? err.message : 'Could not cancel resign.',
        'Cancel failed',
      );
    },
    onSettled: () => setBusyId(null),
  });

  const busy =
    joinMutation.isPending ||
    Boolean(busyId) ||
    isSwitching ||
    leaveMutation.isPending ||
    resignMutation.isPending ||
    cancelLeaveMutation.isPending ||
    cancelResignMutation.isPending;

  const openHr = (
    mode: CollabHrMode,
    profile: EducatorProfileSummary,
    leave?: LeaveRequestSummary | null,
  ) => {
    setHrMode(mode);
    setHrTarget(profile);
    setEditingLeave(mode === 'leave' ? leave || null : null);
    setHrOpen(true);
  };

  const confirmBusy =
    joinMutation.isPending ||
    acceptMutation.isPending ||
    declineMutation.isPending ||
    cancelLeaveMutation.isPending ||
    cancelResignMutation.isPending;

  const confirmCopy = useMemo(() => {
    if (!confirmAction) {
      return null;
    }

    if (confirmAction.kind === 'accept') {
      const name = confirmAction.profile.instituteName || 'this institute';
      return {
        title: `Accept invite from ${name}?`,
        message:
          'After accepting, this institute profile becomes available and you can enter it anytime.',
        confirmLabel: 'Accept invite',
        cancelLabel: 'Not now',
        tone: 'default' as const,
        Icon: CheckCircle2,
      };
    }

    if (confirmAction.kind === 'decline') {
      const profile = confirmAction.profile;
      const name = profile.instituteName || 'this institute';
      const isHire = profile.joinSource === 'institute_hire';
      return {
        title: isHire ? `Decline invite from ${name}?` : `Cancel request to ${name}?`,
        message: isHire
          ? 'This hire invite will be removed. The institute can send a new invite later if needed.'
          : 'This join request will be removed. You can request again later if needed.',
        confirmLabel: isHire ? 'Decline invite' : 'Cancel request',
        cancelLabel: 'Keep it',
        tone: 'danger' as const,
        Icon: UserX,
      };
    }

    if (confirmAction.kind === 'cancelLeave') {
      return {
        title: 'Cancel leave request?',
        message: 'Your pending leave request will be withdrawn.',
        confirmLabel: 'Cancel leave',
        cancelLabel: 'Keep request',
        tone: 'default' as const,
        Icon: CheckCircle2,
      };
    }

    if (confirmAction.kind === 'cancelResign') {
      return {
        title: 'Cancel resign request?',
        message: 'Your pending resign request will be withdrawn.',
        confirmLabel: 'Cancel resign',
        cancelLabel: 'Keep request',
        tone: 'default' as const,
        Icon: CheckCircle2,
      };
    }

    return {
      title: `Request to join ${confirmAction.name}?`,
      message:
        'The institute will review your request. You can cancel it from Pending until they respond.',
      confirmLabel: 'Send request',
      cancelLabel: 'Cancel',
      tone: 'default' as const,
      Icon: Building2,
    };
  }, [confirmAction]);

  const handleConfirm = () => {
    if (!confirmAction) {
      return;
    }

    if (confirmAction.kind === 'accept') {
      acceptMutation.mutate(confirmAction.profile.id);
      return;
    }

    if (confirmAction.kind === 'decline') {
      declineMutation.mutate(confirmAction.profile.id);
      return;
    }

    if (confirmAction.kind === 'cancelLeave') {
      const leaveRequestId = isRealLeaveRequestId(
        confirmAction.leaveRequest?.id,
      )
        ? confirmAction.leaveRequest!.id
        : undefined;
      cancelLeaveMutation.mutate(
        {
          profileId: confirmAction.profile.id,
          leaveRequestId,
        },
        {
          onSuccess: async () => {
            setConfirmAction(null);
            await refreshMe();
            showToast.info(
              'Leave cancelled',
              'Your leave request was withdrawn.',
            );
          },
        },
      );
      return;
    }

    if (confirmAction.kind === 'cancelResign') {
      cancelResignMutation.mutate(confirmAction.profile.id);
      return;
    }

    joinMutation.mutate({
      instituteId: confirmAction.instituteId,
      instituteCode: confirmAction.instituteCode,
    });
  };

  return (
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
          Collaborations
        </AppText>
        <AppText color="secondary" variant="caption">
          Join by code or browse institutes, respond to hire invites, and switch
          profile.
        </AppText>
      </View>

      {error ? (
        <AppText color="danger" style={styles.error} variant="caption">
          {error}
        </AppText>
      ) : null}

      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <View style={styles.panelHead}>
          <KeyRound color={theme.colors.text} size={ms(16)} />
          <AppText variant="label">Join with institute code</AppText>
        </View>
        <AuthField label="Institute code">
          <AuthTextInput
            autoCapitalize="characters"
            onChangeText={setCode}
            placeholder="e.g. BIGB1234"
            value={code}
          />
        </AuthField>
        <Button
          disabled={busy || code.trim().length < 4}
          loading={joinMutation.isPending}
          onPress={() =>
            setConfirmAction({
              kind: 'join',
              instituteCode: code.trim().toUpperCase(),
              name: code.trim().toUpperCase(),
            })
          }
          fullWidth>
          Request with code
        </Button>

        <View
          style={[styles.divider, { borderTopColor: theme.colors.border }]}
        />

        <View style={styles.browseHead}>
          <AppText variant="label">Browse institutes</AppText>
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
              onChangeText={setInstituteSearch}
              placeholder="Search name or code…"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.searchInput,
                {
                  color: theme.colors.text,
                  fontFamily: resolveFontFamily('regular'),
                },
              ]}
              value={instituteSearch}
            />
          </View>
        </View>

        {institutesQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : null}

        {!institutesQuery.isLoading && institutes.length === 0 ? (
          <Empty text="No institutes found. Try another search or use a code." />
        ) : null}

        {institutes.map((institute) => {
          const logo = resolveUploadUrl(institute.instituteLogoPath);
          const isActive = institute.collabStatus === 'active';
          const isPending = institute.collabStatus === 'invited';
          const isBlocked = Boolean(
            institute.collabStatus &&
              institute.collabStatus !== 'ended' &&
              institute.collabStatus !== 'deleted',
          );

          return (
            <View
              key={institute.id}
              style={[
                styles.directoryRow,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.primaryMuted },
                ]}>
                {logo ? (
                  <Image source={{ uri: logo }} style={styles.avatarImage} />
                ) : (
                  <Building2 color={theme.colors.primary} size={ms(16)} />
                )}
              </View>
              <View style={styles.directoryCopy}>
                <AppText numberOfLines={1} variant="label">
                  {institute.instituteName}
                </AppText>
                <AppText color="muted" variant="caption">
                  {institute.instituteCode || '—'}
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
                    style={
                      isActive ? { color: theme.colors.success } : undefined
                    }
                    variant="caption">
                    {isActive ? 'Joined' : isPending ? 'Pending' : 'Linked'}
                  </AppText>
                </View>
              ) : (
                <Button
                  disabled={busy}
                  loading={
                    joinMutation.isPending &&
                    joinMutation.variables?.instituteId === institute.id
                  }
                  onPress={() =>
                    setConfirmAction({
                      kind: 'join',
                      instituteId: institute.id,
                      name: institute.instituteName,
                    })
                  }
                  size="sm">
                  Request
                </Button>
              )}
            </View>
          );
        })}
      </View>

      <Section title={`Pending (${pending.length})`}>
        {pending.length === 0 ? (
          <Empty text="No pending invites or join requests." />
        ) : (
          pending.map((profile) => (
            <PendingRow
              key={profile.id}
              busy={busyId === profile.id}
              profile={profile}
              onAccept={() =>
                setConfirmAction({ kind: 'accept', profile })
              }
              onDecline={() =>
                setConfirmAction({ kind: 'decline', profile })
              }
            />
          ))
        )}
      </Section>

      <Section title={`Memberships (${memberships.length})`}>
        <AppText color="secondary" style={styles.sectionHint} variant="caption">
          Enter an institute workspace, or request leave / resign like on web.
        </AppText>
        {memberships.length === 0 ? (
          <Empty text="No active institute memberships yet." />
        ) : (
          memberships.map((profile) => {
            const isActive = user?.activeProfileId === profile.id;
            return (
              <View
                key={profile.id}
                style={[
                  styles.rowCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <AppText variant="label">
                  {profile.instituteName || 'Institute'}
                </AppText>
                <AppText color="muted" variant="caption">
                  Status: {profile.status}
                  {isActive ? ' · Active now' : ''}
                </AppText>
                <Button
                  disabled={busy || isActive}
                  loading={isSwitching && busyId === profile.id}
                  onPress={() => {
                    setBusyId(profile.id);
                    void switchToInstitute(
                      profile.id,
                      profile.instituteName,
                    ).finally(() => setBusyId(null));
                  }}
                  size="sm"
                  style={styles.enterBtn}
                  variant={isActive ? 'secondary' : 'primary'}>
                  <View style={styles.enterRow}>
                    <Shuffle
                      color={isActive ? theme.colors.text : '#FFFFFF'}
                      size={ms(14)}
                    />
                    <AppText
                      color={isActive ? 'primary' : 'inverse'}
                      variant="label">
                      {isActive ? 'Working here' : 'Enter institute'}
                    </AppText>
                  </View>
                </Button>
                <MembershipHrActions
                  busy={busy}
                  profile={profile}
                  onCancelLeave={(leave) =>
                    setConfirmAction({
                      kind: 'cancelLeave',
                      profile,
                      leaveRequest: leave,
                    })
                  }
                  onCancelResign={() =>
                    setConfirmAction({ kind: 'cancelResign', profile })
                  }
                  onRequestLeave={() => openHr('leave', profile, null)}
                  onRequestResign={() => openHr('resign', profile, null)}
                  onUpdateLeave={(leave) => openHr('leave', profile, leave)}
                />
              </View>
            );
          })
        )}
      </Section>

      <Pressable
        onPress={() => {
          refreshMe().catch(() => undefined);
        }}
        style={styles.refresh}>
        {isSwitching || joinMutation.isPending ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <AppText color="brand" variant="label">
            Refresh
          </AppText>
        )}
      </Pressable>

      {confirmCopy ? (
        <ConfirmModal
          Icon={confirmCopy.Icon}
          cancelLabel={confirmCopy.cancelLabel}
          confirmLabel={confirmCopy.confirmLabel}
          isLoading={confirmBusy}
          message={confirmCopy.message}
          onCancel={() => {
            if (!confirmBusy) {
              setConfirmAction(null);
            }
          }}
          onConfirm={handleConfirm}
          title={confirmCopy.title}
          tone={confirmCopy.tone}
          visible={Boolean(confirmAction)}
        />
      ) : null}

      <CollabHrRequestModal
        initialLeaveEndsAt={editingLeave?.endsAt}
        initialLeaveStartsAt={editingLeave?.startsAt}
        initialReason={editingLeave?.reason}
        instituteName={hrTarget?.instituteName}
        isLeaveUpdate={Boolean(editingLeave)}
        isSubmitting={leaveMutation.isPending || resignMutation.isPending}
        mode={hrMode}
        onClose={() => {
          if (!leaveMutation.isPending && !resignMutation.isPending) {
            setHrOpen(false);
            setHrTarget(null);
            setEditingLeave(null);
          }
        }}
        onSubmit={async (input) => {
          if (!hrTarget) {
            return;
          }
          if (hrMode === 'leave') {
            await leaveMutation.mutateAsync({
              profileId: hrTarget.id,
              reason: input.reason,
              leaveStartsAt: input.leaveStartsAt as string,
              leaveEndsAt: input.leaveEndsAt as string,
              leaveRequestId: isRealLeaveRequestId(editingLeave?.id)
                ? editingLeave!.id
                : undefined,
              updatePending:
                Boolean(editingLeave) &&
                !isRealLeaveRequestId(editingLeave?.id),
            });
            return;
          }
          await resignMutation.mutateAsync({
            profileId: hrTarget.id,
            reason: input.reason,
          });
        }}
        visible={hrOpen}
      />
    </Screen>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle} variant="subtitle">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.empty,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText color="secondary" variant="caption">
        {text}
      </AppText>
    </View>
  );
}

function PendingRow({
  profile,
  busy,
  onAccept,
  onDecline,
}: {
  profile: EducatorProfileSummary;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const theme = useTheme();
  const isHire = profile.joinSource === 'institute_hire';

  return (
    <View
      style={[
        styles.rowCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText variant="label">
        {profile.instituteName || 'Institute'}
      </AppText>
      <AppText color="muted" variant="caption">
        {isHire ? 'Hire invite from institute' : 'Your join request'}
      </AppText>
      <View style={styles.rowActions}>
        {isHire ? (
          <Button
            disabled={busy}
            loading={busy}
            onPress={onAccept}
            size="sm"
            style={styles.actionBtn}>
            Accept
          </Button>
        ) : null}
        <Button
          disabled={busy}
          onPress={onDecline}
          size="sm"
          style={styles.actionBtn}
          variant="secondary">
          {isHire ? 'Decline' : 'Cancel'}
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
    gap: ms(6),
    marginBottom: vs(10),
  },
  iconWrap: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginBottom: vs(8),
  },
  panel: {
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(14),
    gap: ms(10),
    marginBottom: vs(14),
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: vs(4),
    paddingTop: vs(12),
  },
  browseHead: {
    gap: ms(8),
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
  section: {
    gap: ms(10),
    marginBottom: vs(12),
  },
  sectionTitle: {
    marginBottom: vs(2),
  },
  sectionHint: {
    marginBottom: vs(2),
  },
  empty: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
  },
  rowCard: {
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
  enterBtn: {
    marginTop: vs(8),
    alignSelf: 'flex-start',
  },
  enterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  refresh: {
    alignSelf: 'center',
    paddingVertical: vs(8),
  },
});
