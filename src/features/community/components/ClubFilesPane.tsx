/**
 * Club files — links plus image/PDF upload.
 */

import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { pickFeedImage } from '@/features/feed/lib/pick-feed-image';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { communityApi } from '@/features/community/api/community.api';
import {
  useCommunityResourcesQuery,
  useCreateResourceMutation,
  useDeleteResourceMutation,
} from '@/features/community/hooks/useCommunityQueries';
import { toCommunityFileForm } from '@/features/community/lib/community-upload';
import type { Community } from '@/features/community/types/community.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type ClubFilesPaneProps = {
  community: Community;
  canPreview: boolean;
  canAct: boolean;
  onNeedJoin: () => void;
};

/**
 * Members browse files. Moderators add links or uploads.
 */
export function ClubFilesPane({
  community,
  canPreview,
  canAct,
  onNeedJoin,
}: ClubFilesPaneProps) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const listQuery = useCommunityResourcesQuery(community.slug, canPreview);
  const createMutation = useCreateResourceMutation(community.slug);
  const deleteMutation = useDeleteResourceMutation(community.slug);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [busyUpload, setBusyUpload] = useState(false);

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data],
  );

  const addLink = async () => {
    if (!canAct) {
      onNeedJoin();
      return;
    }
    if (!title.trim() || !url.trim()) {
      return;
    }
    try {
      await createMutation.mutateAsync({
        kind: 'link',
        title: title.trim(),
        url: url.trim(),
      });
      setTitle('');
      setUrl('');
      showToast.success('File added');
    } catch (error) {
      showErrorToast(error, 'Could not add this link.', 'Community');
    }
  };

  const addUpload = async () => {
    if (!canAct || !token) {
      onNeedJoin();
      return;
    }
    const asset = await pickFeedImage();
    if (!asset) {
      return;
    }
    setBusyUpload(true);
    try {
      const uploaded = await communityApi.uploadResourceFile(
        community.slug,
        toCommunityFileForm(asset),
        token,
      );
      await createMutation.mutateAsync({
        kind: uploaded.kind,
        title: title.trim() || uploaded.fileName,
        filePath: uploaded.url,
        fileName: uploaded.fileName,
        mime: uploaded.mime,
        size: uploaded.size,
      });
      setTitle('');
      showToast.success('Uploaded');
    } catch (error) {
      showErrorToast(error, 'Could not upload this file.', 'Community');
    } finally {
      setBusyUpload(false);
    }
  };

  if (!canPreview) {
    return (
      <AppText color="muted" variant="caption">
        Files are locked until you are approved.
      </AppText>
    );
  }

  if (listQuery.isLoading && !listQuery.data) {
    return <Spinner />;
  }

  const inputStyle = [
    styles.input,
    {
      color: theme.colors.text,
      borderColor: theme.colors.border,
      fontFamily: resolveFontFamily('regular'),
    },
  ];

  return (
    <View style={styles.stack}>
      {community.canModerate ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            Add a resource
          </AppText>
          <TextInput
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle}
            value={title}
          />
          <TextInput
            autoCapitalize="none"
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle}
            value={url}
          />
          <View style={styles.row}>
            <Button
              loading={createMutation.isPending}
              onPress={() => void addLink()}
              size="sm"
              variant="secondary">
              Add link
            </Button>
            <Button loading={busyUpload} onPress={() => void addUpload()} size="sm">
              Upload image
            </Button>
          </View>
        </View>
      ) : null}

      {items.length === 0 ? (
        <AppText color="muted" variant="caption">
          No files yet.
        </AppText>
      ) : null}

      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => {
            const href = item.url || resolveUploadUrl(item.filePath);
            if (href) {
              void Linking.openURL(href);
            }
          }}
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="semibold">
            {item.title}
          </AppText>
          <AppText color="muted" variant="caption">
            {item.kind.toUpperCase()} · {item.createdBy.fullName}
          </AppText>
          {community.canModerate ? (
            <Pressable onPress={() => deleteMutation.mutate(item.id)}>
              <AppText color="danger" variant="caption" weight="semibold">
                Remove
              </AppText>
            </Pressable>
          ) : null}
        </Pressable>
      ))}
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
    height: ms(44),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
  },
  row: {
    flexDirection: 'row',
    gap: s(8),
  },
});
