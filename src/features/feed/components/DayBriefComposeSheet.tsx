/**
 * Day Brief composer — clean Instagram-style pick → edit → preview → share.
 */

import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AtSign,
  Camera,
  ChevronLeft,
  Eye,
  Hash,
  ImagePlus,
  Link2,
  MapPin,
  Music2,
  Sticker,
  Type,
  Users,
  Vote,
  X,
} from 'lucide-react-native';

import type { PickedAsset } from '@/features/auth/types/register-form';
import { ComposeHeader } from '@/features/feed/components/ComposeParts';
import {
  STORY_BG_COLORS,
  STORY_CAPTION_MAX,
  STORY_MUSIC_TRACKS,
  STORY_OVERLAY_MAX,
  STORY_VISIBILITY_OPTIONS,
  type StoryStickerDraft,
  type StoryVisibility,
} from '@/features/feed/lib/day-brief-constants';
import { captureFeedPhoto, MediaPickError } from '@/features/feed/lib/pick-feed-image';
import { MAX_STORY_ITEMS, pickStoryMediaList } from '@/features/feed/lib/pick-feed-video';
import { NewMessageSheet } from '@/features/message/components/NewMessageSheet';
import type { ChatPerson } from '@/features/message/types/chat.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, KeyboardSheet, useDiscardGuard } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

export type DayBriefComposeInput = {
  caption: string;
  images: PickedAsset[];
  mode: 'media' | 'text';
  visibility: StoryVisibility;
  audienceUserIds: string[];
  excludeUserIds: string[];
  backgroundColor: string;
  overlayText: string;
  musicId: string;
  musicLabel: string;
  stickers: StoryStickerDraft[];
};

export type DayBriefComposeSheetProps = {
  visible: boolean;
  busy: boolean;
  seedCaption?: string;
  onClose: () => void;
  onSubmit: (input: DayBriefComposeInput) => void;
};

type Step = 'pick' | 'edit' | 'preview';
type PickerMode = 'audience' | 'hide' | 'mention' | null;
type StickerKind = StoryStickerDraft['type'];
type EditPanel = 'text' | 'music' | 'stickers' | 'audience';

let stickerSeq = 0;

const STICKER_TOOLS: {
  key: StickerKind;
  Icon: typeof AtSign;
  label: string;
}[] = [
  { key: 'mention', Icon: AtSign, label: 'Mention' },
  { key: 'hashtag', Icon: Hash, label: 'Hashtag' },
  { key: 'location', Icon: MapPin, label: 'Place' },
  { key: 'link', Icon: Link2, label: 'Link' },
  { key: 'poll', Icon: Vote, label: 'Poll' },
  { key: 'text', Icon: Type, label: 'Text' },
];

/**
 * Members share portrait media or text as a 24-hour story.
 */
export function DayBriefComposeSheet({
  visible,
  busy,
  seedCaption,
  onClose,
  onSubmit,
}: DayBriefComposeSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const [step, setStep] = useState<Step>('pick');
  const [panel, setPanel] = useState<EditPanel>('text');
  const [mode, setMode] = useState<'media' | 'text'>('media');
  const [caption, setCaption] = useState('');
  const [overlayText, setOverlayText] = useState('');
  const [images, setImages] = useState<PickedAsset[]>([]);
  const [visibility, setVisibility] = useState<StoryVisibility>('public');
  const [audience, setAudience] = useState<ChatPerson[]>([]);
  const [hidden, setHidden] = useState<ChatPerson[]>([]);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [bgColor, setBgColor] = useState<string>(STORY_BG_COLORS[0]);
  const [musicId, setMusicId] = useState('original');
  const [stickers, setStickers] = useState<StoryStickerDraft[]>([]);
  const [stickerDraft, setStickerDraft] = useState('');
  const [stickerKind, setStickerKind] = useState<StickerKind | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep('pick');
      setPanel('text');
      setMode('media');
      setCaption('');
      setOverlayText('');
      setImages([]);
      setVisibility('public');
      setAudience([]);
      setHidden([]);
      setPickerMode(null);
      setBgColor(STORY_BG_COLORS[0]);
      setMusicId('original');
      setStickers([]);
      setStickerDraft('');
      setStickerKind(null);
      return;
    }
    if (seedCaption) {
      setCaption(seedCaption.slice(0, STORY_CAPTION_MAX));
    }
  }, [visible, seedCaption]);

  const dirty =
    caption.trim().length > 0 ||
    overlayText.trim().length > 0 ||
    images.length > 0 ||
    stickers.length > 0;

  const guard = useDiscardGuard(
    dirty && !busy,
    () => {
      if (!busy) {
        onClose();
      }
    },
    visible,
  );

  const roomLeft = MAX_STORY_ITEMS - images.length;
  const visibilityMeta =
    STORY_VISIBILITY_OPTIONS.find((option) => option.key === visibility) ||
    STORY_VISIBILITY_OPTIONS[0];
  const musicMeta =
    STORY_MUSIC_TRACKS.find((track) => track.id === musicId) || STORY_MUSIC_TRACKS[0];

  const canContinue =
    mode === 'text'
      ? Boolean(overlayText.trim() || caption.trim())
      : images.length > 0;

  const canvasWidth = Math.min(windowWidth - s(40), s(320));
  const canvasHeight = Math.min(canvasWidth * (16 / 9), windowHeight * 0.38);

  const fieldStyle = {
    color: theme.colors.text,
    backgroundColor: theme.mode === 'dark' ? theme.colors.surface : '#F3F4F6',
    borderColor: theme.colors.border,
    fontFamily: resolveFontFamily('regular'),
  };

  const pickMedia = async (replace = false) => {
    if (!replace && roomLeft <= 0) {
      showToast.info('Story limit', `You can add up to ${MAX_STORY_ITEMS} at once.`);
      return;
    }
    try {
      const picked = await pickStoryMediaList(replace ? 1 : roomLeft);
      if (picked.skipped) {
        showToast.info('Skipped', 'Videos over 60 seconds were left out.');
      }
      if (!picked.items.length) {
        return;
      }
      setMode('media');
      setImages((current) =>
        replace
          ? picked.items.slice(0, 1)
          : [...current, ...picked.items].slice(0, MAX_STORY_ITEMS),
      );
      setStep('edit');
      setPanel('text');
    } catch (error) {
      if (error instanceof MediaPickError) {
        showToast.info('Gallery', error.message);
      }
    }
  };

  const takePhoto = async (replace = false) => {
    if (!replace && roomLeft <= 0) {
      showToast.info('Story limit', `You can add up to ${MAX_STORY_ITEMS} at once.`);
      return;
    }
    try {
      const photo = await captureFeedPhoto();
      if (!photo) {
        return;
      }
      setMode('media');
      setImages((current) =>
        replace ? [photo] : [...current, photo].slice(0, MAX_STORY_ITEMS),
      );
      setStep('edit');
      setPanel('text');
    } catch (error) {
      if (error instanceof MediaPickError) {
        showToast.info('Camera', error.message);
      }
    }
  };

  const pushSticker = (
    sticker: Omit<StoryStickerDraft, 'id' | 'x' | 'y'> &
      Partial<Pick<StoryStickerDraft, 'x' | 'y'>>,
  ) => {
    stickerSeq += 1;
    // Keep stickers in the lower-middle band so they don't cover the hero.
    const baseY = 0.58 + stickers.length * 0.08;
    setStickers((current) => [
      ...current,
      {
        id: `s${stickerSeq}`,
        x: 0.5,
        y: Math.min(0.82, baseY),
        ...sticker,
      },
    ]);
    setStickerDraft('');
    setStickerKind(null);
  };

  const addTypedSticker = () => {
    if (!stickerKind || stickerKind === 'mention') {
      return;
    }
    const value = stickerDraft.trim();
    if (!value) {
      showToast.info('Sticker', 'Type something first.');
      return;
    }
    if (stickerKind === 'poll') {
      const parts = value
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length < 3) {
        showToast.info('Poll', 'Use: Question | Yes | No');
        return;
      }
      pushSticker({
        type: 'poll',
        label: parts[0]!.slice(0, 80),
        value: parts[0]!,
        options: parts.slice(1, 5),
      });
      return;
    }
    const cleaned = value.replace(/^[@#]/, '');
    const prefix = stickerKind === 'hashtag' ? '#' : '';
    pushSticker({
      type: stickerKind,
      label:
        stickerKind === 'link'
          ? 'Link'
          : stickerKind === 'location'
            ? cleaned
            : `${prefix}${cleaned}`,
      value: cleaned,
    });
  };

  const selectStickerTool = (key: StickerKind) => {
    if (stickerKind === key) {
      setStickerKind(null);
      setStickerDraft('');
      return;
    }
    setStickerKind(key);
    setStickerDraft('');
    if (key === 'mention') {
      setPickerMode('mention');
    }
  };

  const share = () => {
    if (!canContinue) {
      return;
    }
    if (visibility === 'close_friends' && audience.length === 0) {
      showToast.info('Close friends', 'Pick at least one person for this story.');
      setPanel('audience');
      setPickerMode('audience');
      return;
    }
    onSubmit({
      caption: caption.trim().slice(0, STORY_CAPTION_MAX),
      images: mode === 'media' ? images : [],
      mode,
      visibility,
      audienceUserIds: audience.map((person) => person.id),
      excludeUserIds: hidden.map((person) => person.id),
      backgroundColor: bgColor,
      overlayText: overlayText.trim().slice(0, STORY_OVERLAY_MAX),
      musicId: musicMeta.id,
      musicLabel: musicMeta.label,
      stickers,
    });
  };

  const headerAction = () => {
    if (step === 'pick') {
      if (mode === 'text' && canContinue) {
        setStep('edit');
        setPanel('text');
      }
      return;
    }
    if (step === 'edit') {
      if (!canContinue) {
        showToast.info(
          'Story',
          mode === 'text' ? 'Add your text first.' : 'Add a photo first.',
        );
        return;
      }
      setStep('preview');
      return;
    }
    share();
  };

  const renderCanvas = (tall = false) => {
    const height = tall
      ? Math.min(windowHeight * 0.56, canvasWidth * (16 / 9))
      : canvasHeight;
    const showOverlay = Boolean(
      overlayText.trim() || (mode === 'text' && caption.trim()),
    );

    return (
      <View
        style={[
          styles.canvasShell,
          {
            width: canvasWidth,
            height,
            backgroundColor: mode === 'text' ? bgColor : '#111827',
            borderColor: theme.colors.border,
          },
        ]}>
        {mode === 'media' && images[0] ? (
          <Image
            resizeMode="cover"
            source={{ uri: images[0].uri }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        {/* Soft scrim so overlay/stickers stay readable */}
        <View pointerEvents="none" style={styles.canvasScrim} />

        {showOverlay ? (
          <AppText color="inverse" style={styles.canvasOverlay} weight="bold">
            {overlayText.trim() || caption.trim()}
          </AppText>
        ) : null}

        {stickers.length ? (
          <View style={styles.stickerStack} pointerEvents="none">
            {stickers.map((sticker) => (
              <View key={sticker.id} style={styles.canvasSticker}>
                <AppText color="inverse" variant="caption" weight="semibold">
                  {sticker.type === 'poll'
                    ? `📊 ${sticker.label}`
                    : sticker.label || sticker.value}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        {images.length > 1 ? (
          <View style={styles.segmentBadge}>
            <AppText color="inverse" variant="caption" weight="semibold">
              1/{images.length}
            </AppText>
          </View>
        ) : null}
      </View>
    );
  };

  const PanelTab = ({
    id,
    label,
    Icon,
    badge,
  }: {
    id: EditPanel;
    label: string;
    Icon: typeof Type;
    badge?: number;
  }) => {
    const active = panel === id;
    return (
      <Pressable
        onPress={() => setPanel(id)}
        style={[
          styles.panelTab,
          {
            backgroundColor: active
              ? theme.colors.primaryMuted
              : theme.colors.background,
            borderColor: active ? theme.colors.primary : theme.colors.border,
          },
        ]}>
        <Icon
          color={active ? theme.colors.primary : theme.colors.textMuted}
          size={ms(16)}
          strokeWidth={2.2}
        />
        <AppText
          color={active ? 'brand' : 'secondary'}
          variant="caption"
          weight="semibold">
          {label}
        </AppText>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
            <AppText color="inverse" style={styles.badgeText}>
              {badge}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <>
      <KeyboardSheet
        height={0.94}
        onRequestClose={guard.requestClose}
        visible={visible}>
        <ComposeHeader
          actionDisabled={
            busy ||
            (step === 'pick' && !(mode === 'text' && canContinue)) ||
            (step !== 'pick' && !canContinue)
          }
          actionLabel={
            step === 'pick'
              ? mode === 'text'
                ? 'Continue'
                : undefined
              : step === 'edit'
                ? 'Preview'
                : 'Share'
          }
          busy={busy}
          leading={
            step === 'pick' ? undefined : (
              <Pressable
                accessibilityLabel="Back"
                hitSlop={10}
                onPress={() => {
                  if (step === 'preview') {
                    setStep('edit');
                    return;
                  }
                  setStep('pick');
                }}
                style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
                <ChevronLeft color={theme.colors.text} size={ms(20)} strokeWidth={2.2} />
              </Pressable>
            )
          }
          onAction={
            step === 'pick' && mode !== 'text' ? undefined : headerAction
          }
          onClose={guard.requestClose}
          title={
            step === 'pick'
              ? 'New story'
              : step === 'edit'
                ? 'Edit story'
                : 'Preview'
          }
        />

        <ScrollView
          bounces
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, vs(16)) + vs(12) },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.scroll}>
          {step === 'pick' ? (
            <>
              <AppText color="secondary" style={styles.lead} variant="caption">
                Choose how you want to start. You’ll decorate it next.
              </AppText>
              <View style={styles.modeRow}>
                {(['media', 'text'] as const).map((key) => {
                  const active = mode === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        setMode(key);
                        if (key === 'text') {
                          setImages([]);
                        }
                      }}
                      style={[
                        styles.modeChip,
                        {
                          borderColor: active
                            ? theme.colors.primary
                            : theme.colors.border,
                          backgroundColor: active
                            ? theme.colors.primaryMuted
                            : theme.colors.background,
                        },
                      ]}>
                      <AppText
                        color={active ? 'brand' : 'primary'}
                        variant="caption"
                        weight="semibold">
                        {key === 'media' ? 'Photo / video' : 'Text only'}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {mode === 'media' ? (
                <View style={styles.sources}>
                  <Pressable
                    onPress={() => void takePhoto()}
                    style={[
                      styles.picker,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}>
                    <View
                      style={[
                        styles.pickerIcon,
                        { backgroundColor: `${theme.palette.tertiary.DEFAULT}1A` },
                      ]}>
                      <Camera
                        color={theme.palette.tertiary.DEFAULT}
                        size={ms(26)}
                        strokeWidth={2}
                      />
                    </View>
                    <AppText variant="label" weight="semibold">
                      Camera
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => void pickMedia()}
                    style={[
                      styles.picker,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}>
                    <View
                      style={[
                        styles.pickerIcon,
                        { backgroundColor: `${theme.colors.primary}1A` },
                      ]}>
                      <ImagePlus
                        color={theme.colors.primary}
                        size={ms(26)}
                        strokeWidth={2}
                      />
                    </View>
                    <AppText variant="label" weight="semibold">
                      Gallery
                    </AppText>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.colorRow}>
                    {STORY_BG_COLORS.map((color) => (
                      <Pressable
                        key={color}
                        onPress={() => setBgColor(color)}
                        style={[
                          styles.swatch,
                          {
                            backgroundColor: color,
                            borderColor:
                              bgColor === color ? theme.colors.text : 'transparent',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <View style={[styles.textCanvas, { backgroundColor: bgColor }]}>
                    <TextInput
                      editable={!busy}
                      maxLength={STORY_OVERLAY_MAX}
                      multiline
                      onChangeText={setOverlayText}
                      placeholder="Type your story…"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      style={[
                        styles.textCanvasInput,
                        { fontFamily: resolveFontFamily('bold') },
                      ]}
                      value={overlayText}
                    />
                  </View>
                </>
              )}
            </>
          ) : null}

          {step === 'edit' ? (
            <>
              {/* One clear hero canvas — nothing overlapping from outside */}
              <View style={styles.canvasBlock}>{renderCanvas(false)}</View>

              {mode === 'media' ? (
                <View style={styles.mediaLinks}>
                  <Pressable onPress={() => void takePhoto(true)} style={styles.linkBtn}>
                    <Camera color={theme.colors.primary} size={ms(14)} strokeWidth={2.2} />
                    <AppText color="brand" variant="caption" weight="semibold">
                      Retake
                    </AppText>
                  </Pressable>
                  <View
                    style={[styles.linkDot, { backgroundColor: theme.colors.border }]}
                  />
                  <Pressable onPress={() => void pickMedia(true)} style={styles.linkBtn}>
                    <ImagePlus
                      color={theme.colors.primary}
                      size={ms(14)}
                      strokeWidth={2.2}
                    />
                    <AppText color="brand" variant="caption" weight="semibold">
                      Replace
                    </AppText>
                  </Pressable>
                  {roomLeft > 0 ? (
                    <>
                      <View
                        style={[
                          styles.linkDot,
                          { backgroundColor: theme.colors.border },
                        ]}
                      />
                      <Pressable
                        onPress={() => void pickMedia(false)}
                        style={styles.linkBtn}>
                        <AppText color="brand" variant="caption" weight="semibold">
                          Add another
                        </AppText>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              ) : (
                <View style={styles.colorRow}>
                  {STORY_BG_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setBgColor(color)}
                      style={[
                        styles.swatch,
                        {
                          backgroundColor: color,
                          borderColor:
                            bgColor === color ? theme.colors.text : 'transparent',
                        },
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Tool tabs — one panel at a time */}
              <ScrollView
                horizontal
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.panelTabs}>
                <PanelTab Icon={Type} id="text" label="Text" />
                <PanelTab Icon={Music2} id="music" label="Music" />
                <PanelTab
                  Icon={Sticker}
                  badge={stickers.length || undefined}
                  id="stickers"
                  label="Stickers"
                />
                <PanelTab Icon={Users} id="audience" label="Audience" />
              </ScrollView>

              <View
                style={[
                  styles.panelCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}>
                {panel === 'text' ? (
                  <View style={styles.panelBody}>
                    <AppText variant="caption" weight="semibold">
                      Text on story
                    </AppText>
                    <TextInput
                      editable={!busy}
                      maxLength={STORY_OVERLAY_MAX}
                      onChangeText={setOverlayText}
                      placeholder="Words on the photo"
                      placeholderTextColor={theme.colors.textMuted}
                      style={[styles.input, fieldStyle]}
                      value={overlayText}
                    />
                    <AppText variant="caption" weight="semibold">
                      Caption
                    </AppText>
                    <TextInput
                      editable={!busy}
                      maxLength={STORY_CAPTION_MAX}
                      multiline
                      onChangeText={setCaption}
                      placeholder="@username notifies them"
                      placeholderTextColor={theme.colors.textMuted}
                      style={[styles.input, styles.captionInput, fieldStyle]}
                      value={caption}
                    />
                    <AppText color="muted" style={styles.counter} variant="caption">
                      {caption.length}/{STORY_CAPTION_MAX}
                    </AppText>
                  </View>
                ) : null}

                {panel === 'music' ? (
                  <View style={styles.panelBody}>
                    <AppText variant="caption" weight="semibold">
                      Choose audio label
                    </AppText>
                    <AppText color="muted" variant="caption">
                      Shown on your story. Streaming music comes later.
                    </AppText>
                    <View style={styles.chipWrap}>
                      {STORY_MUSIC_TRACKS.map((track) => {
                        const active = track.id === musicId;
                        return (
                          <Pressable
                            key={track.id}
                            onPress={() => setMusicId(track.id)}
                            style={[
                              styles.chip,
                              {
                                borderColor: active
                                  ? theme.colors.primary
                                  : theme.colors.border,
                                backgroundColor: active
                                  ? theme.colors.primaryMuted
                                  : theme.colors.background,
                              },
                            ]}>
                            <Music2
                              color={
                                active
                                  ? theme.colors.primary
                                  : theme.colors.textMuted
                              }
                              size={ms(13)}
                              strokeWidth={2.2}
                            />
                            <AppText
                              color={active ? 'brand' : 'primary'}
                              variant="caption"
                              weight="semibold">
                              {track.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                    <AppText color="secondary" variant="caption">
                      Selected: {musicMeta.label}
                    </AppText>
                  </View>
                ) : null}

                {panel === 'stickers' ? (
                  <View style={styles.panelBody}>
                    <AppText variant="caption" weight="semibold">
                      Add a sticker
                    </AppText>
                    <AppText color="muted" variant="caption">
                      Tap to select · tap again to cancel · Mention opens people
                    </AppText>
                    <View style={styles.chipWrap}>
                      {STICKER_TOOLS.map((tool) => {
                        const active = stickerKind === tool.key;
                        return (
                          <Pressable
                            key={tool.key}
                            onPress={() => selectStickerTool(tool.key)}
                            style={[
                              styles.chip,
                              {
                                borderColor: active
                                  ? theme.colors.primary
                                  : theme.colors.border,
                                backgroundColor: active
                                  ? theme.colors.primaryMuted
                                  : theme.colors.background,
                              },
                            ]}>
                            <tool.Icon
                              color={
                                active
                                  ? theme.colors.primary
                                  : theme.colors.textMuted
                              }
                              size={ms(14)}
                              strokeWidth={2.2}
                            />
                            <AppText
                              color={active ? 'brand' : 'primary'}
                              variant="caption"
                              weight="semibold">
                              {tool.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>

                    {stickerKind === 'mention' ? (
                      <Pressable
                        onPress={() => setPickerMode('mention')}
                        style={[
                          styles.mentionCta,
                          {
                            borderColor: theme.colors.primary,
                            backgroundColor: theme.colors.primaryMuted,
                          },
                        ]}>
                        <AtSign
                          color={theme.colors.primary}
                          size={ms(16)}
                          strokeWidth={2.2}
                        />
                        <AppText color="brand" weight="semibold">
                          Choose who to mention
                        </AppText>
                      </Pressable>
                    ) : null}

                    {stickerKind && stickerKind !== 'mention' ? (
                      <View style={styles.stickerEditor}>
                        <TextInput
                          autoFocus
                          editable={!busy}
                          onChangeText={setStickerDraft}
                          placeholder={
                            stickerKind === 'poll'
                              ? 'Ready? | Yes | No'
                              : stickerKind === 'link'
                                ? 'https://…'
                                : stickerKind === 'hashtag'
                                  ? 'SSBprep'
                                  : 'Type here'
                          }
                          placeholderTextColor={theme.colors.textMuted}
                          style={[styles.input, fieldStyle, { flex: 1 }]}
                          value={stickerDraft}
                        />
                        <View style={styles.stickerActions}>
                          <Pressable
                            onPress={() => {
                              setStickerKind(null);
                              setStickerDraft('');
                            }}>
                            <AppText color="muted" weight="semibold">
                              Cancel
                            </AppText>
                          </Pressable>
                          <Pressable
                            onPress={addTypedSticker}
                            style={[
                              styles.addBtn,
                              { backgroundColor: theme.colors.primary },
                            ]}>
                            <AppText color="inverse" weight="bold">
                              Add
                            </AppText>
                          </Pressable>
                        </View>
                      </View>
                    ) : null}

                    {stickers.length ? (
                      <View style={styles.addedList}>
                        <AppText variant="caption" weight="semibold">
                          On this story
                        </AppText>
                        {stickers.map((sticker) => (
                          <View
                            key={sticker.id}
                            style={[
                              styles.addedRow,
                              {
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.background,
                              },
                            ]}>
                            <AppText style={styles.addedLabel} weight="semibold">
                              {sticker.label || sticker.value}
                            </AppText>
                            <Pressable
                              accessibilityLabel="Remove sticker"
                              hitSlop={10}
                              onPress={() =>
                                setStickers((current) =>
                                  current.filter((row) => row.id !== sticker.id),
                                )
                              }
                              style={styles.removeBtn}>
                              <X
                                color={theme.colors.textMuted}
                                size={ms(16)}
                                strokeWidth={2.4}
                              />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <AppText color="muted" variant="caption">
                        No stickers yet.
                      </AppText>
                    )}
                  </View>
                ) : null}

                {panel === 'audience' ? (
                  <View style={styles.panelBody}>
                    <AppText variant="caption" weight="semibold">
                      Who can see this
                    </AppText>
                    <View style={styles.chipWrap}>
                      {STORY_VISIBILITY_OPTIONS.map((option) => {
                        const active = option.key === visibility;
                        return (
                          <Pressable
                            key={option.key}
                            onPress={() => {
                              setVisibility(option.key);
                              if (option.key === 'close_friends') {
                                setPickerMode('audience');
                              }
                            }}
                            style={[
                              styles.chip,
                              {
                                borderColor: active
                                  ? theme.colors.primary
                                  : theme.colors.border,
                                backgroundColor: active
                                  ? theme.colors.primaryMuted
                                  : theme.colors.background,
                              },
                            ]}>
                            <AppText
                              color={active ? 'brand' : 'primary'}
                              variant="caption"
                              weight="semibold">
                              {option.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                    <AppText color="muted" variant="caption">
                      {visibilityMeta?.hint}
                    </AppText>
                    {visibility === 'close_friends' ? (
                      <Pressable
                        onPress={() => setPickerMode('audience')}
                        style={styles.linkRow}>
                        <Users
                          color={theme.colors.primary}
                          size={ms(16)}
                          strokeWidth={2.2}
                        />
                        <AppText color="brand" weight="semibold">
                          {audience.length
                            ? `${audience.length} close friends`
                            : 'Pick close friends'}
                        </AppText>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={() => setPickerMode('hide')}
                      style={styles.linkRow}>
                      <Eye
                        color={theme.colors.textMuted}
                        size={ms(16)}
                        strokeWidth={2.2}
                      />
                      <AppText color="secondary" weight="semibold">
                        {hidden.length
                          ? `Hide from ${hidden.length} people`
                          : 'Hide from…'}
                      </AppText>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}

          {step === 'preview' ? (
            <>
              <AppText color="secondary" style={styles.lead} variant="caption">
                This is how your story will look on Home.
              </AppText>
              <View style={styles.canvasBlock}>{renderCanvas(true)}</View>
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <Row label="Audience" value={visibilityMeta?.label || 'Everyone'} />
                <Row label="Music" value={musicMeta.label} />
                <Row
                  label="Stickers"
                  value={
                    stickers.length
                      ? stickers.map((item) => item.label || item.value).join(' · ')
                      : 'None'
                  }
                />
                {caption.trim() ? <Row label="Caption" value={caption.trim()} /> : null}
                {hidden.length ? (
                  <Row label="Hidden from" value={`${hidden.length} people`} />
                ) : null}
              </View>
              <Pressable
                onPress={() => setStep('edit')}
                style={[
                  styles.editAgain,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}>
                <AppText weight="semibold">Edit again</AppText>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </KeyboardSheet>

      <NewMessageSheet
        busy={false}
        onClose={() => {
          if (pickerMode === 'mention') {
            setStickerKind(null);
          }
          setPickerMode(null);
        }}
        onPickPerson={(person) => {
          if (pickerMode === 'mention') {
            const username = (person.username || '').replace(/^@/, '').trim();
            if (!username) {
              showToast.info('Mention', 'That member has no username yet.');
              return;
            }
            pushSticker({
              type: 'mention',
              label: `@${username}`,
              value: username,
            });
            setCaption((current) => {
              if (current.includes(`@${username}`)) {
                return current;
              }
              return `${current} @${username}`.trim().slice(0, STORY_CAPTION_MAX);
            });
            setPickerMode(null);
            setPanel('stickers');
            return;
          }
          if (pickerMode === 'hide') {
            setHidden((current) => {
              if (current.some((item) => item.id === person.id)) {
                return current.filter((item) => item.id !== person.id);
              }
              return [...current, person];
            });
            return;
          }
          setAudience((current) => {
            if (current.some((item) => item.id === person.id)) {
              return current.filter((item) => item.id !== person.id);
            }
            return [...current, person];
          });
        }}
        onPickUsername={(username) => {
          if (pickerMode !== 'mention') {
            return;
          }
          const cleaned = username.replace(/^@/, '').trim();
          if (!cleaned) {
            return;
          }
          pushSticker({
            type: 'mention',
            label: `@${cleaned}`,
            value: cleaned,
          });
          setPickerMode(null);
        }}
        visible={Boolean(pickerMode)}
      />

      <ConfirmModal
        Icon={ImagePlus}
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        message="Your story draft will be lost if you leave now."
        onCancel={guard.keepEditing}
        onConfirm={guard.discard}
        title="Discard this story?"
        tone="danger"
        visible={guard.asking}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewRow}>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText style={styles.previewValue} variant="caption" weight="semibold">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    marginTop: vs(2),
  },
  body: {
    gap: vs(12),
    flexGrow: 1,
  },
  lead: {
    textAlign: 'center',
  },
  backBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    gap: s(8),
  },
  modeChip: {
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
  },
  sources: {
    flexDirection: 'row',
    gap: s(12),
  },
  picker: {
    flex: 1,
    borderWidth: 1,
    borderRadius: ms(18),
    paddingVertical: vs(28),
    alignItems: 'center',
    gap: vs(8),
  },
  pickerIcon: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCanvas: {
    minHeight: vs(200),
    borderRadius: ms(18),
    padding: s(16),
    justifyContent: 'center',
  },
  textCanvasInput: {
    color: '#FFFFFF',
    fontSize: fontSize(28),
    lineHeight: lineHeight(28, 1.25),
    textAlign: 'center',
  },
  canvasBlock: {
    alignItems: 'center',
  },
  canvasShell: {
    borderRadius: ms(20),
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  canvasScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  canvasOverlay: {
    position: 'absolute',
    top: '28%',
    left: s(18),
    right: s(18),
    textAlign: 'center',
    fontSize: fontSize(24),
    lineHeight: lineHeight(24, 1.2),
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  stickerStack: {
    position: 'absolute',
    left: s(14),
    right: s(14),
    bottom: vs(18),
    gap: vs(8),
    alignItems: 'center',
  },
  canvasSticker: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(7),
    maxWidth: '100%',
  },
  segmentBadge: {
    position: 'absolute',
    top: vs(12),
    right: s(12),
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: ms(999),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },
  mediaLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(10),
    paddingVertical: vs(2),
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  linkDot: {
    width: ms(3),
    height: ms(3),
    borderRadius: ms(2),
  },
  panelTabs: {
    gap: s(8),
    paddingVertical: vs(2),
  },
  panelTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  badge: {
    minWidth: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(4),
  },
  badgeText: {
    fontSize: fontSize(10),
    lineHeight: lineHeight(10, 1),
  },
  panelCard: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(14),
  },
  panelBody: {
    gap: vs(10),
  },
  input: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(11),
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.35),
  },
  captionInput: {
    minHeight: vs(72),
    textAlignVertical: 'top',
  },
  counter: {
    textAlign: 'right',
    marginTop: vs(-4),
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    justifyContent: 'center',
  },
  swatch: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    borderWidth: ms(2),
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  mentionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
  },
  stickerEditor: {
    gap: vs(10),
  },
  stickerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: s(16),
  },
  addBtn: {
    borderRadius: ms(10),
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
  },
  addedList: {
    gap: vs(8),
  },
  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: ms(12),
    paddingLeft: s(12),
    paddingRight: s(6),
    paddingVertical: vs(8),
    gap: s(8),
  },
  addedLabel: {
    flex: 1,
  },
  removeBtn: {
    width: ms(32),
    height: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingVertical: vs(4),
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(14),
    gap: vs(10),
  },
  previewRow: {
    gap: vs(2),
  },
  previewValue: {
    marginTop: vs(2),
  },
  editAgain: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(18),
    paddingVertical: vs(10),
  },
});
