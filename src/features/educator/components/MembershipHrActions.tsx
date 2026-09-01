/**
 * Leave / resign status cards + HR action controls for one membership.
 */

import { StyleSheet, View } from 'react-native';

import type {
  EducatorProfileSummary,
  LeaveRequestSummary,
} from '@/features/auth/types/auth.types';
import { formatDisplayDate } from '@/shared/ui/AppDateField';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

/**
 * Formats API date (YYYY-MM-DD or ISO) for membership details.
 */
export function formatMembershipDay(value?: string): string {
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

function leaveRangeLabel(startsAt?: string, endsAt?: string): string {
  if (startsAt && endsAt) {
    return `${formatMembershipDay(startsAt)} → ${formatMembershipDay(endsAt)}`;
  }
  return formatMembershipDay(startsAt) || formatMembershipDay(endsAt);
}

/**
 * Resolves pending / approved leave rows (API array or legacy scalars).
 */
export function resolveVisibleLeaveRequests(
  profile: EducatorProfileSummary,
): { pending: LeaveRequestSummary[]; approved: LeaveRequestSummary[] } {
  const rows = Array.isArray(profile.leaveRequests)
    ? profile.leaveRequests.filter((row) => row?.id)
    : [];

  if (rows.length > 0) {
    return {
      pending: rows.filter((row) => row.status === 'pending'),
      approved: rows.filter((row) => row.status === 'approved'),
    };
  }

  // * Legacy single-slot leave fields before leaveRequests migration.
  if (profile.status === 'leave_pending' && (profile.leaveStartsAt || profile.leaveReason)) {
    return {
      pending: [
        {
          id: 'legacy-pending',
          reason: profile.leaveReason,
          startsAt: profile.leaveStartsAt,
          endsAt: profile.leaveEndsAt,
          requestedAt: profile.leaveRequestedAt,
          status: 'pending',
        },
      ],
      approved: [],
    };
  }

  if (profile.status === 'on_leave' && (profile.leaveStartsAt || profile.leaveReason)) {
    return {
      pending: [],
      approved: [
        {
          id: 'legacy-approved',
          reason: profile.leaveReason,
          startsAt: profile.leaveStartsAt,
          endsAt: profile.leaveEndsAt,
          requestedAt: profile.leaveRequestedAt,
          status: 'approved',
        },
      ],
    };
  }

  return { pending: [], approved: [] };
}

export type MembershipHrActionsProps = {
  profile: EducatorProfileSummary;
  busy: boolean;
  onRequestLeave: () => void;
  onUpdateLeave: (leaveRequest: LeaveRequestSummary) => void;
  onRequestResign: () => void;
  onCancelLeave: (leaveRequest: LeaveRequestSummary) => void;
  onCancelResign: () => void;
};

/**
 * Leave status cards (one per request) + separate request actions.
 * Fresh leave = new request; Update only on pending items.
 */
export function MembershipHrActions({
  profile,
  busy,
  onRequestLeave,
  onUpdateLeave,
  onRequestResign,
  onCancelLeave,
  onCancelResign,
}: MembershipHrActionsProps) {
  const theme = useTheme();
  const { pending, approved } = resolveVisibleLeaveRequests(profile);

  const showResignPending = profile.status === 'resign_pending';
  const showNotice = profile.status === 'notice_period';

  const canRequestLeave =
    profile.status === 'active' ||
    profile.status === 'leave_pending' ||
    profile.status === 'on_leave';
  const canRequestResign =
    profile.status === 'active' ||
    profile.status === 'on_leave' ||
    profile.status === 'leave_pending';
  const showActionsCard =
    canRequestLeave ||
    canRequestResign ||
    pending.length > 0 ||
    showResignPending ||
    showNotice;

  return (
    <View style={styles.root}>
      {pending.map((leave) => {
        const range = leaveRangeLabel(leave.startsAt, leave.endsAt);
        return (
          <View
            key={`pending-${leave.id}`}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText variant="label">Pending leave request</AppText>
            <AppText color="muted" variant="caption">
              Waiting for institute review
            </AppText>
            {range ? <DetailRow label="Dates" value={range} /> : null}
            {leave.reason ? <DetailRow label="Reason" value={leave.reason} /> : null}
            <View style={styles.row}>
              <Button
                disabled={busy}
                onPress={() => onUpdateLeave(leave)}
                size="sm"
                style={styles.btn}
                variant="secondary">
                Update leave
              </Button>
              <Button
                disabled={busy}
                onPress={() => onCancelLeave(leave)}
                size="sm"
                style={styles.btn}
                variant="secondary">
                Cancel
              </Button>
            </View>
          </View>
        );
      })}

      {approved.map((leave) => {
        const range = leaveRangeLabel(leave.startsAt, leave.endsAt);
        return (
          <View
            key={`approved-${leave.id}`}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.primaryMuted,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText color="brand" variant="label">
              Approved leave
            </AppText>
            <AppText color="secondary" variant="caption">
              {leave.endsAt
                ? `Leave until ${formatMembershipDay(leave.endsAt)}`
                : 'Approved leave'}
            </AppText>
            {range ? <DetailRow label="Dates" value={range} /> : null}
            {leave.reason ? <DetailRow label="Reason" value={leave.reason} /> : null}
          </View>
        );
      })}

      {showResignPending ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <AppText variant="label">Pending resign request</AppText>
          <AppText color="muted" variant="caption">
            Waiting for institute review
          </AppText>
          {profile.resignReason ? (
            <DetailRow label="Reason" value={profile.resignReason} />
          ) : null}
        </View>
      ) : null}

      {showNotice ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <AppText variant="label">Notice period</AppText>
          <AppText color="secondary" variant="caption">
            {profile.noticeEndsAt
              ? `Ends ${formatMembershipDay(profile.noticeEndsAt)}`
              : 'Serving notice — contact the institute if needed.'}
          </AppText>
        </View>
      ) : null}

      {showActionsCard ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <AppText variant="label">Leave & resign</AppText>
          <AppText color="muted" style={styles.actionsHint} variant="caption">
            Each leave is a separate request. Update only applies to pending
            ones. Resign is separate.
          </AppText>

          <View style={styles.row}>
            {canRequestLeave ? (
              <Button
                disabled={busy}
                onPress={onRequestLeave}
                size="sm"
                style={styles.btn}
                variant="secondary">
                Request leave
              </Button>
            ) : null}

            {canRequestResign ? (
              <Button
                disabled={busy}
                onPress={onRequestResign}
                size="sm"
                style={styles.btn}
                variant="danger">
                Request resign
              </Button>
            ) : null}

            {showResignPending ? (
              <Button
                disabled={busy}
                onPress={onCancelResign}
                size="sm"
                style={styles.btn}
                variant="secondary">
                Cancel resign request
              </Button>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText color="muted" style={styles.detailLabel} variant="caption">
        {label}
      </AppText>
      <AppText style={styles.detailValue} variant="caption" weight="medium">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: ms(10),
    marginTop: vs(4),
  },
  card: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    gap: ms(6),
  },
  actionsHint: {
    marginBottom: vs(2),
  },
  detailRow: {
    gap: ms(2),
    marginTop: vs(2),
  },
  detailLabel: {
    fontSize: fontSize(11),
    lineHeight: lineHeight(11, 1.2),
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.4),
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
    marginTop: vs(4),
  },
  btn: {
    flexGrow: 1,
    minWidth: '45%',
  },
});
