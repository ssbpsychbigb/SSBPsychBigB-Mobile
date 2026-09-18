/**
 * Text / photo composer sheet — creates a public feed post.
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import type { PickedAsset } from '@/features/auth/types/register-form';
import { pickFeedImage } from '@/features/feed/lib/pick-feed-image';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type FeedComposeSheetProps = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: { content: string; image?: PickedAsset }) => void;
};

/**
 * Bottom sheet for a public text post, optionally with one photo.
 */
export function FeedComposeSheet({
  visible,
  busy,
  onClose,
  onSubmit,
}: FeedComposeSheetProps) {
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<PickedAsset | null>(null);

  useEffect(() => {
    if (!visible) {
      setContent('');
      setImage(null);
    }
  }, [visible]);

  const pickPhoto = async () => {
    const next = await pickFeedImage();
    if (next) {
      setImage(next);
    }
  };

  const canPost = content.trim().length > 0 || Boolean(image);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable onPress={busy ? undefined : onClose} style={styles.backdrop} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="subtitle" weight="bold">
            Share with BIGB
          </AppText>
          <TextInput
            editable={!busy}
            multiline
            onChangeText={setContent}
            placeholder="Write like an officer — clear, specific, useful."
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                fontFamily: resolveFontFamily('regular'),
              },
            ]}
            value={content}
          />
          {image ? (
            <AppText color="muted" variant="caption">
              Photo attached
            </AppText>
          ) : null}
          <View style={styles.row}>
            <Pressable disabled={busy} onPress={() => void pickPhoto()}>
              <AppText color="brand" variant="caption" weight="semibold">
                Add photo
              </AppText>
            </Pressable>
            <View style={styles.actions}>
              <Pressable
                disabled={busy}
                onPress={onClose}>
                <AppText color="muted" variant="caption" weight="semibold">
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                disabled={busy || !canPost}
                onPress={() => {
                  onSubmit({ content: content.trim(), image: image || undefined });
                }}
                style={[
                  styles.post,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: busy || !canPost ? 0.5 : 1,
                  },
                ]}>
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <AppText color="inverse" variant="caption" weight="semibold">
                    Post
                  </AppText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13,30,52,0.35)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    borderWidth: 1,
    paddingHorizontal: s(20),
    paddingTop: vs(18),
    paddingBottom: vs(28),
    gap: vs(12),
  },
  input: {
    minHeight: vs(96),
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    textAlignVertical: 'top',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
  },
  post: {
    minWidth: ms(72),
    height: vs(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(16),
  },
});
