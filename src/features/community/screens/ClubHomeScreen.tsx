/**
 * Club home — immersive cover, compact membership, rooms.
 */

import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Lock,
  LogOut,
  MessageCircle,
  Users,
} from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { communityApi } from '@/features/community/api/community.api';
import { ClubEventsPane } from '@/features/community/components/ClubEventsPane';
import {
  ClubFeedOverlays,
  ClubFeedPane,
  ClubFeedProvider,
} from '@/features/community/components/ClubFeedPane';
import { ClubFilesPane } from '@/features/community/components/ClubFilesPane';
import { ClubMembersPane } from '@/features/community/components/ClubMembersPane';
import { ClubNewsPane } from '@/features/community/components/ClubNewsPane';
import { ClubRoomPills } from '@/features/community/components/ClubRoomPills';
import { ClubSettingsPane } from '@/features/community/components/ClubSettingsPane';
import {
  useAcceptCommunityRulesMutation,
  useCommunityQuery,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
} from '@/features/community/hooks/useCommunityQueries';
import { type ClubRoomKey } from '@/features/community/lib/club-rooms';
import {
  canActInClub,
  canPreviewClubContent,
} from '@/features/community/lib/community-permissions';
import { toCommunityCard } from '@/features/community/lib/to-community-card';
import { useScreenTopPadding } from '@/shared/lib/safe-area';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ConfirmModal, Screen, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'ClubHome'>;

/**
 * Root-stack club. Public clubs preview; private clubs lock until join.
 */
export function ClubHomeScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const topPad = useScreenTopPadding();
  const { slug, invite } = route.params;
  const token = useAuthStore((state) => state.accessToken);
  const clubQuery = useCommunityQuery(slug, invite);
  const community = clubQuery.data;
  const joinMutation = useJoinCommunityMutation(slug);
  const leaveMutation = useLeaveCommunityMutation(slug);
  const acceptRules = useAcceptCommunityRulesMutation(slug);
  const [room, setRoom] = useState<ClubRoomKey>('feed');
  const [joinOpen, setJoinOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  const canPreview = canPreviewClubContent(community);
  const canAct = canActInClub(community);
  const card = community ? toCommunityCard(community) : null;

  const rooms = useMemo((): ClubRoomKey[] => {
    const base: ClubRoomKey[] = ['feed', 'qa', 'files', 'events', 'news', 'about'];
    if (community?.isMember) {
      base.push('members');
    }
    if (community?.canManageMembers || community?.canModerate) {
      base.push('requests');
    }
    if (
      community?.canEditSettings ||
      community?.canProposeArchive ||
      community?.canProposeDelete ||
      community?.canDecideDestructive ||
      community?.canChangeVisibility
    ) {
      base.push('settings');
    }
    return base;
  }, [community]);

  const onNeedJoin = () => {
    if (!token) {
      setJoinOpen(true);
      return;
    }
    if (community?.membershipStatus === 'pending') {
      showToast.info('Requested', 'An admin still needs to approve you.');
      return;
    }
    showToast.info('Join required', 'Request to join to like, comment, or post.');
  };

  const requestJoin = async () => {
    if (!token) {
      setJoinOpen(true);
      return;
    }
    try {
      await joinMutation.mutateAsync(invite);
      showToast.success('Request sent', 'You can browse. Actions unlock after approval.');
    } catch (error) {
      showErrorToast(error, 'Could not request join.', 'Community');
    }
  };

  const openChat = async () => {
    if (!token || !canAct) {
      onNeedJoin();
      return;
    }
    setChatBusy(true);
    try {
      const conversation = await communityApi.openChat(slug, token);
      navigation.navigate('ChatThread', {
        conversationId: conversation.id,
        name: conversation.name || community?.name,
      });
    } catch (error) {
      showErrorToast(error, 'Could not open club chat.', 'Community');
    } finally {
      setChatBusy(false);
    }
  };

  if (clubQuery.isLoading && !community) {
    return <Spinner fullScreen />;
  }

  if (!community || !card) {
    return (
      <Screen>
        <AppText variant="subtitle" weight="bold">
          Club not found
        </AppText>
        <Button onPress={() => navigation.goBack()}>Back</Button>
      </Screen>
    );
  }

  const memberBusy = joinMutation.isPending || leaveMutation.isPending;
  const pending = community.membershipStatus === 'pending';

  return (
    <ClubFeedProvider
      canAct={canAct}
      canPreview={canPreview}
      community={community}
      mode={room === 'qa' ? 'question' : 'all'}
      onNeedJoin={onNeedJoin}>
    <Screen padded={false} safeTop={false} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.coverWrap}>
          <View style={[styles.cover, { backgroundColor: theme.colors.primaryMuted }]}>
            {card.coverUri ? (
              <Image source={{ uri: card.coverUri }} style={styles.coverImage} />
            ) : null}
            <View style={styles.coverScrim} />
          </View>
          <View style={[styles.coverBar, { paddingTop: topPad }]}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={styles.coverBtn}>
              <ArrowLeft color="#FFFFFF" size={ms(20)} strokeWidth={2.2} />
            </Pressable>
            {community.isMember ? (
              <Pressable
                accessibilityLabel="Club chat"
                disabled={chatBusy}
                onPress={() => {
                  void openChat();
                }}
                style={[styles.coverBtn, styles.coverChat, chatBusy ? styles.coverBusy : null]}>
                <MessageCircle color="#FFFFFF" size={ms(18)} strokeWidth={2.2} />
              </Pressable>
            ) : (
              <View style={styles.coverBtnSpacer} />
            )}
          </View>
        </View>

        <View style={styles.profile}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.background,
              },
            ]}>
            {card.avatarUri ? (
              <Image source={{ uri: card.avatarUri }} style={styles.coverImage} />
            ) : (
              <AppText color="inverse" variant="subtitle" weight="bold">
                {card.initials}
              </AppText>
            )}
          </View>
          <AppText style={styles.name} variant="title" weight="bold">
            {community.name}
          </AppText>
          <View style={styles.metaRow}>
            <Users color={theme.colors.textMuted} size={ms(13)} strokeWidth={2.2} />
            <AppText color="muted" variant="caption">
              {card.memberLabel}
            </AppText>
            <View style={[styles.dot, { backgroundColor: theme.colors.border }]} />
            {card.isPrivate ? (
              <Lock color={theme.colors.textMuted} size={ms(12)} strokeWidth={2.2} />
            ) : null}
            <AppText color="muted" variant="caption">
              {card.visibilityLabel}
            </AppText>
          </View>
          {community.description ? (
            <AppText color="secondary" style={styles.bio} variant="caption">
              {community.description}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            {community.isMember ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={memberBusy}
                  onPress={() => setLeaveOpen(true)}
                  style={[
                    styles.joined,
                    {
                      backgroundColor: theme.colors.primaryMuted,
                      borderColor: theme.colors.primary,
                    },
                  ]}>
                  <Check color={theme.colors.primary} size={ms(14)} strokeWidth={2.6} />
                  <AppText color="brand" variant="caption" weight="semibold">
                    Joined
                  </AppText>
                  <ChevronDown color={theme.colors.primary} size={ms(14)} strokeWidth={2.4} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLeaveOpen(true)}
                  style={styles.leaveText}>
                  <AppText color="danger" variant="caption" weight="semibold">
                    Leave
                  </AppText>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={pending || memberBusy}
                onPress={() => {
                  void requestJoin();
                }}
                style={[
                  styles.joinCta,
                  {
                    backgroundColor: pending ? theme.colors.surface : theme.colors.primary,
                    borderColor: pending ? theme.colors.border : theme.colors.primary,
                  },
                ]}>
                <AppText
                  color={pending ? 'secondary' : 'inverse'}
                  variant="caption"
                  weight="semibold">
                  {pending ? 'Requested' : 'Request to join'}
                </AppText>
              </Pressable>
            )}
          </View>
        </View>

        {community.needsRulesAccept && community.isMember ? (
          <View
            style={[
              styles.rules,
              { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.border },
            ]}>
            <AppText variant="label" weight="bold">
              Accept house rules to post
            </AppText>
            <AppText color="secondary" variant="caption">
              {community.rulesText || 'Be precise. No spam. Respect the room.'}
            </AppText>
            <Pressable
              onPress={() => acceptRules.mutate()}
              style={[styles.joinCta, { backgroundColor: theme.colors.primary }]}>
              <AppText color="inverse" variant="caption" weight="semibold">
                {acceptRules.isPending ? 'Saving…' : 'I accept'}
              </AppText>
            </Pressable>
          </View>
        ) : null}

        <ClubRoomPills
          active={rooms.includes(room) ? room : 'feed'}
          onChange={setRoom}
          rooms={rooms}
        />

        <View style={styles.pane}>
          {room === 'feed' || room === 'qa' ? <ClubFeedPane /> : null}
          {room === 'files' ? (
            <ClubFilesPane
              canAct={canAct}
              canPreview={canPreview}
              community={community}
              onNeedJoin={onNeedJoin}
            />
          ) : null}
          {room === 'events' ? (
            <ClubEventsPane
              canAct={canAct}
              canPreview={canPreview}
              community={community}
              onNeedJoin={onNeedJoin}
            />
          ) : null}
          {room === 'news' ? (
            <ClubNewsPane canPreview={canPreview} community={community} />
          ) : null}
          {room === 'about' ? (
            <View style={styles.about}>
              <AppText variant="label" weight="bold">
                About
              </AppText>
              <AppText color="secondary" variant="caption">
                {community.description || 'No description yet.'}
              </AppText>
              {community.rulesText ? (
                <>
                  <AppText variant="label" weight="bold">
                    Rules
                  </AppText>
                  <AppText color="secondary" variant="caption">
                    {community.rulesText}
                  </AppText>
                </>
              ) : null}
              <AppText color="muted" variant="caption">
                Primary {community.primaryAdminName || 'admin'}
                {community.coAdminName ? ` · Co-Admin ${community.coAdminName}` : ''}
              </AppText>
              {community.isMember ? (
                <Pressable onPress={() => setLeaveOpen(true)} style={styles.aboutLeave}>
                  <AppText color="danger" variant="caption" weight="semibold">
                    Leave this club
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {room === 'members' ? (
            <ClubMembersPane community={community} mode="members" />
          ) : null}
          {room === 'requests' ? (
            <ClubMembersPane community={community} mode="requests" />
          ) : null}
          {room === 'settings' ? <ClubSettingsPane community={community} /> : null}
        </View>
      </ScrollView>

      <JoinToContinueSheet
        message="Create an account to request this club."
        onClose={() => setJoinOpen(false)}
        title="Join BIGB"
        visible={joinOpen}
      />
      <ConfirmModal
        Icon={LogOut}
        confirmLabel="Leave club"
        isLoading={leaveMutation.isPending}
        message="You will need approval again to come back."
        onCancel={() => setLeaveOpen(false)}
        onConfirm={() => {
          leaveMutation.mutate(undefined, {
            onSuccess: () => {
              setLeaveOpen(false);
              showToast.success('Left club');
            },
            onError: (error) => showErrorToast(error, 'Could not leave.', 'Community'),
          });
        }}
        title="Leave this club?"
        tone="danger"
        visible={leaveOpen}
      />
      <ClubFeedOverlays />
    </Screen>
    </ClubFeedProvider>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingBottom: vs(40),
  },
  coverWrap: {
    marginBottom: 0,
  },
  cover: {
    height: vs(176),
    width: '100%',
  },
  coverImage: {
    ...StyleSheet.absoluteFill,
  },
  coverScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 18, 36, 0.28)',
  },
  coverBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
    paddingBottom: vs(8),
  },
  coverBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: 'rgba(13, 30, 52, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverChat: {
    backgroundColor: 'rgba(24, 119, 242, 0.92)',
  },
  coverBusy: {
    opacity: 0.55,
  },
  coverBtnSpacer: {
    width: ms(40),
    height: ms(40),
  },
  profile: {
    backgroundColor: 'transparent',
    paddingHorizontal: s(16),
    paddingBottom: vs(4),
  },
  avatar: {
    width: ms(76),
    height: ms(76),
    borderRadius: ms(24),
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: vs(-38),
    marginBottom: vs(12),
  },
  name: {
    marginBottom: vs(6),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  dot: {
    width: ms(3),
    height: ms(3),
    borderRadius: ms(2),
  },
  bio: {
    marginTop: vs(8),
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    marginTop: vs(12),
  },
  joined: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    height: ms(36),
    paddingHorizontal: s(12),
    borderRadius: ms(18),
    borderWidth: 1,
  },
  leaveText: {
    height: ms(36),
    justifyContent: 'center',
  },
  joinCta: {
    alignSelf: 'flex-start',
    height: ms(36),
    paddingHorizontal: s(16),
    borderRadius: ms(18),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rules: {
    marginHorizontal: s(16),
    marginTop: vs(12),
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(14),
    gap: vs(8),
  },
  pane: {
    paddingHorizontal: s(16),
    paddingTop: vs(4),
  },
  about: {
    gap: vs(8),
    paddingTop: vs(8),
  },
  aboutLeave: {
    marginTop: vs(8),
    alignSelf: 'flex-start',
  },
});
