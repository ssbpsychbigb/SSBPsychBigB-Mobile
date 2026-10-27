/**
 * Shared building blocks for the post, reel, story and comment composers.
 */

import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardOff, Play, Plus, X, type LucideIcon } from 'lucide-react-native';
import Video from 'react-native-video';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

type ComposeHeaderProps = {
  title: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  busy?: boolean;
  leading?: ReactNode;
};

export function ComposeHeader({
  title,
  onClose,
  actionLabel,
  onAction,
  actionDisabled = false,
  busy = false,
  leading,
}: ComposeHeaderProps) {
  const theme = useTheme();
  const disabled = actionDisabled || busy;

  return (
    <View style={styles.header}>
      {leading ?? (
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          disabled={busy}
          hitSlop={10}
          onPress={onClose}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
          ]}>
          <X color={theme.colors.text} size={ms(18)} strokeWidth={2.2} />
        </Pressable>
      )}
      <AppText numberOfLines={1} style={styles.headerTitle} variant="subtitle" weight="bold">
        {title}
      </AppText>
      {actionLabel && onAction ? (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onAction}
        style={({ pressed }) => [
          styles.action,
          {
            backgroundColor: disabled && !busy ? theme.colors.border : theme.colors.primary,
            opacity: pressed ? 0.88 : 1,
          },
        ]}>
        {busy ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <AppText
            color={disabled ? 'muted' : 'inverse'}
            style={styles.actionLabel}
            variant="label"
            weight="semibold">
            {actionLabel}
          </AppText>
        )}
      </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

type ComposeAuthorProps = {
  caption: string;
  trailing?: ReactNode;
};

export function ComposeAuthor({ caption, trailing }: ComposeAuthorProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <View style={styles.author}>
      <SelfAvatar size={ms(42)} />
      <View style={styles.authorText}>
        <AppText numberOfLines={1} variant="label" weight="semibold">
          {user?.fullName || 'You'}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {caption}
        </AppText>
      </View>
      {trailing}
    </View>
  );
}

export function SelfAvatar({ size }: { size: number }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const photo = resolveUploadUrl(user?.profilePhotoPath || user?.officerPhotoPath);
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (photo) {
    return <Image source={{ uri: photo }} style={[box, { backgroundColor: theme.colors.surface }]} />;
  }
  return (
    <View style={[box, styles.initials, { backgroundColor: theme.colors.primary }]}>
      <AppText color="inverse" style={{ fontSize: size * 0.36 }} weight="bold">
        {getUserInitials(user?.fullName)}
      </AppText>
    </View>
  );
}

type MediaPreviewProps = {
  uri: string;
  kind?: 'image' | 'video';
  caption?: string;
  onRemove?: () => void;
  height?: number;
  paused?: boolean;
};

export function MediaPreview({
  uri,
  kind = 'image',
  caption,
  onRemove,
  height,
  paused = false,
}: MediaPreviewProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.preview,
        { height: height ?? vs(190), backgroundColor: theme.mode === 'dark' ? '#0B1220' : '#0F172A' },
      ]}>
      {kind === 'video' ? (
        <>
          <Video
            muted
            paused={paused}
            repeat
            resizeMode="cover"
            source={{ uri }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.playBadge}>
            <Play color="#FFFFFF" fill="#FFFFFF" size={ms(14)} />
          </View>
        </>
      ) : (
        <Image resizeMode="cover" source={{ uri }} style={StyleSheet.absoluteFill} />
      )}
      {caption ? (
        <View style={styles.previewCaption}>
          <AppText numberOfLines={1} style={styles.previewCaptionText} variant="caption" weight="semibold">
            {caption}
          </AppText>
        </View>
      ) : null}
      {onRemove ? (
        <Pressable
          accessibilityLabel="Remove media"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRemove}
          style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.75 : 1 }]}>
          <X color="#FFFFFF" size={ms(16)} strokeWidth={2.6} />
        </Pressable>
      ) : null}
    </View>
  );
}

export type StripItem = { key: string; uri: string; kind?: 'image' | 'video' };

type MediaStripProps = {
  items: StripItem[];
  onRemove?: (key: string) => void;
  onAdd?: () => void;
  singleHeight?: number;
};

/**
 * One item → large preview. Several → swipeable tiles with order numbers.
 */
export function MediaStrip({ items, onRemove, onAdd, singleHeight }: MediaStripProps) {
  const theme = useTheme();

  const only = items[0];
  if (items.length === 1 && only) {
    return (
      <MediaPreview
        height={singleHeight}
        kind={only.kind}
        onRemove={onRemove ? () => onRemove(only.key) : undefined}
        uri={only.uri}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.strip}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}>
      {items.map((item, index) => (
        <View key={item.key} style={styles.stripTile}>
          <MediaPreview
            caption={`${index + 1}/${items.length}`}
            height={STRIP_TILE_HEIGHT}
            kind={item.kind}
            onRemove={onRemove ? () => onRemove(item.key) : undefined}
            paused
            uri={item.uri}
          />
        </View>
      ))}
      {onAdd ? (
        <Pressable
          accessibilityLabel="Add more"
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => [
            styles.stripAdd,
            {
              borderColor: theme.colors.border,
              backgroundColor: pressed ? theme.colors.surface : theme.colors.background,
            },
          ]}>
          <Plus color={theme.colors.primary} size={ms(22)} strokeWidth={2.2} />
          <AppText color="brand" variant="caption" weight="semibold">
            Add
          </AppText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

/**
 * Small "hide keyboard" control for composer toolbars.
 */
export function HideKeyboardButton() {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel="Hide keyboard"
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => Keyboard.dismiss()}
      style={({ pressed }) => [
        styles.hideKb,
        { backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
      ]}>
      <KeyboardOff color={theme.colors.textSecondary} size={ms(18)} strokeWidth={2} />
    </Pressable>
  );
}

type ComposeToolProps = {
  Icon: LucideIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'brand' | 'accent';
};

export function ComposeTool({ Icon, label, onPress, disabled = false, tone = 'brand' }: ComposeToolProps) {
  const theme = useTheme();
  const color = tone === 'accent' ? theme.palette.tertiary.DEFAULT : theme.colors.primary;
  const background =
    tone === 'accent'
      ? `${theme.palette.tertiary.DEFAULT}1A`
      : theme.mode === 'dark'
        ? theme.colors.primaryMuted
        : theme.palette.primary[50];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tool,
        { backgroundColor: background, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
      ]}>
      <Icon color={color} size={ms(17)} strokeWidth={2.1} />
      <AppText style={[styles.toolLabel, { color }]} variant="caption" weight="semibold">
        {label}
      </AppText>
    </Pressable>
  );
}

const STRIP_TILE_HEIGHT = vs(150);

const styles = StyleSheet.create({
  strip: {
    gap: s(10),
    paddingRight: s(4),
  },
  stripTile: {
    width: s(120),
  },
  stripAdd: {
    width: s(90),
    height: STRIP_TILE_HEIGHT,
    borderRadius: ms(18),
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(4),
  },
  hideKb: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingVertical: vs(6),
  },
  iconBtn: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize(17),
    lineHeight: lineHeight(17, 1.3),
  },
  action: {
    minWidth: ms(76),
    height: ms(36),
    borderRadius: ms(18),
    paddingHorizontal: s(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    includeFontPadding: false,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginTop: vs(10),
  },
  authorText: {
    flex: 1,
    minWidth: 0,
  },
  initials: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    borderRadius: ms(18),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBadge: {
    position: 'absolute',
    top: vs(10),
    left: s(10),
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: ms(2),
  },
  previewCaption: {
    position: 'absolute',
    left: s(10),
    bottom: vs(10),
    maxWidth: '75%',
    borderRadius: ms(10),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  previewCaptionText: {
    color: '#FFFFFF',
  },
  removeBtn: {
    position: 'absolute',
    top: vs(10),
    right: s(10),
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    height: ms(38),
    paddingHorizontal: s(14),
    borderRadius: ms(19),
  },
  toolLabel: {
    includeFontPadding: false,
  },
});
