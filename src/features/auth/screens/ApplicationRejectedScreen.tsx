/**
 * Rejected application lock screen with path to resubmit (Phase 2 form).
 */

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { CircleAlert, RefreshCw } from 'lucide-react-native';

import { useLogout } from '@/features/auth/hooks/useLogout';
import { useRefreshAuthSession } from '@/features/auth/hooks/useRefreshAuthSession';
import {
  canResubmitApplication,
  type PostAuthDestination,
} from '@/features/auth/lib/auth-routing';
import {
  labelRejectionFields,
  REJECTION_FIELDS_BY_ROLE,
  type RejectionRole,
} from '@/features/auth/lib/rejection-fields';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { APP_CONFIG } from '@/shared/constants/config';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen } from '@/shared/ui';

export type ApplicationRejectedScreenProps = {
  onResubmit?: () => void;
};

/**
 * Locked landing for rejected verification applications.
 */
export function ApplicationRejectedScreen({
  onResubmit,
}: ApplicationRejectedScreenProps) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const { refreshing, refreshSession } = useRefreshAuthSession();

  const fieldLabels = labelRejectionFields(user?.rejectedFields);
  const canResubmit = canResubmitApplication(user);

  const displayFields =
    fieldLabels.length > 0
      ? fieldLabels
      : user?.role === 'institute' ||
          user?.role === 'defence_officer' ||
          user?.role === 'educator'
        ? labelRejectionFields(
            REJECTION_FIELDS_BY_ROLE[user.role as RejectionRole],
          )
        : [];

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
          { backgroundColor: theme.palette.danger[50] },
        ]}>
        <CircleAlert color={theme.colors.danger} size={ms(32)} />
      </View>

      <AppText color="brand" style={styles.brand} variant="title">
        {APP_CONFIG.appName}
      </AppText>
      <AppText style={styles.heading} variant="subtitle">
        Application not approved
      </AppText>
      <AppText color="secondary" style={styles.copy} variant="body">
        Your application was reviewed and could not be approved. Fix the flagged
        details below and resubmit for verification.
      </AppText>

      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <AppText color="muted" variant="caption">
          Name
        </AppText>
        <AppText style={styles.value} variant="body">
          {user?.fullName || '—'}
        </AppText>

        {displayFields.length > 0 ? (
          <View style={styles.fieldsBlock}>
            <AppText color="muted" variant="caption">
              Fields to fix
            </AppText>
            <View style={styles.chips}>
              {displayFields.map((label) => (
                <View
                  key={label}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.palette.danger[50] },
                  ]}>
                  <AppText
                    style={{ color: theme.colors.danger }}
                    variant="caption">
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <AppText color="muted" style={styles.messageLabel} variant="caption">
          Message
        </AppText>
        <AppText variant="body">
          {user?.rejectionReason || 'No reason provided'}
        </AppText>
      </View>

      <View style={styles.actions}>
        {canResubmit && onResubmit ? (
          <Button fullWidth onPress={onResubmit}>
            Fix & resubmit
          </Button>
        ) : null}
        <Button fullWidth onPress={logout} variant="secondary">
          Sign out
        </Button>
      </View>
    </Screen>
  );
}

/** Helps keep destination typing local to navigation consumers. */
export type RejectedFlowDestination = Extract<
  PostAuthDestination,
  'applicationRejected'
>;

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
    marginBottom: vs(8),
  },
  panel: {
    borderWidth: 1,
    borderRadius: ms(16),
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
    marginBottom: vs(8),
  },
  value: {
    marginBottom: vs(12),
  },
  fieldsBlock: {
    marginBottom: vs(12),
    gap: ms(8),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
  },
  chip: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(8),
  },
  messageLabel: {
    marginBottom: vs(4),
  },
  actions: {
    gap: ms(10),
    marginTop: vs(8),
  },
});
