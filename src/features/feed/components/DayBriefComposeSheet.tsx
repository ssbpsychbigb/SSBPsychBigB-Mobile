/**
 * Day Brief composer — photo + caption, 24h strip.
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
import { pickStoryMedia } from '@/features/feed/lib/pick-feed-video';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type DayBriefComposeSheetProps = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: { caption: string; image: PickedAsset }) => void;
};

/**
 * Members share a portrait photo as a 24-hour brief.
 */
export function DayBriefComposeSheet({
  visible,
  busy,
  onClose,
  onSubmit,
}: DayBriefComposeSheetProps) {
  const theme = useTheme();
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<PickedAsset | null>(null);

  useEffect(() => {
    if (!visible) {
      setCaption('');
      setImage(null);
    }
  }, [visible]);

  const pickMedia = async () => {
    const next = await pickStoryMedia();
    if (next) {
      setImage(next);
    }
  };

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
            Add a story
          </AppText>
          <AppText color="muted" variant="caption">
            Photo or short video. Lives 24 hours on Home — this is not a Reel.
          </AppText>
          <TextInput
            editable={!busy}
            multiline
            onChangeText={setCaption}
            placeholder="Caption (optional)"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                fontFamily: resolveFontFamily('regular'),
              },
            ]}
            value={caption}
          />
          <AppText color="muted" variant="caption">
            {image
              ? image.type?.startsWith('video/')
                ? 'Video selected'
                : 'Photo selected'
              : 'A photo or video is required'}
          </AppText>
          <View style={styles.row}>
            <Pressable disabled={busy} onPress={() => void pickMedia()}>
              <AppText color="brand" variant="caption" weight="semibold">
                Choose photo or video
              </AppText>
            </Pressable>
            <View style={styles.actions}>
              <Pressable disabled={busy} onPress={onClose}>
                <AppText color="muted" variant="caption" weight="semibold">
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                disabled={busy || !image}
                onPress={() => {
                  if (!image) {
                    return;
                  }
                  onSubmit({ caption: caption.trim(), image });
                }}
                style={[
                  styles.post,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: busy || !image ? 0.5 : 1,
                  },
                ]}>
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <AppText color="inverse" variant="caption" weight="semibold">
                    Share
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
    minHeight: vs(72),
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
