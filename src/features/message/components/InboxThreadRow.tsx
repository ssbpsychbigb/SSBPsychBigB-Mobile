/**
 * Single inbox row — Instagram/WhatsApp density, no card chrome.
 */

import { Pressable, StyleSheet, View } from 'react-native';

import type { InboxThreadPreview } from '@/features/message/data/messages-preview';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type InboxThreadRowProps = {
  thread: InboxThreadPreview;
  showDivider: boolean;
  onPress: () => void;
};

/**
 * Flat conversation row with avatar, preview, time, and unread count.
 */
export function InboxThreadRow({ thread, showDivider, onPress }: InboxThreadRowProps) {
  const theme = useTheme();
  const unread = thread.unread > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed ? { backgroundColor: theme.colors.primaryMuted } : null,
      ]}>
      <View style={[styles.avatar, { backgroundColor: thread.color }]}>
        <AppText color="inverse" style={styles.initials} weight="bold">
          {thread.initials}
        </AppText>
        {thread.online ? (
          <View
            style={[
              styles.online,
              {
                borderColor: theme.colors.background,
                backgroundColor: theme.colors.success,
              },
            ]}
          />
        ) : null}
      </View>

      <View
        style={[
          styles.body,
          showDivider ? { borderBottomColor: theme.colors.border } : styles.bodyFlush,
        ]}>
        <View style={styles.topLine}>
          <AppText
            numberOfLines={1}
            style={styles.name}
            weight={unread ? 'bold' : 'semibold'}>
            {thread.name}
          </AppText>
          <AppText
            color={unread ? 'brand' : 'muted'}
            style={styles.time}
            variant="caption"
            weight={unread ? 'semibold' : 'regular'}>
            {thread.timeLabel}
          </AppText>
        </View>
        <View style={styles.bottomLine}>
          <AppText
            color={unread ? 'primary' : 'secondary'}
            numberOfLines={1}
            style={styles.preview}
            variant="caption"
            weight={unread ? 'medium' : 'regular'}>
            {thread.lastMessage}
          </AppText>
          {unread ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <AppText color="inverse" style={styles.badgeLabel} variant="caption" weight="bold">
                {thread.unread > 9 ? '9+' : String(thread.unread)}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: s(14),
    minHeight: vs(76),
  },
  avatar: {
    width: ms(54),
    height: ms(54),
    borderRadius: ms(27),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  initials: {
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.1),
  },
  online: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    borderWidth: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingRight: s(14),
    paddingVertical: vs(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bodyFlush: {
    borderBottomWidth: 0,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: vs(4),
  },
  name: {
    flex: 1,
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.25),
  },
  time: {
    includeFontPadding: false,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  preview: {
    flex: 1,
    lineHeight: lineHeight(13, 1.35),
  },
  badge: {
    minWidth: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(5),
  },
  badgeLabel: {
    includeFontPadding: false,
    fontSize: fontSize(10),
  },
});
