/**
 * Profile tab — guest join, account summary, workspace, session controls.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Bell,
  Bookmark,
  Briefcase,
  Hash,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  UserRound,
  Users,
} from 'lucide-react-native';

import { useAppTabs } from '@/app/navigation/AppTabsContext';
import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import {
  getActiveInstituteProfile,
  isFreelancerEducator,
  isInstitutePanelUser,
  useAuthStore,
  useLogout,
  useOpenAuth,
  useSwitchEducatorProfile,
} from '@/features/auth';
import { getRoleLabel } from '@/features/home/lib/role-label';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { requireMemberProfileParams } from '@/features/profile/lib/require-member-profile';
import { APP_CONFIG } from '@/shared/constants/config';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen, ScreenHeader } from '@/shared/ui';

/**
 * Guest join surface or signed-in profile overview.
 */
export function ProfileScreen() {
  const theme = useTheme();
  const goRoot = useRootNavigate();
  const { jumpTo } = useAppTabs();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const openRegister = useOpenAuth('Register');
  const openLogin = useOpenAuth('Login');
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
  const showWorkspace =
    Boolean(user) &&
    (isInstitutePanelUser(user) || isFreelancerEducator(user));

  if (!accessToken) {
    return (
      <Screen contentStyle={styles.content} safeBottom={false} scroll>
        <ScreenHeader padded={false}>
          <AppText variant="subtitle" weight="bold">
            Profile
          </AppText>
        </ScreenHeader>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          <View
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <UserRound color="#FFFFFF" size={ms(32)} strokeWidth={2} />
          </View>
          <AppText style={styles.name} variant="subtitle" weight="bold">
            You
          </AppText>
          <AppText color="secondary" style={styles.guestLead} variant="body">
            Join BIGB to follow officers, save posts, message mentors, and keep
            your prep in one place. Public Reels are on the Reels tab. Network
            and Community are open to browse now.
          </AppText>
        </Animated.View>
        <View style={styles.section}>
          <AppText color="muted" style={styles.sectionLabel} variant="caption">
            Browse public
          </AppText>
          <View style={styles.discoverGrid}>
            <DiscoverTile
              icon={<Users color={theme.colors.primary} size={ms(18)} />}
              label="Network"
              onPress={() => goRoot('Network')}
            />
            <DiscoverTile
              icon={<Hash color={theme.colors.primary} size={ms(18)} />}
              label="Community"
              onPress={() => jumpTo('communities')}
            />
            <DiscoverTile
              icon={<MessageCircle color={theme.colors.primary} size={ms(18)} />}
              label="Messages"
              onPress={() => goRoot('Messages')}
            />
          </View>
        </View>
        <View style={styles.footer}>
          <Button fullWidth onPress={openRegister}>
            Join BIGB
          </Button>
          <Button fullWidth onPress={openLogin} variant="secondary">
            Log in
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content} safeBottom={false} scroll>
      <ScreenHeader padded={false}>
        <AppText variant="subtitle" weight="bold">
          You
        </AppText>
      </ScreenHeader>
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
        {user?.username ? (
          <Pressable
            onPress={() => {
              const params = requireMemberProfileParams(user.username, user.fullName);
              if (params) {
                goRoot('MemberProfile', params);
              }
            }}
            style={styles.publicLink}>
            <AppText color="brand" variant="caption" weight="semibold">
              View public profile
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>

      <View style={styles.section}>
        <AppText color="muted" style={styles.sectionLabel} variant="caption">
          Discover
        </AppText>
        <View style={styles.discoverGrid}>
          <DiscoverTile
            icon={<Bookmark color={theme.colors.primary} size={ms(18)} />}
            label="Saved"
            onPress={() => goRoot('Bookmarks')}
          />
          <DiscoverTile
            icon={<Users color={theme.colors.primary} size={ms(18)} />}
            label="Network"
            onPress={() => goRoot('Network')}
          />
          <DiscoverTile
            icon={<Hash color={theme.colors.primary} size={ms(18)} />}
            label="Community"
            onPress={() => jumpTo('communities')}
          />
          <DiscoverTile
            icon={<MessageCircle color={theme.colors.primary} size={ms(18)} />}
            label="Messages"
            onPress={() => goRoot('Messages')}
          />
          <DiscoverTile
            icon={<Bell color={theme.colors.primary} size={ms(18)} />}
            label="Alerts"
            onPress={() => goRoot('Notifications')}
          />
        </View>
      </View>

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
        {showWorkspace ? (
          <Button
            fullWidth
            onPress={() => goRoot('Workspace')}
            variant="secondary">
            <View style={styles.logoutRow}>
              <Briefcase color={theme.colors.text} size={ms(18)} />
              <AppText variant="label">Open workspace</AppText>
            </View>
          </Button>
        ) : null}
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

type DiscoverTileProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
};

function DiscoverTile({ icon, label, onPress }: DiscoverTileProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      {icon}
      <AppText variant="caption" weight="semibold">
        {label}
      </AppText>
    </Pressable>
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
    marginTop: 0,
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
  guestLead: {
    textAlign: 'center',
    maxWidth: s(300),
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
  publicLink: {
    marginTop: vs(8),
  },
  section: {
    marginBottom: vs(24),
  },
  sectionLabel: {
    marginBottom: vs(8),
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
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
