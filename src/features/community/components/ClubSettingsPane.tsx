/**
 * Club settings — identity, visibility, rules, invite, dual-key archive/delete.
 */

import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { ImagePlus, Trash2 } from 'lucide-react-native';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { communityApi } from '@/features/community/api/community.api';
import {
  useCommunityInviteMutation,
  useDestructiveCommunityMutation,
  useUpdateCommunityMutation,
} from '@/features/community/hooks/useCommunityQueries';
import { toCommunityFileForm } from '@/features/community/lib/community-upload';
import type { Community } from '@/features/community/types/community.types';
import { pickFeedImage } from '@/features/feed/lib/pick-feed-image';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ConfirmModal } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type ClubSettingsPaneProps = {
  community: Community;
};

/**
 * Dual-key: request then the other admin must approve.
 */
export function ClubSettingsPane({ community }: ClubSettingsPaneProps) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const update = useUpdateCommunityMutation(community.slug);
  const invite = useCommunityInviteMutation(community.slug);
  const destructive = useDestructiveCommunityMutation(community.slug);
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || '');
  const [rules, setRules] = useState(community.rulesText || '');
  const [coverPhotoPath, setCoverPhotoPath] = useState(community.coverPhotoPath || '');
  const [avatarPath, setAvatarPath] = useState(community.avatarPath || '');
  const [uploading, setUploading] = useState<'cover' | 'avatar' | null>(null);
  const [confirm, setConfirm] = useState<'archive' | 'delete' | null>(null);

  const inputStyle = [
    styles.input,
    {
      color: theme.colors.text,
      borderColor: theme.colors.border,
      fontFamily: resolveFontFamily('regular'),
    },
  ];

  const uploadBrand = async (kind: 'cover' | 'avatar') => {
    if (!token || !community.canEditSettings) {
      return;
    }
    const asset = await pickFeedImage();
    if (!asset) {
      return;
    }
    setUploading(kind);
    try {
      const result = await communityApi.uploadBrand(
        toCommunityFileForm(asset),
        kind,
        token,
      );
      if (kind === 'cover') {
        setCoverPhotoPath(result.path);
      } else {
        setAvatarPath(result.path);
      }
      await update.mutateAsync(
        kind === 'cover'
          ? { coverPhotoPath: result.path }
          : { avatarPath: result.path },
      );
      showToast.success(kind === 'cover' ? 'Cover updated' : 'Avatar updated');
    } catch (error) {
      showErrorToast(error, 'Could not update photo.', 'Community');
    } finally {
      setUploading(null);
    }
  };

  const copyInvite = async (rotate = false) => {
    try {
      const result = await invite.mutateAsync(rotate);
      Clipboard.setString(result.path);
      showToast.success(rotate ? 'Invite link rotated' : 'Invite link copied');
    } catch (error) {
      showErrorToast(error, 'Could not create invite.', 'Community');
    }
  };

  const runDestructive = async () => {
    if (!confirm) {
      return;
    }
    try {
      if (community.pendingDestructive?.type === confirm) {
        await destructive.mutateAsync({ type: confirm, mode: 'approve' });
        showToast.success('Second key applied');
      } else {
        await destructive.mutateAsync({ type: confirm, mode: 'request' });
        showToast.success('Waiting for Co-Admin');
      }
      setConfirm(null);
    } catch (error) {
      showErrorToast(error, 'Could not complete this action.', 'Community');
      setConfirm(null);
    }
  };

  return (
    <View style={styles.stack}>
      {community.canEditSettings ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            Club info
          </AppText>
          <Pressable
            onPress={() => void uploadBrand('cover')}
            style={[
              styles.coverPick,
              { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.border },
            ]}>
            {coverPhotoPath ? (
              <Image
                source={{ uri: resolveUploadUrl(coverPhotoPath) || undefined }}
                style={styles.coverImage}
              />
            ) : (
              <View style={styles.coverHint}>
                <ImagePlus color={theme.colors.primary} size={ms(18)} />
                <AppText color="brand" variant="caption" weight="semibold">
                  {uploading === 'cover' ? 'Uploading…' : 'Change cover'}
                </AppText>
              </View>
            )}
            <Pressable
              onPress={() => void uploadBrand('avatar')}
              style={[
                styles.avatarPick,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.background,
                },
              ]}>
              {avatarPath ? (
                <Image
                  source={{ uri: resolveUploadUrl(avatarPath) || undefined }}
                  style={styles.coverImage}
                />
              ) : (
                <AppText color="inverse" variant="caption" weight="bold">
                  {uploading === 'avatar' ? '…' : '+'}
                </AppText>
              )}
            </Pressable>
          </Pressable>
          <TextInput
            maxLength={80}
            onChangeText={setName}
            placeholder="Club name"
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle}
            value={name}
          />
          <TextInput
            maxLength={2000}
            multiline
            onChangeText={setDescription}
            placeholder="What members practise here"
            placeholderTextColor={theme.colors.textMuted}
            style={[inputStyle, styles.multiline]}
            value={description}
          />
          <Button
            disabled={
              update.isPending ||
              (name.trim() === community.name &&
                description === (community.description || ''))
            }
            loading={update.isPending}
            onPress={() =>
              update.mutate(
                { name: name.trim(), description },
                {
                  onSuccess: () => showToast.success('Club info saved'),
                  onError: (error) =>
                    showErrorToast(error, 'Could not save club info.', 'Community'),
                },
              )
            }
            size="sm">
            Save info
          </Button>
        </View>
      ) : null}

      {community.canChangeVisibility ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            Visibility
          </AppText>
          <AppText color="muted" variant="caption">
            Join is always a request. You can switch public and private anytime.
          </AppText>
          <Button
            onPress={() =>
              update.mutate(
                {
                  visibility: community.visibility === 'public' ? 'private' : 'public',
                },
                {
                  onSuccess: () =>
                    showToast.success(
                      community.visibility === 'public' ? 'Now private' : 'Now public',
                    ),
                  onError: (error) =>
                    showErrorToast(error, 'Could not change visibility.', 'Community'),
                },
              )
            }
            size="sm"
            variant="secondary">
            Switch to {community.visibility === 'public' ? 'private' : 'public'}
          </Button>
        </View>
      ) : null}

      {community.canEditSettings ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            House rules
          </AppText>
          <TextInput
            multiline
            onChangeText={setRules}
            placeholder="Optional. Members accept these on join."
            placeholderTextColor={theme.colors.textMuted}
            style={[inputStyle, styles.multiline]}
            value={rules}
          />
          <Button
            loading={update.isPending}
            onPress={() =>
              update.mutate(
                { rulesText: rules },
                {
                  onSuccess: () => showToast.success('Rules saved'),
                  onError: (error) =>
                    showErrorToast(error, 'Could not save rules.', 'Community'),
                },
              )
            }
            size="sm">
            Save rules
          </Button>
        </View>
      ) : null}

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
        ]}>
        <AppText variant="label" weight="bold">
          Invite
        </AppText>
        <AppText color="muted" variant="caption">
          Private clubs need a link. Public clubs can still share one.
        </AppText>
        <Button loading={invite.isPending} onPress={() => void copyInvite(false)} size="sm">
          Copy invite link
        </Button>
        {community.canEditSettings ? (
          <Button onPress={() => void copyInvite(true)} size="sm" variant="ghost">
            Rotate link
          </Button>
        ) : null}
      </View>

      {community.pendingDestructive ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            Pending {community.pendingDestructive.type}
          </AppText>
          <AppText color="muted" variant="caption">
            Dual-key. The other admin must approve or reject.
          </AppText>
          {community.canDecideDestructive ? (
            <View style={styles.row}>
              <Button
                onPress={() =>
                  destructive.mutate({
                    type: community.pendingDestructive!.type,
                    mode: 'approve',
                  })
                }
                size="sm"
                style={styles.flex}>
                Approve
              </Button>
              <Button
                onPress={() =>
                  destructive.mutate({
                    type: community.pendingDestructive!.type,
                    mode: 'reject',
                  })
                }
                size="sm"
                style={styles.flex}
                variant="secondary">
                Reject
              </Button>
            </View>
          ) : null}
        </View>
      ) : null}

      {community.canProposeArchive || community.canProposeDelete ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            Danger zone
          </AppText>
          <AppText color="muted" variant="caption">
            Archive or delete needs both Primary and Co-Admin. Appoint a Co-Admin first.
          </AppText>
          {community.canProposeArchive ? (
            <Button onPress={() => setConfirm('archive')} size="sm" variant="secondary">
              Request archive
            </Button>
          ) : null}
          {community.canProposeDelete ? (
            <Button onPress={() => setConfirm('delete')} size="sm" variant="danger">
              Request delete
            </Button>
          ) : null}
        </View>
      ) : null}

      <ConfirmModal
        Icon={Trash2}
        confirmLabel="Continue"
        isLoading={destructive.isPending}
        message="The other admin must confirm. This cannot be undone after both keys."
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runDestructive()}
        title={confirm === 'delete' ? 'Delete this club?' : 'Archive this club?'}
        tone="danger"
        visible={Boolean(confirm)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: vs(10),
  },
  card: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(14),
    gap: vs(8),
  },
  coverPick: {
    height: vs(110),
    borderRadius: ms(16),
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  coverHint: {
    alignItems: 'center',
    gap: vs(4),
  },
  avatarPick: {
    position: 'absolute',
    left: s(12),
    bottom: vs(10),
    width: ms(44),
    height: ms(44),
    borderRadius: ms(14),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  input: {
    minHeight: ms(44),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  multiline: {
    minHeight: vs(88),
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: s(8),
  },
  flex: {
    flex: 1,
  },
});
