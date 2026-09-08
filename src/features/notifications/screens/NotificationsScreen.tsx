/**
 * Notifications inbox — members see alerts; guests get an in-page join card.
 */

import { StyleSheet, View } from 'react-native';
import { Bell } from 'lucide-react-native';

import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { NOTIFICATIONS_PREVIEW } from '@/features/notifications/data/notifications-preview';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, SocialStackChrome } from '@/shared/ui';

/**
 * Social + community alerts.
 */
export function NotificationsScreen() {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);
  const openRegister = useOpenAuth('Register');
  const openLogin = useOpenAuth('Login');

  if (!accessToken) {
    return (
      <SocialStackChrome subtitle="Follows, comments, and circles" title="Alerts">
        <View
          style={[
            styles.guestCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <View
            style={[styles.guestIcon, { backgroundColor: theme.colors.primaryMuted }]}>
            <Bell color={theme.colors.primary} size={ms(28)} />
          </View>
          <AppText style={styles.center} variant="subtitle" weight="bold">
            Stay in the loop
          </AppText>
          <AppText color="secondary" style={styles.center} variant="body">
            Follows, comments, and community announcements land here after you
            join.
          </AppText>
          <Button fullWidth onPress={openRegister}>
            Join BIGB
          </Button>
          <Button fullWidth onPress={openLogin} variant="secondary">
            Log in
          </Button>
        </View>
      </SocialStackChrome>
    );
  }

  return (
    <SocialStackChrome subtitle="Follows, comments, and circles" title="Alerts">
      {NOTIFICATIONS_PREVIEW.map((row) => (
        <View
          key={row.id}
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          {row.unread ? (
            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
          ) : (
            <View style={styles.dotSpacer} />
          )}
          <View style={styles.copy}>
            <AppText variant="label">{row.title}</AppText>
            <AppText color="secondary" variant="caption">
              {row.body}
            </AppText>
          </View>
          <AppText color="muted" variant="caption">
            {row.time}
          </AppText>
        </View>
      ))}
    </SocialStackChrome>
  );
}

const styles = StyleSheet.create({
  guestCard: {
    borderWidth: 1,
    borderRadius: ms(20),
    padding: ms(20),
    alignItems: 'center',
    gap: ms(10),
  },
  guestIcon: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(4),
  },
  center: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: ms(16),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    marginBottom: vs(10),
    gap: ms(10),
  },
  dot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    marginTop: vs(6),
  },
  dotSpacer: {
    width: ms(8),
  },
  copy: {
    flex: 1,
    gap: ms(4),
  },
});
