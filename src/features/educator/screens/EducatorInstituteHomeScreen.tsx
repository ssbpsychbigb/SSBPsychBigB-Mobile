/**
 * Educator institute workspace — after Enter on a collaboration (not owner ops).
 */

import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  BookOpen,
  Building2,
  Shield,
  Undo2,
  UserRound,
} from 'lucide-react-native';

import {
  authApi,
  getActiveInstituteProfile,
  useAuthStore,
  useSwitchEducatorProfile,
} from '@/features/auth';
import { authSessionKeys } from '@/features/auth/hooks/useAuthSessionReady';
import type {
  EducatorProfileSummary,
  LeaveRequestSummary,
} from '@/features/auth/types/auth.types';
import {
  CollabHrRequestModal,
  type CollabHrMode,
} from '@/features/educator/components/CollabHrRequestModal';
import { MembershipHrActions } from '@/features/educator/components/MembershipHrActions';
import { ApiError } from '@/shared/api/types';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ConfirmModal, Screen } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type CancelKind = 'leave' | 'resign';

function isRealLeaveRequestId(id?: string): id is string {
  return Boolean(id) && !id.startsWith('legacy-');
}

/**
 * Home for freelancers currently working inside an institute profile.
 */
export function EducatorInstituteHomeScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const {
    canSwitchToFreelancer,
    isSwitching,
    switchToFreelancer,
  } = useSwitchEducatorProfile();

  const profile = getActiveInstituteProfile(user);
  const membershipProfile =
    user?.profiles?.find((row) => row.id === profile?.id) || profile;

  const [hrOpen, setHrOpen] = useState(false);
  const [hrMode, setHrMode] = useState<CollabHrMode>('leave');
  const [editingLeave, setEditingLeave] = useState<LeaveRequestSummary | null>(
    null,
  );
  const [cancelKind, setCancelKind] = useState<CancelKind | null>(null);
  const [cancelLeaveTarget, setCancelLeaveTarget] =
    useState<LeaveRequestSummary | null>(null);

  const instituteName =
    membershipProfile?.instituteName ||
    profile?.instituteName ||
    user?.instituteName ||
    'Institute';
  const logo = resolveUploadUrl(
    membershipProfile?.instituteLogoPath ||
      profile?.instituteLogoPath ||
      user?.instituteLogoPath,
  );
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'Educator';
  const examGoals =
    membershipProfile?.examGoals?.length
      ? membershipProfile.examGoals.join(', ')
      : user?.examGoals?.join(', ') || user?.examGoal || null;

  const refreshMe = async () => {
    if (!accessToken) {
      return;
    }
    const latest = await authApi.me(accessToken);
    setUser(latest);
    await queryClient.invalidateQueries({
      queryKey: authSessionKeys.me(accessToken),
    });
  };

  const leaveMutation = useMutation({
    mutationFn: (input: {
      reason: string;
      leaveStartsAt: string;
      leaveEndsAt: string;
      leaveRequestId?: string;
      updatePending?: boolean;
    }) =>
      authApi.requestLeave(accessToken as string, membershipProfile!.id, input),
    onSuccess: async (_data, input) => {
      setHrOpen(false);
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
    mutationFn: (input: { reason: string }) =>
      authApi.requestResign(accessToken as string, membershipProfile!.id, input),
    onSuccess: async () => {
      setHrOpen(false);
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
    mutationFn: (leaveRequestId?: string) =>
      authApi.cancelLeave(
        accessToken as string,
        membershipProfile!.id,
        leaveRequestId ? { leaveRequestId } : undefined,
      ),
    onError: (err) => {
      showErrorToast(
        err,
        err instanceof ApiError ? err.message : 'Could not cancel leave.',
        'Cancel failed',
      );
    },
  });

  const cancelResignMutation = useMutation({
    mutationFn: () =>
      authApi.cancelResign(accessToken as string, membershipProfile!.id),
    onSuccess: async () => {
      setCancelKind(null);
      setCancelLeaveTarget(null);
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
  });

  const hrBusy =
    leaveMutation.isPending ||
    resignMutation.isPending ||
    cancelLeaveMutation.isPending ||
    cancelResignMutation.isPending;

  const openHr = (mode: CollabHrMode, leave?: LeaveRequestSummary | null) => {
    setHrMode(mode);
    setEditingLeave(mode === 'leave' ? leave || null : null);
    setHrOpen(true);
  };

  const handleRequestLeave = () => {
    openHr('leave', null);
  };

  const handleUpdateLeave = (leave: LeaveRequestSummary) => {
    openHr('leave', leave);
  };

  const handleRequestResign = () => {
    openHr('resign', null);
  };

  const handleConfirmCancel = () => {
    if (cancelKind === 'resign') {
      cancelResignMutation.mutate();
      return;
    }

    const leaveRequestId = isRealLeaveRequestId(cancelLeaveTarget?.id)
      ? cancelLeaveTarget!.id
      : undefined;

    cancelLeaveMutation.mutate(leaveRequestId, {
      onSuccess: async () => {
        setCancelKind(null);
        setCancelLeaveTarget(null);
        await refreshMe();
        showToast.info('Leave cancelled', 'Your leave request was withdrawn.');
      },
    });
  };

  const cancelConfirmTitle =
    cancelKind === 'resign'
      ? 'Cancel resign request?'
      : 'Cancel leave request?';

  const cancelConfirmMessage =
    cancelKind === 'resign'
      ? 'Your pending resign request will be withdrawn.'
      : 'Your pending leave request will be withdrawn.';

  const cancelConfirmLabel =
    cancelKind === 'resign' ? 'Cancel resign' : 'Cancel leave';

  return (
    <>
      <Screen contentStyle={styles.content} safeBottom={false} scroll>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View
            style={[
              styles.logoWrap,
              {
                backgroundColor: theme.colors.primaryMuted,
                borderColor: theme.colors.border,
              },
            ]}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoImage} />
            ) : (
              <Building2 color={theme.colors.primary} size={ms(24)} />
            )}
          </View>
          <AppText color="muted" variant="caption">
            Institute workspace
          </AppText>
          <AppText variant="subtitle" weight="bold">
            Welcome, {firstName}
          </AppText>
          <AppText color="secondary" style={styles.subtitle} variant="caption">
            You are teaching under {instituteName}. This is your educator desk —
            not the institute owner panel.
          </AppText>
        </Animated.View>

        {canSwitchToFreelancer ? (
          <Animated.View entering={FadeInUp.delay(40).duration(380)}>
            <View
              style={[
                styles.switchBanner,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}>
              <View style={styles.switchCopy}>
                <AppText variant="label">Working as {instituteName}</AppText>
                <AppText color="secondary" variant="caption">
                  Switch back to manage collaborations on your brand.
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
          </Animated.View>
        ) : null}

        <Animated.View
          entering={FadeInUp.delay(80).duration(400)}
          style={styles.cards}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: theme.colors.primaryMuted },
              ]}>
              <Shield color={theme.colors.primary} size={ms(16)} />
            </View>
            <AppText color="muted" variant="caption">
              Your role
            </AppText>
            <AppText variant="label">Verified Educator</AppText>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: theme.colors.primaryMuted },
              ]}>
              <Building2 color={theme.colors.primary} size={ms(16)} />
            </View>
            <AppText color="muted" variant="caption">
              Institute
            </AppText>
            <AppText numberOfLines={2} variant="label">
              {instituteName}
            </AppText>
          </View>
        </Animated.View>

        {examGoals ? (
          <View
            style={[
              styles.infoPanel,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText color="muted" variant="caption">
              Prep focus here
            </AppText>
            <AppText variant="body">{examGoals}</AppText>
          </View>
        ) : null}

        {membershipProfile ? (
          <View style={styles.membershipBlock}>
            <AppText variant="label">Membership</AppText>
            <AppText color="muted" variant="caption">
              Status: {membershipProfile.status}
            </AppText>
            <MembershipHrActions
              busy={hrBusy}
              profile={membershipProfile as EducatorProfileSummary}
              onCancelLeave={(leave) => {
                setCancelLeaveTarget(leave);
                setCancelKind('leave');
              }}
              onCancelResign={() => {
                setCancelLeaveTarget(null);
                setCancelKind('resign');
              }}
              onRequestLeave={handleRequestLeave}
              onRequestResign={handleRequestResign}
              onUpdateLeave={handleUpdateLeave}
            />
          </View>
        ) : null}

        <View
          style={[
            styles.infoPanel,
            {
              backgroundColor: theme.colors.primaryMuted,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.courseHead}>
            <BookOpen color={theme.colors.primary} size={ms(18)} />
            <AppText color="brand" variant="label">
              Courses & classes
            </AppText>
          </View>
          <AppText color="secondary" variant="caption">
            Institute courses for educators will appear here. For now, use My
            Course from the center tab when content is assigned.
          </AppText>
        </View>
      </Screen>

      <CollabHrRequestModal
        initialLeaveEndsAt={editingLeave?.endsAt}
        initialLeaveStartsAt={editingLeave?.startsAt}
        initialReason={editingLeave?.reason}
        instituteName={instituteName}
        isLeaveUpdate={Boolean(editingLeave)}
        isSubmitting={leaveMutation.isPending || resignMutation.isPending}
        mode={hrMode}
        onClose={() => {
          if (!leaveMutation.isPending && !resignMutation.isPending) {
            setHrOpen(false);
            setEditingLeave(null);
          }
        }}
        onSubmit={async (input) => {
          if (hrMode === 'leave') {
            await leaveMutation.mutateAsync({
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
          await resignMutation.mutateAsync({ reason: input.reason });
        }}
        visible={hrOpen}
      />

      <ConfirmModal
        Icon={Undo2}
        cancelLabel="Keep request"
        confirmLabel={cancelConfirmLabel}
        isLoading={
          cancelLeaveMutation.isPending || cancelResignMutation.isPending
        }
        message={cancelConfirmMessage}
        onCancel={() => {
          if (
            !cancelLeaveMutation.isPending &&
            !cancelResignMutation.isPending
          ) {
            setCancelKind(null);
            setCancelLeaveTarget(null);
          }
        }}
        onConfirm={handleConfirmCancel}
        title={cancelConfirmTitle}
        tone="default"
        visible={Boolean(cancelKind)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: vs(32),
    gap: ms(12),
  },
  header: {
    gap: ms(6),
    marginBottom: vs(4),
  },
  logoWrap: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(14),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: vs(4),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    maxWidth: s(320),
  },
  switchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  switchCopy: {
    flex: 1,
    minWidth: 0,
    gap: ms(2),
  },
  switchBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  cards: {
    flexDirection: 'row',
    gap: ms(10),
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    gap: ms(4),
  },
  cardIcon: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(4),
  },
  infoPanel: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(14),
    gap: ms(6),
  },
  courseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  membershipBlock: {
    gap: ms(4),
  },
});
