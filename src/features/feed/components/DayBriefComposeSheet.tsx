/**
 * Day Brief composer — photo + caption, 24h strip.
 */

import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Camera, Clock3, ImagePlus } from 'lucide-react-native';

import type { PickedAsset } from '@/features/auth/types/register-form';
import {
  ComposeHeader,
  ComposeTool,
  HideKeyboardButton,
  MediaStrip,
} from '@/features/feed/components/ComposeParts';
import { captureFeedPhoto, MediaPickError } from '@/features/feed/lib/pick-feed-image';
import { MAX_STORY_ITEMS, pickStoryMediaList } from '@/features/feed/lib/pick-feed-video';
import { showToast } from '@/shared/ui/toast';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, KeyboardSheet, useDiscardGuard } from '@/shared/ui';

export type DayBriefComposeSheetProps = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: { caption: string; images: PickedAsset[] }) => void;
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
  const { height: windowHeight } = useWindowDimensions();
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<PickedAsset[]>([]);

  useEffect(() => {
    if (!visible) {
      setCaption('');
      setImages([]);
    }
  }, [visible]);

  const guard = useDiscardGuard(
    (caption.trim().length > 0 || images.length > 0) && !busy,
    () => {
      if (!busy) {
        onClose();
      }
    },
    visible,
  );

  const roomLeft = MAX_STORY_ITEMS - images.length;

  const pickMedia = async () => {
    if (roomLeft <= 0) {
      showToast.info('Story limit', `You can add up to ${MAX_STORY_ITEMS} at once.`);
      return;
    }
    try {
      const picked = await pickStoryMediaList(roomLeft);
      if (picked.skipped) {
        showToast.info('Skipped', 'Videos over 60 seconds were left out.');
      }
      setImages((current) => [...current, ...picked.items].slice(0, MAX_STORY_ITEMS));
    } catch (error) {
      if (error instanceof MediaPickError) {
        showToast.info('Gallery', error.message);
      }
    }
  };

  const takePhoto = async () => {
    if (roomLeft <= 0) {
      showToast.info('Story limit', `You can add up to ${MAX_STORY_ITEMS} at once.`);
      return;
    }
    try {
      const photo = await captureFeedPhoto();
      if (photo) {
        setImages((current) => [...current, photo].slice(0, MAX_STORY_ITEMS));
      }
    } catch (error) {
      if (error instanceof MediaPickError) {
        showToast.info('Camera', error.message);
      }
    }
  };

  return (
    <>
      <KeyboardSheet onRequestClose={guard.requestClose} visible={visible}>
        <ComposeHeader
          actionDisabled={images.length === 0}
          actionLabel={images.length > 1 ? `Share ${images.length}` : 'Share'}
          busy={busy}
          onAction={() => {
            if (images.length) {
              onSubmit({ caption: caption.trim(), images });
            }
          }}
          onClose={guard.requestClose}
          title="Add a story"
        />

        <View style={styles.body}>
          {images.length ? (
            <MediaStrip
              items={images.map((item) => ({
                key: item.uri,
                uri: item.uri,
                kind: item.type?.startsWith('video/') ? 'video' : 'image',
              }))}
              onRemove={
                busy ? undefined : (key) => setImages((current) => current.filter((item) => item.uri !== key))
              }
              singleHeight={Math.min(vs(260), windowHeight * 0.3)}
            />
          ) : (
            <View style={styles.sources}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void takePhoto()}
                style={({ pressed }) => [
                  styles.picker,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: pressed ? theme.colors.surface : theme.colors.background,
                  },
                ]}>
                <View style={[styles.pickerIcon, { backgroundColor: `${theme.palette.tertiary.DEFAULT}1A` }]}>
                  <Camera color={theme.palette.tertiary.DEFAULT} size={ms(24)} strokeWidth={2} />
                </View>
                <AppText variant="label" weight="semibold">
                  Camera
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void pickMedia()}
                style={({ pressed }) => [
                  styles.picker,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: pressed ? theme.colors.surface : theme.colors.background,
                  },
                ]}>
                <View style={[styles.pickerIcon, { backgroundColor: `${theme.colors.primary}1A` }]}>
                  <ImagePlus color={theme.colors.primary} size={ms(24)} strokeWidth={2} />
                </View>
                <AppText variant="label" weight="semibold">
                  Gallery
                </AppText>
              </Pressable>
            </View>
          )}

          <TextInput
            editable={!busy}
            maxLength={500}
            multiline
            onChangeText={setCaption}
            placeholder="Add a caption… (optional)"
            placeholderTextColor={theme.colors.textMuted}
            scrollEnabled
            style={[
              styles.input,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                fontFamily: resolveFontFamily('regular'),
                maxHeight: windowHeight * 0.16,
              },
            ]}
            value={caption}
          />

          <View style={styles.footer}>
            <View style={styles.hintRow}>
              <Clock3 color={theme.colors.textMuted} size={ms(14)} strokeWidth={2} />
              <AppText color="muted" variant="caption">
                Visible on Home for 24 hours
              </AppText>
            </View>
            <View style={styles.tools}>
              {images.length ? (
                <>
                  <ComposeTool
                    Icon={Camera}
                    disabled={busy || roomLeft <= 0}
                    label="Camera"
                    onPress={() => void takePhoto()}
                    tone="accent"
                  />
                  <ComposeTool
                    Icon={ImagePlus}
                    disabled={busy || roomLeft <= 0}
                    label="Add"
                    onPress={() => void pickMedia()}
                  />
                </>
              ) : null}
              <HideKeyboardButton />
            </View>
          </View>
        </View>
      </KeyboardSheet>

      <ConfirmModal
        Icon={ImagePlus}
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        message="Your photo and caption will be lost if you leave now."
        onCancel={guard.keepEditing}
        onConfirm={guard.discard}
        title="Discard this story?"
        tone="danger"
        visible={guard.asking}
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: vs(14),
    marginTop: vs(10),
  },
  sources: {
    flexDirection: 'row',
    gap: s(12),
  },
  picker: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: ms(18),
    paddingVertical: vs(22),
    alignItems: 'center',
    gap: vs(4),
  },
  tools: {
    flexDirection: 'row',
    gap: s(8),
  },
  pickerIcon: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(6),
  },
  input: {
    minHeight: vs(56),
    borderRadius: ms(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    textAlignVertical: 'top',
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.4),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(10),
    minHeight: ms(38),
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
});
