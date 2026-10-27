/**
 * Create Reel — gallery or camera video → feed `type: video`.
 */

import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Camera, Clapperboard, Film, VolumeX, type LucideIcon } from 'lucide-react-native';

import type { PickedAsset } from '@/features/auth/types/register-form';
import {
  ComposeHeader,
  HideKeyboardButton,
  MediaPreview,
} from '@/features/feed/components/ComposeParts';
import { useFeedTopics } from '@/features/feed/hooks/useFeedTopics';
import { MediaPickError } from '@/features/feed/lib/pick-feed-image';
import {
  pickReelVideo,
  recordReelVideo,
  type PickedVideo,
} from '@/features/feed/lib/pick-feed-video';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, KeyboardSheet, useDiscardGuard } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

export type ReelComposeSheetProps = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: {
    caption: string;
    video: PickedAsset;
    category: string | null;
    muteOriginal: boolean;
  }) => void;
};

function formatDuration(sec?: number): string | undefined {
  if (!sec) {
    return undefined;
  }
  const total = Math.round(sec);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

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
  const { height: windowHeight } = useWindowDimensions();
  const [caption, setCaption] = useState('');
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const topics = useFeedTopics();
  const [category, setCategory] = useState<string | null>(null);
  const [muteOriginal, setMuteOriginal] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCaption('');
      setVideo(null);
      setCategory(null);
      setMuteOriginal(false);
    }
  }, [visible]);

  const guard = useDiscardGuard(
    (caption.trim().length > 0 || Boolean(video)) && !busy,
    () => {
      if (!busy) {
        onClose();
      }
    },
    visible,
  );

  const attach = async (fromCamera: boolean) => {
    try {
      const next = fromCamera ? await recordReelVideo() : await pickReelVideo();
      if (next) {
        setVideo(next);
      }
    } catch (error) {
      showToast.info(
        'Video needed',
        error instanceof MediaPickError
          ? error.message
          : 'Use MP4/MOV under 250 MB and 5 minutes. Stories are on Feed, not here.',
      );
    }
  };

  return (
    <>
      <KeyboardSheet onRequestClose={guard.requestClose} visible={visible}>
        <ComposeHeader
          actionDisabled={!video}
          actionLabel="Share"
          busy={busy}
          onAction={() => {
            if (video) {
              onSubmit({ caption: caption.trim(), video, category, muteOriginal });
            }
          }}
          onClose={guard.requestClose}
          title="New reel"
        />

        <View style={styles.body}>
          {video ? (
            <MediaPreview
              caption={formatDuration(video.durationSec)}
              height={Math.min(vs(220), windowHeight * 0.28)}
              kind="video"
              onRemove={busy ? undefined : () => setVideo(null)}
              uri={video.uri}
            />
          ) : (
            <View style={styles.sources}>
              <SourceTile
                Icon={Camera}
                hint="Record a new clip"
                label="Camera"
                onPress={() => void attach(true)}
                tone="accent"
              />
              <SourceTile
                Icon={Film}
                hint="Pick from your phone"
                label="Gallery"
                onPress={() => void attach(false)}
              />
            </View>
          )}

          <TextInput
            editable={!busy}
            maxLength={2000}
            multiline
            onChangeText={setCaption}
            placeholder="Write a caption… (optional)"
            placeholderTextColor={theme.colors.textMuted}
            scrollEnabled
            style={[
              styles.input,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                fontFamily: resolveFontFamily('regular'),
                maxHeight: windowHeight * 0.18,
              },
            ]}
            value={caption}
          />

          <View>
            <AppText color="muted" style={styles.sectionLabel} variant="caption" weight="semibold">
              TOPIC · OPTIONAL
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cats}>
              {topics.map((item) => {
                const on = category === item.value;
                return (
                  <Pressable
                    disabled={busy}
                    key={item.value}
                    onPress={() =>
                      setCategory((current) => (current === item.value ? null : item.value))
                    }
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: on ? theme.colors.primary : theme.colors.surface,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}>
                    <AppText color={on ? 'inverse' : 'secondary'} variant="caption" weight="semibold">
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Pressable
            disabled={busy}
            onPress={() => setMuteOriginal((value) => !value)}
            style={[
              styles.muteRow,
              {
                backgroundColor: muteOriginal ? theme.colors.primaryMuted : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <VolumeX color={theme.colors.primary} size={ms(16)} strokeWidth={2} />
            <AppText style={styles.muteCopy} variant="caption" weight="semibold">
              {muteOriginal ? 'Original audio will be muted' : 'Mute original audio'}
            </AppText>
          </Pressable>

          <View style={styles.hintRow}>
            <Clapperboard color={theme.colors.textMuted} size={ms(14)} strokeWidth={2} />
            <AppText color="muted" style={styles.hint} variant="caption">
              MP4 or MOV · up to 5 min · 250 MB. Reels stay on Reels and Feed.
            </AppText>
            <HideKeyboardButton />
          </View>
        </View>
      </KeyboardSheet>

      <ConfirmModal
        Icon={Clapperboard}
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        message="Your clip and caption will be lost if you leave now."
        onCancel={guard.keepEditing}
        onConfirm={guard.discard}
        title="Discard this reel?"
        tone="danger"
        visible={guard.asking}
      />
    </>
  );
}

type SourceTileProps = {
  Icon: LucideIcon;
  label: string;
  hint: string;
  onPress: () => void;
  tone?: 'brand' | 'accent';
};

function SourceTile({ Icon, label, hint, onPress, tone = 'brand' }: SourceTileProps) {
  const theme = useTheme();
  const color = tone === 'accent' ? theme.palette.tertiary.DEFAULT : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          borderColor: theme.colors.border,
          backgroundColor: pressed ? theme.colors.surface : theme.colors.background,
        },
      ]}>
      <View style={[styles.tileIcon, { backgroundColor: `${color}1A` }]}>
        <Icon color={color} size={ms(22)} strokeWidth={2} />
      </View>
      <AppText variant="label" weight="semibold">
        {label}
      </AppText>
      <AppText color="muted" variant="caption">
        {hint}
      </AppText>
    </Pressable>
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
  tile: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: ms(18),
    paddingVertical: vs(18),
    paddingHorizontal: s(12),
    alignItems: 'center',
    gap: vs(4),
  },
  tileIcon: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(4),
  },
  input: {
    minHeight: vs(64),
    borderRadius: ms(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    textAlignVertical: 'top',
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.4),
  },
  sectionLabel: {
    letterSpacing: 0.6,
    marginBottom: vs(8),
  },
  cats: {
    flexDirection: 'row',
    gap: s(8),
    paddingRight: s(8),
  },
  muteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  muteCopy: {
    flex: 1,
  },
  chip: {
    borderRadius: ms(999),
    paddingHorizontal: s(14),
    paddingVertical: vs(7),
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  hint: {
    flex: 1,
  },
});
