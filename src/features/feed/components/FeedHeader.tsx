/**
 * Feed header — official lockup, alerts, inbox.
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { Bell, MessageCircle } from 'lucide-react-native';

import { ms, s } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { BrandLogo } from '@/shared/ui';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export type FeedHeaderProps = {
  isAuthed: boolean;
  hasUnreadMessages?: boolean;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
};

/**
 * Sticky top chrome for the public community feed.
 */
export function FeedHeader({
  isAuthed,
  hasUnreadMessages = false,
  onOpenNotifications,
  onOpenMessages,
}: FeedHeaderProps) {
  const theme = useTheme();

  return (
    <ScreenHeader padded={false} style={styles.row}>
      <View style={styles.brand}>
        <BrandLogo size="header" />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Notifications"
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
          {isAuthed ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.danger }]} />
          ) : null}
        </Pressable>
        <Pressable
          accessibilityLabel="Messages"
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
          {hasUnreadMessages ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.danger }]} />
          ) : null}
        </Pressable>
      </View>
    </ScreenHeader>
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
    top: 8,
    right: 8,
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
