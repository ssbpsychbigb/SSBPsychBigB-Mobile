/**
 * You tab — Instagram-shaped own profile: username, photo + counts, name, grid.
 * Saved and the rest of the account live in the ⋯ sheet.
 */

import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, UserRound } from 'lucide-react-native';

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
import { formatCount } from '@/features/feed/lib/to-feed-card-post';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { profileApi } from '@/features/profile/api/profile.api';
import { shareMemberProfile } from '@/features/profile/components/MemberProfileTabs';
import {
  ProfileMenuSheet,
  type ProfileMenuKey,
} from '@/features/profile/components/ProfileMenuSheet';
import { ProfilePostGrid } from '@/features/profile/components/ProfilePostGrid';
import { APP_CONFIG } from '@/shared/constants/config';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen, ScreenHeader } from '@/shared/ui';

/**
 * Guest join surface or signed-in profile.
 */
export function ProfileScreen() {
  const theme = useTheme();
  const goRoot = useRootNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const openRegister = useOpenAuth('Register');
  const openLogin = useOpenAuth('Login');
  const logout = useLogout();
  const { canSwitchToFreelancer, isSwitching, switchToFreelancer } =
    useSwitchEducatorProfile();
  const activeInstitute = getActiveInstituteProfile(user);
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.fullName?.trim() || APP_CONFIG.appName;
  const initials = getUserInitials(user?.fullName);
  const photo = resolveUploadUrl(user?.profilePhotoPath || user?.officerPhotoPath);
  const showWorkspace =
    Boolean(user) && (isInstitutePanelUser(user) || isFreelancerEducator(user));

  const statsQuery = useQuery({
    queryKey: ['member-profile', user?.username ?? ''],
    enabled: Boolean(accessToken && user?.username),
    queryFn: () => profileApi.getByUsername(user!.username!, accessToken),
  });
  const stats = statsQuery.data?.stats;
  const bio = statsQuery.data?.bio?.trim();
  const city = statsQuery.data?.city?.trim() || activeInstitute?.instituteName?.trim();

  const shareSelf = () => {
    if (statsQuery.data) {
      shareMemberProfile(statsQuery.data, displayName);
      return;
    }
    if (user?.username) {
      shareMemberProfile(
        {
          id: user.id,
          username: user.username,
          fullName: displayName,
          role: user.role,
          profileUrl: `/u/${user.username}`,
        },
        displayName,
      );
    }
  };

  const onMenu = (key: ProfileMenuKey) => {
    setMenuOpen(false);
    if (key === 'saved') {
      goRoot('Bookmarks');
      return;
    }
    if (key === 'wishlist') {
      goRoot('CourseWishlist');
      return;
    }
    if (key === 'certificates') {
      goRoot('MyCertificates');
      return;
    }
    if (key === 'network') {
      goRoot('Network');
      return;
    }
    if (key === 'account') {
      goRoot('EditProfile');
      return;
    }
    if (key === 'workspace') {
      goRoot('Workspace');
      return;
    }
    if (key === 'freelancer') {
      void switchToFreelancer();
      return;
    }
    logout();
  };

  if (!accessToken) {
    return (
      <Screen contentStyle={styles.guestBody} safeBottom={false} scroll>
        <ScreenHeader padded={false}>
          <AppText variant="subtitle" weight="bold">
            Profile
          </AppText>
        </ScreenHeader>
        <View style={styles.guest}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <UserRound color="#FFFFFF" size={ms(32)} strokeWidth={2} />
          </View>
          <AppText style={styles.center} variant="subtitle" weight="bold">
            Join BIGB
          </AppText>
          <AppText color="secondary" style={styles.guestLead} variant="caption">
            Follow officers, save posts, and keep your prep in one place.
          </AppText>
        </View>
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button fullWidth onPress={openRegister} size="md">
              Join BIGB
            </Button>
          </View>
          <View style={styles.action}>
            <Button fullWidth onPress={openLogin} size="md" variant="secondary">
              Log in
            </Button>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.body} padded={false} safeBottom={false} scroll>
      <View style={styles.pad}>
        <ScreenHeader padded={false}>
          <AppText numberOfLines={1} style={styles.handle} variant="subtitle" weight="bold">
            {user?.username || displayName}
          </AppText>
          <Pressable
            accessibilityLabel="More"
            accessibilityRole="button"
            hitSlop={ms(10)}
            onPress={() => setMenuOpen(true)}
            style={styles.menuBtn}>
            <MoreHorizontal color={theme.colors.text} size={ms(24)} strokeWidth={2} />
          </Pressable>
        </ScreenHeader>

        <View style={styles.identity}>
          <Pressable
            accessibilityLabel="Edit profile photo"
            onPress={() => goRoot('EditProfile')}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImage} />
            ) : (
              <AppText color="inverse" variant="subtitle" weight="bold">
                {initials}
              </AppText>
            )}
          </Pressable>

          <View style={styles.stats}>
            <Stat label="Posts" value={stats?.posts} />
            <Stat
              label="Followers"
              onPress={
                user?.username
                  ? () =>
                      goRoot('MemberNetwork', {
                        username: user.username!,
                        name: displayName,
                        kind: 'followers',
                      })
                  : undefined
              }
              value={stats?.followers}
            />
            <Stat
              label="Following"
              onPress={
                user?.username
                  ? () =>
                      goRoot('MemberNetwork', {
                        username: user.username!,
                        name: displayName,
                        kind: 'following',
                      })
                  : undefined
              }
              value={stats?.following}
            />
          </View>
        </View>

        <AppText numberOfLines={1} variant="label">
          {displayName}
        </AppText>
        {bio ? (
          <AppText numberOfLines={3} style={styles.bio} variant="caption">
            {bio}
          </AppText>
        ) : null}
        {city ? (
          <AppText color="muted" numberOfLines={1} variant="caption">
            {city}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <Pill
            label="Edit profile"
            onPress={() => goRoot('EditProfile')}
            tone={theme.mode === 'dark' ? theme.colors.surface : theme.palette.neutral[100]}
            text={theme.colors.text}
          />
          <Pill
            label="Share profile"
            onPress={shareSelf}
            tone={theme.mode === 'dark' ? theme.colors.surface : theme.palette.neutral[100]}
            text={theme.colors.text}
          />
        </View>
      </View>

      {user?.username ? <ProfilePostGrid username={user.username} /> : null}

      <ProfileMenuSheet
        freelancerBusy={isSwitching}
        onClose={() => setMenuOpen(false)}
        onSelect={onMenu}
        showFreelancer={canSwitchToFreelancer}
        showWorkspace={showWorkspace}
        visible={menuOpen}
      />
    </Screen>
  );
}

function Stat({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={styles.stat}>
      <AppText variant="subtitle" weight="bold">
        {value == null ? '—' : formatCount(value)}
      </AppText>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

function Pill({
  label,
  onPress,
  tone,
  text,
}: {
  label: string;
  onPress: () => void;
  tone: string;
  text: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: tone, opacity: pressed ? 0.82 : 1 },
      ]}>
      <AppText style={{ color: text }} variant="caption" weight="semibold">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingBottom: vs(8),
  },
  guestBody: {
    paddingBottom: vs(24),
  },
  pad: {
    paddingHorizontal: s(16),
  },
  handle: {
    flex: 1,
    marginRight: s(12),
  },
  menuBtn: {
    width: ms(36),
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(18),
    marginTop: vs(4),
    marginBottom: vs(12),
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: vs(1),
  },
  bio: {
    marginTop: vs(2),
  },
  avatar: {
    width: ms(86),
    height: ms(86),
    borderRadius: ms(43),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  guest: {
    alignItems: 'center',
    gap: vs(6),
    marginBottom: vs(20),
    marginTop: vs(24),
  },
  center: {
    textAlign: 'center',
  },
  guestLead: {
    textAlign: 'center',
    maxWidth: s(280),
  },
  actions: {
    flexDirection: 'row',
    gap: s(8),
    marginTop: vs(14),
    marginBottom: vs(4),
  },
  action: {
    flex: 1,
  },
  pill: {
    flex: 1,
    height: ms(34),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
