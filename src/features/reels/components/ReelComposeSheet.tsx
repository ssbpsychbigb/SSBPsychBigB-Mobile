/**
 * Create Reel — gallery or camera video → feed `type: video`.
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
import {
  pickReelVideo,
  recordReelVideo,
  type PickedVideo,
} from '@/features/feed/lib/pick-feed-video';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: 'psychology', label: 'Psychology' },
  { key: 'gto', label: 'GTO' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'entry_guidance', label: 'Interview' },
];

export type ReelComposeSheetProps = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: { caption: string; video: PickedAsset; category: string }) => void;
};

/**
 * Instagram-style reel composer. Stories stay on Feed (Day Brief).
 */
export function ReelComposeSheet({
  visible,
  busy,
  onClose,
  onSubmit,
}: ReelComposeSheetProps) {
  const theme = useTheme();
  const [caption, setCaption] = useState('');
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [category, setCategory] = useState('motivation');

  useEffect(() => {
    if (!visible) {
      setCaption('');
      setVideo(null);
      setCategory('motivation');
    }
  }, [visible]);

  const attach = async (fromCamera: boolean) => {
    const next = fromCamera ? await recordReelVideo() : await pickReelVideo();
    if (!next) {
      showToast.info(
        'Video needed',
        'Use MP4/MOV under 250 MB and 5 minutes. Stories are on Feed, not here.',
      );
      return;
    }
    setVideo(next);
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
            New Reel
          </AppText>
          <AppText color="muted" variant="caption">
            Stays on Reels and Feed. Stories are the 24-hour strip on Home.
          </AppText>
          <TextInput
            editable={!busy}
            maxLength={2000}
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
            {video ? video.name || 'Video selected' : 'Pick or record a clip'}
          </AppText>
          <View style={styles.cats}>
            {CATEGORIES.map((item) => {
              const on = category === item.key;
              return (
                <Pressable
                  key={item.key}
                  disabled={busy}
                  onPress={() => setCategory(item.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: on ? theme.colors.primary : theme.colors.surface,
                      borderColor: on ? theme.colors.primary : theme.colors.border,
                    },
                  ]}>
                  <AppText
                    color={on ? 'inverse' : 'secondary'}
                    variant="caption"
                    weight="semibold">
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.row}>
            <Pressable disabled={busy} onPress={() => void attach(false)}>
              <AppText color="brand" variant="caption" weight="semibold">
                Gallery
              </AppText>
            </Pressable>
            <Pressable disabled={busy} onPress={() => void attach(true)}>
              <AppText color="brand" variant="caption" weight="semibold">
                Camera
              </AppText>
            </Pressable>
            <View style={styles.actions}>
              <Pressable disabled={busy} onPress={onClose}>
                <AppText color="muted" variant="caption" weight="semibold">
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                disabled={busy || !video}
                onPress={() => {
                  if (!video) {
                    return;
                  }
                  onSubmit({
                    caption: caption.trim() || 'Shared a Prep Reel',
                    video,
                    category,
                  });
                }}
                style={[
                  styles.post,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: busy || !video ? 0.5 : 1,
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
  cats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  chip: {
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: s(12),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    marginLeft: 'auto',
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
