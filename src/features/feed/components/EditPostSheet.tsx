/**
 * Edit a published caption. Photos and video stay as they were.
 */

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react-native';

import { feedApi } from '@/features/feed/api/feed.api';
import { invalidatePostSurfaces } from '@/features/feed/hooks/usePostCardActions';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, KeyboardSheet, useDiscardGuard } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type EditPostTarget = {
  id: string;
  content: string;
};

export type EditPostSheetProps = {
  target: EditPostTarget | null;
  token: string | null;
  onClose: () => void;
};

export function EditPostSheet({ target, token, onClose }: EditPostSheetProps) {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target) {
      setContent(target.content);
    }
  }, [target]);

  const dirty = target != null && content.trim() !== target.content.trim() && !busy;
  const guard = useDiscardGuard(dirty, onClose, Boolean(target));

  const save = async () => {
    if (!target || !token || busy) {
      return;
    }
    setBusy(true);
    try {
      await feedApi.updatePost(target.id, { content: content.trim() }, token);
      invalidatePostSurfaces(queryClient);
      showToast.success('Updated', 'Your caption is saved.');
      onClose();
    } catch (error) {
      showErrorToast(error, 'Could not update this post.', 'Post');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <KeyboardSheet onRequestClose={guard.requestClose} visible={Boolean(target)}>
        <View style={styles.body}>
          <View style={styles.head}>
            <AppText variant="subtitle" weight="bold">
              Edit
            </AppText>
            <Pressable disabled={busy} onPress={() => void save()}>
              <AppText color="brand" variant="label" weight="semibold">
                {busy ? 'Saving…' : 'Save'}
              </AppText>
            </Pressable>
          </View>
          <TextInput
            editable={!busy}
            maxLength={5000}
            multiline
            onChangeText={setContent}
            placeholder="Write a caption…"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                fontFamily: resolveFontFamily('regular'),
                maxHeight: windowHeight * 0.28,
              },
            ]}
            value={content}
          />
          <AppText color="muted" variant="caption">
            Photos and video stay as they are. Only the words change.
          </AppText>
        </View>
      </KeyboardSheet>
      <ConfirmModal
        Icon={Pencil}
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        message="Your caption changes will be lost."
        onCancel={guard.keepEditing}
        onConfirm={guard.discard}
        title="Leave without saving?"
        tone="danger"
        visible={guard.asking}
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
    gap: vs(10),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    minHeight: vs(120),
    fontSize: fontSize(16),
    lineHeight: lineHeight(22),
    textAlignVertical: 'top',
    padding: 0,
  },
});
