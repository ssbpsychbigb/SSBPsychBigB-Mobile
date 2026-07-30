/**
 * Profile tab — account summary, profile switch, and session controls.
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LogOut, Mail, Phone, Shield, UserRound } from 'lucide-react-native';

import {
  getActiveInstituteProfile,
  useAuthStore,
  useLogout,
  useSwitchEducatorProfile,
} from '@/features/auth';
import { getRoleLabel } from '@/features/home/lib/role-label';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { APP_CONFIG } from '@/shared/constants/config';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen } from '@/shared/ui';

/**
 * Signed-in profile overview with sign-out.
 */
export function ProfileScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const {
    canSwitchToFreelancer,
    isSwitching,
    switchToFreelancer,
  } = useSwitchEducatorProfile();
  const activeInstitute = getActiveInstituteProfile(user);

  const displayName = user?.fullName?.trim() || APP_CONFIG.appName;
  const initials = getUserInitials(user?.fullName);
  const examGoal = user?.examGoal || user?.examGoals?.join(', ');

  return (
    <Screen contentStyle={styles.content} safeBottom={false} scroll>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
        <View
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <AppText color="inverse" variant="subtitle" weight="bold">
            {initials}
          </AppText>
        </View>
        <AppText style={styles.name} variant="subtitle" weight="bold">
          {displayName}
        </AppText>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: theme.colors.primaryMuted },
          ]}>
          <Shield color={theme.colors.primary} size={ms(14)} />
          <AppText color="brand" variant="caption">
            {getRoleLabel(user?.role)}
            {user?.accountStatus === 'active' ? ' · Active' : ''}
          </AppText>
        </View>
        {activeInstitute ? (
          <AppText color="secondary" style={styles.contextHint} variant="caption">
            Currently in {activeInstitute.instituteName || 'institute'} mode
          </AppText>
        ) : null}
      </Animated.View>

      <View style={styles.section}>
        <AppText color="muted" style={styles.sectionLabel} variant="caption">
          Account
        </AppText>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.row}>
            <Phone color={theme.colors.textMuted} size={ms(18)} />
            <View style={styles.rowCopy}>
              <AppText color="muted" variant="caption">
                Mobile
              </AppText>
              <AppText variant="body">
                {user?.mobileNumber || '—'}
              </AppText>
            </View>
          </View>
          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />
          <View style={styles.row}>
            <Mail color={theme.colors.textMuted} size={ms(18)} />
            <View style={styles.rowCopy}>
              <AppText color="muted" variant="caption">
                Email
              </AppText>
              <AppText variant="body">{user?.email || '—'}</AppText>
            </View>
          </View>
          {examGoal ? (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <View style={styles.row}>
                <Shield color={theme.colors.textMuted} size={ms(18)} />
                <View style={styles.rowCopy}>
                  <AppText color="muted" variant="caption">
                    Exam focus
                  </AppText>
                  <AppText variant="body">{examGoal}</AppText>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        {canSwitchToFreelancer ? (
          <Button
            fullWidth
            loading={isSwitching}
            onPress={() => {
              void switchToFreelancer();
            }}
            variant="secondary">
            <View style={styles.logoutRow}>
              <UserRound color={theme.colors.text} size={ms(18)} />
              <AppText variant="label">Switch to Freelancer</AppText>
            </View>
          </Button>
        ) : null}
        <Button fullWidth onPress={logout} variant="secondary">
          <View style={styles.logoutRow}>
            <LogOut color={theme.colors.text} size={ms(18)} />
            <AppText variant="label">Sign out</AppText>
          </View>
        </Button>
        <AppText color="muted" style={styles.version} variant="caption">
          {APP_CONFIG.appName} · v{APP_CONFIG.appVersion}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: vs(28),
  },
  hero: {
    alignItems: 'center',
    gap: ms(10),
    marginBottom: vs(28),
    marginTop: vs(8),
  },
  avatar: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(4),
  },
  name: {
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: ms(999),
  },
  contextHint: {
    textAlign: 'center',
  },
  section: {
    marginBottom: vs(24),
  },
  sectionLabel: {
    marginBottom: vs(8),
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  panel: {
    borderWidth: 1,
    borderRadius: ms(16),
    paddingHorizontal: s(16),
    paddingVertical: vs(4),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingVertical: vs(14),
  },
  rowCopy: {
    flex: 1,
    gap: ms(2),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: s(30),
  },
  footer: {
    marginTop: 'auto',
    gap: ms(12),
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  version: {
    textAlign: 'center',
  },
});
