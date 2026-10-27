/**
 * Feed header — official lockup, alerts, inbox.
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { Bell, MessageCircle, Search } from 'lucide-react-native';

import { fontSize, ms, s } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, BrandLogo } from '@/shared/ui';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export type FeedHeaderProps = {
  unreadNotifications?: number;
  unreadMessages?: number;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  onOpenSearch: () => void;
};

/**
 * Sticky top chrome for the public community feed. Badges show only real unread counts.
 */
export function FeedHeader({
  unreadNotifications = 0,
  unreadMessages = 0,
  onOpenNotifications,
  onOpenMessages,
  onOpenSearch,
}: FeedHeaderProps) {
  const theme = useTheme();

  return (
    <ScreenHeader padded={false} style={styles.row}>
      <View style={styles.brand}>
        <BrandLogo size="header" />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Search"
          accessibilityRole="button"
          onPress={onOpenSearch}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <Search color={theme.colors.text} size={ms(18)} strokeWidth={2} />
        </Pressable>
        <Pressable
          accessibilityLabel={
            unreadNotifications > 0
              ? `Notifications, ${unreadNotifications} unread`
              : 'Notifications'
          }
          accessibilityRole="button"
          onPress={onOpenNotifications}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <Bell color={theme.colors.text} size={ms(18)} strokeWidth={2} />
          <CountBadge count={unreadNotifications} color={theme.colors.danger} />
        </Pressable>
        <Pressable
          accessibilityLabel={
            unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : 'Messages'
          }
          accessibilityRole="button"
          onPress={onOpenMessages}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <MessageCircle color={theme.colors.text} size={ms(18)} strokeWidth={2} />
          <CountBadge count={unreadMessages} color={theme.colors.danger} />
        </Pressable>
      </View>
    </ScreenHeader>
  );
}

function CountBadge({ count, color }: { count: number; color: string }) {
  if (count <= 0) {
    return null;
  }
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <AppText color="inverse" style={styles.badgeText} weight="bold">
        {count > 9 ? '9+' : String(count)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
  },
  brand: {
    flex: 1,
    marginRight: s(12),
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    flexShrink: 0,
  },
  iconBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -ms(3),
    right: -ms(3),
    minWidth: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    paddingHorizontal: ms(4),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: fontSize(10),
    lineHeight: fontSize(12),
    includeFontPadding: false,
  },
});
