/**
 * Pending verification lock screen for institute / officer / educator.
 */

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Clock3, RefreshCw } from 'lucide-react-native';

import { useLogout } from '@/features/auth/hooks/useLogout';
import { useRefreshAuthSession } from '@/features/auth/hooks/useRefreshAuthSession';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { labelRejectionFields } from '@/features/auth/lib/rejection-fields';
import { APP_CONFIG } from '@/shared/constants/config';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen } from '@/shared/ui';

function formatWhen(value?: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Shown when accountStatus is pending_verification.
 */
export function UnderReviewScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const { refreshing, refreshSession } = useRefreshAuthSession();

  const roleLabel =
    user?.role === 'institute'
      ? 'institute application'
      : user?.role === 'defence_officer'
        ? 'defence officer application'
        : user?.role === 'educator'
          ? 'educator application'
          : 'application';

  const isResubmitted = Boolean(user?.resubmittedAt);
  const updatedFields = labelRejectionFields(user?.previousRejectedFields);
  const resubmittedWhen = formatWhen(user?.resubmittedAt);

  return (
    <Screen
      contentStyle={styles.content}
      onRefresh={refreshSession}
      refreshing={refreshing}
      scroll>
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Pressable
          accessibilityLabel="Refresh status"
          accessibilityRole="button"
          disabled={refreshing}
          hitSlop={ms(10)}
          onPress={() => {
            void refreshSession();
          }}
          style={({ pressed }) => [
            styles.refreshBtn,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              opacity: refreshing ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}>
          {refreshing ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <RefreshCw color={theme.colors.primary} size={ms(18)} strokeWidth={2.2} />
          )}
        </Pressable>
      </View>

      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors.primaryMuted },
        ]}>
        <Clock3 color={theme.colors.primary} size={ms(32)} />
      </View>

      <AppText color="brand" style={styles.brand} variant="title">
        {APP_CONFIG.appName}
      </AppText>
      <AppText style={styles.heading} variant="subtitle">
        Under review
      </AppText>
      <AppText color="secondary" style={styles.copy} variant="body">
        {isResubmitted
          ? `Your updated ${roleLabel} has been received and is awaiting verification. Access remains limited until approval.`
          : `Your ${roleLabel} is being verified by the BIGB team. Access remains limited until approval.`}
      </AppText>
      <AppText color="muted" style={styles.hint} variant="caption">
        Pull down or tap refresh to check for updates.
      </AppText>

      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <InfoRow label="Name" value={user?.fullName || '—'} />
        <InfoRow label="Mobile" value={user?.mobileNumber || '—'} />
        <InfoRow
          label="Status"
          value={
            isResubmitted ? 'Pending re-verification' : 'Pending verification'
          }
        />
        {isResubmitted && resubmittedWhen ? (
          <InfoRow label="Last update" value={resubmittedWhen} />
        ) : null}
        {isResubmitted && updatedFields.length > 0 ? (
          <InfoRow label="Updated fields" value={updatedFields.join(', ')} />
        ) : null}
        {isResubmitted && user?.previousRejectionReason ? (
          <InfoRow
            label="Previous review note"
            value={user.previousRejectionReason}
          />
        ) : null}
      </View>

      <Button fullWidth onPress={logout} variant="secondary">
        Sign out
      </Button>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: vs(8),
    paddingBottom: vs(40),
    gap: ms(12),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: ms(40),
  },
  topBarSpacer: {
    flex: 1,
  },
  refreshBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: vs(8),
  },
  brand: {
    textAlign: 'center',
    letterSpacing: 1,
  },
  heading: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    marginBottom: vs(4),
  },
  panel: {
    borderWidth: 1,
    borderRadius: ms(16),
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
    gap: ms(14),
    marginBottom: vs(16),
  },
  infoRow: {
    gap: ms(2),
  },
});
