/**
 * Locked screen for restricted accounts.
 */

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ban, RefreshCw } from 'lucide-react-native';

import { useLogout } from '@/features/auth/hooks/useLogout';
import { useRefreshAuthSession } from '@/features/auth/hooks/useRefreshAuthSession';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { APP_CONFIG } from '@/shared/constants/config';
import { ms, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen } from '@/shared/ui';

/**
 * Shown when accountStatus is restricted.
 */
export function RestrictedAccessScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const { refreshing, refreshSession } = useRefreshAuthSession();

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
          { backgroundColor: theme.palette.warning[50] },
        ]}>
        <Ban color={theme.colors.warning} size={ms(32)} />
      </View>
      <AppText color="brand" style={styles.brand} variant="title">
        {APP_CONFIG.appName}
      </AppText>
      <AppText style={styles.heading} variant="subtitle">
        Account restricted
      </AppText>
      <AppText color="secondary" style={styles.copy} variant="body">
        Access for {user?.fullName || 'this account'} is temporarily limited.
        Contact BIGB support if you believe this is a mistake.
      </AppText>
      <AppText color="muted" style={styles.hint} variant="caption">
        Pull down or tap refresh to check for updates.
      </AppText>
      <Button fullWidth onPress={logout} variant="secondary">
        Sign out
      </Button>
    </Screen>
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
    marginBottom: vs(8),
  },
});
