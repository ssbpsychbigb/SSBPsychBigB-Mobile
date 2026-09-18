/**
 * Public member profile — `/profile/:username`, same contract as web `/u/:username`.
 */

import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Award, MessageCircle, Share2 } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { feedApi } from '@/features/feed/api/feed.api';
import { chatApi } from '@/features/message/api/chat.api';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { followCtaLabel, roleHeadline } from '@/features/network/lib/network-display';
import { formatCount } from '@/features/feed/lib/to-feed-card-post';
import {
  MemberProfileTabs,
  shareMemberProfile,
} from '@/features/profile/components/MemberProfileTabs';
import { profileApi } from '@/features/profile/api/profile.api';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Screen, ScreenHeader, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'MemberProfile'>;

/**
 * Opens from chat header name tap — web View profile equivalent.
 */
export function MemberProfileScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);
  const selfId = useAuthStore((state) => state.user?.id);
  const { username, name } = route.params;
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinKind, setJoinKind] = useState<'follow' | 'message'>('follow');

  const profileQuery = useQuery({
    queryKey: ['member-profile', username],
    queryFn: () => profileApi.getByUsername(username, token),
  });

  const profile = profileQuery.data;
  const displayName = profile?.fullName || name || username;
  const following = Boolean(profile?.stats?.followingAuthor);
  const followsYou = Boolean(profile?.stats?.followsYou);
  const photo = resolveUploadUrl(
    profile?.profilePhotoPath ||
      profile?.officerPhotoPath ||
      profile?.instituteLogoPath,
  );
  const cover = resolveUploadUrl(profile?.coverPhotoPath);
  const badges = profile?.badges ?? [];
  const verified = (profile?.verificationLevel ?? 0) >= 2;
  const headline = roleHeadline(
    profile?.role || 'aspirant',
    profile?.examGoal,
    profile?.instituteName,
  );

  const messageMutation = useMutation({
    mutationFn: () =>
      chatApi.createConversation({
        token: token as string,
        peerUserId: profile?.id,
      }),
    onSuccess: (conversation) => {
      navigation.navigate('ChatThread', {
        conversationId: conversation.id,
        name: displayName,
        username: profile?.username,
      });
    },
    onError: (error) => {
      showErrorToast(error, 'Could not start this chat.', 'Profile');
    },
  });

  const followMutation = useMutation({
    mutationFn: () => feedApi.toggleFollow(profile?.id as string, token as string),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['member-profile', username] });
      showToast.success(result.following ? 'Following' : 'Unfollowed');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not update follow.', 'Profile');
    },
  });

  return (
    <Screen contentStyle={styles.shell} padded={false} scroll>
      <ScreenHeader>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={ms(10)}
          onPress={() => navigation.goBack()}
          style={[
            styles.back,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <ArrowLeft color={theme.colors.text} size={ms(20)} strokeWidth={2} />
        </Pressable>
        <AppText numberOfLines={1} style={styles.title} variant="subtitle" weight="bold">
          {displayName}
        </AppText>
        {profile ? (
          <Pressable
            accessibilityLabel="Share profile"
            accessibilityRole="button"
            hitSlop={ms(8)}
            onPress={() => shareMemberProfile(profile, displayName)}
            style={styles.shareBtn}>
            <Share2 color={theme.colors.text} size={ms(20)} strokeWidth={2} />
          </Pressable>
        ) : null}
      </ScreenHeader>

      {profileQuery.isPending ? (
        <Spinner />
      ) : profileQuery.isError || !profile ? (
        <View style={styles.empty}>
          <AppText variant="label" weight="semibold">
            Could not load this profile
          </AppText>
          <Pressable onPress={() => void profileQuery.refetch()}>
            <AppText color="brand" variant="caption" weight="semibold">
              Retry
            </AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          <View
            style={[
              styles.cover,
              { backgroundColor: theme.colors.primary },
            ]}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.coverImage} />
            ) : null}
          </View>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.background,
              },
            ]}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImage} />
            ) : (
              <AppText color="inverse" style={styles.initials} weight="bold">
                {getUserInitials(displayName)}
              </AppText>
            )}
          </View>
          <AppText style={styles.name} variant="title" weight="bold">
            {displayName}
          </AppText>
          <AppText color="muted" style={styles.headline}>
            @{profile.username}
            {profile.city ? ` · ${profile.city}` : ''}
            {profile.education ? ` · ${profile.education}` : ''}
          </AppText>
          {badges.length > 0 ? (
            <View style={styles.badges}>
              {badges.slice(0, 4).map((badge) => (
                <View
                  key={badge.code}
                  style={[styles.badge, { backgroundColor: theme.colors.primaryMuted }]}>
                  <Award color={theme.colors.primary} size={ms(12)} strokeWidth={2} />
                  <AppText color="brand" variant="caption" weight="semibold">
                    {badge.label}
                  </AppText>
                </View>
              ))}
            </View>
          ) : verified ? (
            <AppText color="brand" variant="caption" weight="semibold">
              Verified on BIGB
            </AppText>
          ) : null}
          <AppText color="secondary" style={styles.headline} variant="caption">
            {headline}
          </AppText>
          {profile.sectionVisible?.bio === false ? (
            <AppText color="muted" style={styles.bio} variant="caption">
              Bio is visible to a smaller audience.
            </AppText>
          ) : profile.bio ? (
            <AppText style={styles.bio} variant="body">
              {profile.bio}
            </AppText>
          ) : null}

          <View style={styles.stats}>
            <Stat
              label="Followers"
              onPress={() =>
                navigation.navigate('MemberNetwork', {
                  username: profile.username,
                  name: displayName,
                  kind: 'followers',
                })
              }
              value={formatCount(profile.stats?.followers ?? 0)}
            />
            <Stat
              label="Following"
              onPress={() =>
                navigation.navigate('MemberNetwork', {
                  username: profile.username,
                  name: displayName,
                  kind: 'following',
                })
              }
              value={formatCount(profile.stats?.following ?? 0)}
            />
            <Stat label="Posts" value={formatCount(profile.stats?.posts ?? 0)} />
          </View>

          {followsYou && following ? (
            <Pressable
              onPress={() =>
                navigation.navigate('MemberNetwork', {
                  username: profile.username,
                  name: displayName,
                  kind: 'mutual',
                })
              }>
              <AppText color="brand" variant="caption" weight="semibold">
                Mutual
              </AppText>
            </Pressable>
          ) : followsYou && !following ? (
            <AppText color="brand" variant="caption" weight="semibold">
              Follows you
            </AppText>
          ) : null}

          {profile.id && profile.id !== selfId ? (
            <View style={styles.ctaRow}>
            <Pressable
              disabled={followMutation.isPending}
              onPress={() => {
                if (!token) {
                  setJoinKind('follow');
                  setJoinOpen(true);
                  return;
                }
                followMutation.mutate();
              }}
              style={[
                styles.followBtn,
                {
                  backgroundColor: following
                    ? theme.colors.surface
                    : theme.colors.primary,
                  borderColor: theme.colors.border,
                  borderWidth: following ? 1 : 0,
                },
              ]}>
              <AppText
                color={following ? 'brand' : 'inverse'}
                variant="label"
                weight="semibold">
                {followCtaLabel(following, followsYou)}
              </AppText>
            </Pressable>
            <Pressable
              disabled={messageMutation.isPending}
              onPress={() => {
                if (!token) {
                  setJoinKind('message');
                  setJoinOpen(true);
                  return;
                }
                messageMutation.mutate();
              }}
              style={[
                styles.messageBtn,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}>
              <MessageCircle color={theme.colors.primary} size={ms(18)} strokeWidth={2} />
              <AppText color="brand" variant="label" weight="semibold">
                Message
              </AppText>
            </Pressable>
            </View>
          ) : null}

          <MemberProfileTabs
            profile={profile}
            token={token}
            username={profile.username}
          />
        </View>
      )}
      <JoinToContinueSheet
        message={
          joinKind === 'message'
            ? 'Sign in to start a direct message.'
            : 'Follow officers and mentors once you are signed in.'
        }
        onClose={() => setJoinOpen(false)}
        title={joinKind === 'message' ? 'Join to message' : 'Build your prep circle'}
        visible={joinOpen}
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
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={styles.stat}>
      <AppText weight="bold">{value}</AppText>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexGrow: 1,
  },
  back: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(10),
  },
  title: {
    flex: 1,
  },
  shareBtn: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    alignItems: 'center',
    paddingBottom: vs(24),
    gap: vs(6),
  },
  cover: {
    alignSelf: 'stretch',
    height: vs(140),
    marginBottom: vs(-48),
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  avatar: {
    width: ms(96),
    height: ms(96),
    borderRadius: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: vs(8),
    borderWidth: 4,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: s(6),
    paddingHorizontal: s(16),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    borderRadius: ms(12),
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: fontSize(28),
    lineHeight: lineHeight(28, 1.1),
  },
  name: {
    textAlign: 'center',
    paddingHorizontal: s(24),
  },
  headline: {
    textAlign: 'center',
    paddingHorizontal: s(24),
  },
  bio: {
    textAlign: 'center',
    marginTop: vs(8),
    paddingHorizontal: s(24),
  },
  stats: {
    flexDirection: 'row',
    gap: s(24),
    marginTop: vs(16),
    marginBottom: vs(8),
  },
  stat: {
    alignItems: 'center',
  },
  followBtn: {
    minWidth: s(140),
    alignItems: 'center',
    borderRadius: ms(22),
    paddingVertical: vs(10),
    paddingHorizontal: s(20),
  },
  ctaRow: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: vs(8),
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  messageBtn: {
    minWidth: s(140),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    borderRadius: ms(22),
    paddingVertical: vs(10),
    paddingHorizontal: s(16),
    borderWidth: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: vs(40),
    gap: vs(8),
  },
});
