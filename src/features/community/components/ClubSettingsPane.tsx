/**
 * Club settings — visibility, rules, invite, dual-key archive/delete.
 */

import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Trash2 } from 'lucide-react-native';

import {
  useCommunityInviteMutation,
  useDestructiveCommunityMutation,
  useUpdateCommunityMutation,
} from '@/features/community/hooks/useCommunityQueries';
import type { Community } from '@/features/community/types/community.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
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
  const update = useUpdateCommunityMutation(community.slug);
  const invite = useCommunityInviteMutation(community.slug);
  const destructive = useDestructiveCommunityMutation(community.slug);
  const [rules, setRules] = useState(community.rulesText || '');
  const [confirm, setConfirm] = useState<'archive' | 'delete' | null>(null);

  const copyInvite = async (rotate = false) => {
    try {
      const result = await invite.mutateAsync(rotate);
      Clipboard.setString(result.path);
      showToast.success('Invite link copied');
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
      {community.canChangeVisibility ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            Visibility
          </AppText>
          <Button
            onPress={() =>
              update.mutate({
                visibility: community.visibility === 'public' ? 'private' : 'public',
              })
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
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                fontFamily: resolveFontFamily('regular'),
              },
            ]}
            value={rules}
          />
          <Button
            loading={update.isPending}
            onPress={() => update.mutate({ rulesText: rules })}
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
                size="sm">
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
  input: {
    minHeight: vs(88),
    borderWidth: 1,
    borderRadius: ms(12),
    padding: s(12),
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: s(8),
  },
});
