/**
 * Custom floating bottom tab bar — flat white bar + elevated center FAB.
 * Used as `renderTabBar` for react-native-tab-view (pager-view swipe).
 *
 * * FAB lift lives INSIDE the bar height (paddingTop) so Android does not clip it.
 */

import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { NavigationState } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bookmark,
  FileText,
  Home,
  MessageCircle,
} from 'lucide-react-native';

import type { AppTabRoute, AppTabRouteKey } from '@/app/navigation/types';
import { useAuthStore } from '@/features/auth';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

/** Icon + label row height. */
export const TAB_BAR_BASE_HEIGHT = vs(56);
/** Space reserved above the white bar for the floating FAB (inside layout). */
export const FAB_LIFT = vs(28);
export const FAB_SIZE = ms(56);

export type CustomFloatingTabBarProps = {
  navigationState: NavigationState<AppTabRoute>;
  jumpTo: (key: string) => void;
  messageHasUnread?: boolean;
};

type SideTabKey = Exclude<AppTabRouteKey, 'myCourse'>;

/**
 * Design-matched bottom chrome: 5 equal tabs, floating My Course FAB.
 */
export function CustomFloatingTabBar({
  navigationState,
  jumpTo,
  messageHasUnread = true,
}: CustomFloatingTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const initials = getUserInitials(user?.fullName);

  const bottomPad = Math.max(insets.bottom, vs(8));
  const activeKey = navigationState.routes[navigationState.index]?.key;
  const active = theme.colors.primary;
  const inactive = theme.colors.text;
  const tabWidth = width / 5;

  const renderSideIcon = (key: SideTabKey, focused: boolean, color: string) => {
    if (key === 'homepage') {
      return <Home color={color} size={ms(22)} strokeWidth={focused ? 2.5 : 2} />;
    }
    if (key === 'bookmark') {
      return (
        <Bookmark color={color} size={ms(22)} strokeWidth={focused ? 2.5 : 2} />
      );
    }
    if (key === 'message') {
      return (
        <View style={styles.iconWrap}>
          <MessageCircle
            color={color}
            size={ms(22)}
            strokeWidth={focused ? 2.5 : 2}
          />
          {messageHasUnread ? (
            <View
              style={[styles.badge, { backgroundColor: theme.colors.danger }]}
            />
          ) : null}
        </View>
      );
    }

    return (
      <View
        style={[
          styles.avatar,
          {
            borderColor: focused ? active : theme.colors.border,
            backgroundColor: focused
              ? theme.colors.primaryMuted
              : theme.palette.neutral[100],
          },
        ]}>
        <AppText
          style={{
            color: focused ? active : inactive,
            fontSize: fontSize(10),
            lineHeight: lineHeight(10, 1.2),
            fontFamily: resolveFontFamily('semibold'),
          }}>
          {initials}
        </AppText>
      </View>
    );
  };

  return (
    <View style={styles.shell}>
      {/* Transparent lift zone — scene shows through; FAB sits here. */}
      <View style={{ height: FAB_LIFT }} pointerEvents="box-none" />

      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: bottomPad,
            borderTopColor: theme.colors.border,
          },
        ]}>
        <View style={[styles.row, { height: TAB_BAR_BASE_HEIGHT }]}>
          {navigationState.routes.map((route, index) => {
            const focused = navigationState.index === index;
            const color = focused ? active : inactive;
            const isCenter = route.key === 'myCourse';

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                onPress={() => jumpTo(route.key)}
                style={[styles.tab, { width: tabWidth }]}>
                {isCenter ? (
                  <View style={styles.iconSlot} />
                ) : (
                  <View style={styles.iconSlot}>
                    {renderSideIcon(route.key as SideTabKey, focused, color)}
                  </View>
                )}
                <AppText
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color: focused ? active : inactive,
                      fontFamily: resolveFontFamily(
                        focused ? 'semibold' : 'medium',
                      ),
                    },
                  ]}>
                  {route.title}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="My Course"
        accessibilityState={{ selected: activeKey === 'myCourse' }}
        onPress={() => jumpTo('myCourse')}
        style={({ pressed }) => [
          styles.fab,
          {
            left: width / 2 - FAB_SIZE / 2,
            top: FAB_LIFT - FAB_SIZE / 2 + vs(2),
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.92 : 1,
          },
        ]}>
        <FileText color="#FFFFFF" size={ms(24)} strokeWidth={2.25} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    // iOS
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: vs(-3) },
    shadowOpacity: 0.08,
    shadowRadius: ms(8),
    // Android
    elevation: ms(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: vs(6),
    gap: ms(3),
  },
  iconSlot: {
    height: vs(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    position: 'relative',
  },
  label: {
    fontSize: fontSize(11),
    lineHeight: lineHeight(11, 1.27),
    textAlign: 'center',
    includeFontPadding: false,
  },
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: vs(6) },
    shadowOpacity: 0.38,
    shadowRadius: ms(10),
    elevation: ms(16),
    zIndex: 30,
  },
  badge: {
    position: 'absolute',
    top: vs(-1),
    right: s(-3),
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatar: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
