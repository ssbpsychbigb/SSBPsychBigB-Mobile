/**
 * One notification — avatar + type badge, rich headline, preview, time and ⋯ options.
 */

import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import {
  AtSign,
  Bell,
  BookOpen,
  ClipboardCheck,
  Heart,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Reply,
  ShieldAlert,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import { getUserInitials } from '@/features/home/lib/user-initials';
import { compactTime } from '@/features/notifications/lib/group-notifications';
import type {
  AppNotification,
  NotificationKind,
} from '@/features/notifications/types/notification.types';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

const BIGB_MARK = require('../../../shared/assets/brand/bigb-logo-mark.png');

type KindStyle = { Icon: LucideIcon; color: string };

export const KIND_STYLE: Record<NotificationKind, KindStyle> = {
  follow: { Icon: UserPlus, color: '#1877F2' },
  like: { Icon: Heart, color: '#F02849' },
  comment: { Icon: MessageCircle, color: '#16A34A' },
  reply: { Icon: Reply, color: '#16A34A' },
  mention: { Icon: AtSign, color: '#7C3AED' },
  share: { Icon: Repeat2, color: '#0EA5E9' },
  broadcast: { Icon: Megaphone, color: '#1351A1' },
  reminder: { Icon: Bell, color: '#F59E0B' },
  course: { Icon: BookOpen, color: '#CC5800' },
  assessment: { Icon: ClipboardCheck, color: '#CC5800' },
  moderation: { Icon: ShieldAlert, color: '#DC2626' },
  group: { Icon: Users, color: '#1667CF' },
};

const AVATAR_COLORS = ['#1351A1', '#1667CF', '#1877F2', '#CC5800', '#0E2B50', '#16A34A'];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? '#1351A1';
}

const QUOTE_KINDS = new Set<NotificationKind>(['comment', 'reply', 'mention']);

export type NotificationRowProps = {
  item: AppNotification;
  onPress: () => void;
  onOptions: () => void;
  onFollowBack: () => void;
  followBusy: boolean;
};

export function NotificationAvatar({
  item,
  size = AVATAR,
}: {
  item: AppNotification;
  size?: number;
}) {
  const theme = useTheme();
  const actor = item.actors[0];
  const isSystem = !actor || actor.kind === 'system';
  const { Icon, color } = KIND_STYLE[item.kind] || KIND_STYLE.broadcast;
  const photo = resolveUploadUrl(actor?.avatarPath);
  const [photoFailed, setPhotoFailed] = useState(false);
  const circle = { width: size, height: size, borderRadius: size / 2 };
  const badge = Math.round(size * 0.42);

  return (
    <View style={{ width: size, height: size }}>
      {isSystem ? (
        <View
          style={[
            styles.avatar,
            styles.brandDisc,
            circle,
            { borderColor: theme.colors.border },
          ]}>
          <Image
            resizeMode="contain"
            source={BIGB_MARK}
            style={{ width: size * 1.14, height: size * 1.14 }}
          />
        </View>
      ) : photo && !photoFailed ? (
        <Image
          onError={() => setPhotoFailed(true)}
          source={{ uri: photo }}
          style={[styles.avatar, circle, { backgroundColor: theme.colors.surface }]}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            circle,
            { backgroundColor: avatarColor(actor?.id || actor?.name || item.id) },
          ]}>
          <AppText color="inverse" style={{ fontSize: size * 0.34 }} weight="bold">
            {getUserInitials(actor?.name)}
          </AppText>
        </View>
      )}
      <View
        style={[
          styles.kindBadge,
          {
            width: badge,
            height: badge,
            borderRadius: badge / 2,
            backgroundColor: color,
            borderColor: theme.colors.background,
          },
        ]}>
        <Icon
          color="#FFFFFF"
          fill={item.kind === 'like' ? '#FFFFFF' : 'transparent'}
          size={badge * 0.5}
          strokeWidth={2.6}
        />
      </View>
    </View>
  );
}

export function NotificationRow({
  item,
  onPress,
  onOptions,
  onFollowBack,
  followBusy,
}: NotificationRowProps) {
  const theme = useTheme();
  const dark = theme.mode === 'dark';
  const actor = item.actors[0];
  const isSystem = !actor || actor.kind === 'system';
  const showFollowBack = item.actions.some((action) => action.id === 'follow_back');
  // Social headlines are verb phrases ("liked your post"); system ones are full sentences.
  const sentence = !isSystem && /^[a-z]/.test(item.headline);
  const quote = QUOTE_KINDS.has(item.kind) ? item.detail?.trim() : '';
  const detail = quote ? '' : item.detail?.trim();
  const unreadBg = dark ? `${theme.palette.primary[900]}66` : theme.palette.primary[50];

  return (
    <Pressable
      accessibilityHint="Opens the related content"
      accessibilityRole="button"
      delayLongPress={350}
      onLongPress={onOptions}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed
            ? theme.colors.surface
            : item.unread
              ? unreadBg
              : theme.colors.background,
        },
      ]}>
      {item.unread ? (
        <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
      ) : null}

      <NotificationAvatar item={item} />

      <View style={styles.body}>
        <AppText numberOfLines={3} style={[styles.headline, { color: theme.colors.text }]}>
          {sentence ? (
            <>
              <AppText style={styles.headline} weight="bold">
                {actor?.name}
              </AppText>{' '}
              {item.headline}
            </>
          ) : (
            <AppText style={styles.headline} weight="semibold">
              {item.headline}
            </AppText>
          )}
        </AppText>

        {quote ? (
          <AppText color="secondary" numberOfLines={2} style={styles.detail}>
            “{quote}”
          </AppText>
        ) : detail ? (
          <AppText color="secondary" numberOfLines={2} style={styles.detail}>
            {detail}
          </AppText>
        ) : null}

        {showFollowBack ? (
          <Pressable
            accessibilityRole="button"
            disabled={followBusy}
            hitSlop={ms(4)}
            onPress={onFollowBack}
            style={({ pressed }) => [
              styles.followBack,
              {
                backgroundColor: theme.colors.primary,
                opacity: followBusy || pressed ? 0.75 : 1,
              },
            ]}>
            <UserPlus color="#FFFFFF" size={ms(14)} strokeWidth={2.4} />
            <AppText color="inverse" style={styles.followLabel} weight="semibold">
              {followBusy ? 'Following…' : 'Follow back'}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.trail}>
        <AppText color="muted" style={styles.time}>
          {compactTime(item.createdAt)}
        </AppText>
        <Pressable
          accessibilityLabel="Notification options"
          accessibilityRole="button"
          hitSlop={ms(10)}
          onPress={onOptions}
          style={({ pressed }) => [
            styles.more,
            pressed ? { backgroundColor: theme.colors.border } : null,
          ]}>
          <MoreHorizontal color={theme.colors.textSecondary} size={ms(18)} strokeWidth={2.2} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const AVATAR = ms(48);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: s(18),
    paddingRight: s(10),
    paddingVertical: vs(12),
    gap: s(12),
  },
  unreadDot: {
    position: 'absolute',
    left: s(6),
    top: vs(12) + AVATAR / 2 - ms(3.5),
    width: ms(7),
    height: ms(7),
    borderRadius: ms(4),
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandDisc: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
  },
  kindBadge: {
    position: 'absolute',
    right: -ms(3),
    bottom: -ms(3),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: vs(4),
    paddingTop: vs(1),
  },
  headline: {
    fontSize: fontSize(14),
    lineHeight: lineHeight(14, 1.42),
  },
  detail: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.4),
  },
  followBack: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginTop: vs(6),
    paddingHorizontal: s(14),
    height: ms(32),
    borderRadius: ms(16),
  },
  followLabel: {
    fontSize: fontSize(13),
  },
  trail: {
    alignItems: 'flex-end',
    gap: vs(4),
    minWidth: ms(36),
  },
  time: {
    fontSize: fontSize(12),
    lineHeight: lineHeight(12, 1.5),
    paddingRight: s(6),
  },
  more: {
    width: ms(30),
    height: ms(26),
    borderRadius: ms(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
