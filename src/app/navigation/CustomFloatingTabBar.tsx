/**
 * Solid tab strip overlaid on the scene. The FAB lift is not painted,
 * so it does not add a second white box above the icons.
 */

import { useContext, useEffect, useMemo, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import type { NavigationState } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clapperboard,
  FileText,
  Hash,
  Home,
  UserRound,
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
  /**
   * Pager scroll position. Drives the active style on the UI thread so the
   * highlight moves with the page instead of after it settles.
   */
  position?: Animated.AnimatedInterpolation<number> | null;
};

type SideTabKey = Exclude<AppTabRouteKey, 'myCourse'>;

/**
 * Design-matched bottom chrome: 5 equal tabs, floating My Course FAB.
 */
export function CustomFloatingTabBar({
  navigationState,
  jumpTo,
  position = null,
}: CustomFloatingTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const initials = getUserInitials(user?.fullName);

  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const bottomPad = Math.max(insets.bottom, vs(8));
  const activeKey = navigationState.routes[navigationState.index]?.key;
  const active = theme.colors.primary;
  const inactive = theme.colors.text;
  const tabWidth = width / 5;

  const renderSideIcon = (key: SideTabKey, focused: boolean, color: string) => {
    if (key === 'homepage') {
      return <Home color={color} size={ms(22)} strokeWidth={focused ? 2.5 : 2} />;
    }
    if (key === 'reels') {
      return (
        <Clapperboard
          color={color}
          size={ms(22)}
          strokeWidth={focused ? 2.5 : 2}
        />
      );
    }
    if (key === 'communities') {
      return <Hash color={color} size={ms(22)} strokeWidth={focused ? 2.5 : 2} />;
    }

    return accessToken ? (
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
    ) : (
      <UserRound color={color} size={ms(22)} strokeWidth={focused ? 2.5 : 2} />
    );
  };

  useEffect(() => {
    return () => onHeightChange?.(0);
  }, [onHeightChange]);

  return (
    <View
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.height);
        if (next > 0) {
          onHeightChange?.(next);
        }
      }}
      pointerEvents="box-none"
      style={styles.shell}>
      {/* Unpainted lift — only the FAB sits here, not a white box. */}
      <View pointerEvents="box-none" style={{ height: FAB_LIFT }} />

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
            const isCenter = route.key === 'myCourse';

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                onPress={() => jumpTo(route.key)}
                style={[styles.tab, { width: tabWidth }]}>
                <View style={styles.iconSlot}>
                  {isCenter ? null : (
                    <FocusCrossfade
                      count={navigationState.routes.length}
                      focused={focused}
                      index={index}
                      position={position}>
                      {(isActive) =>
                        renderSideIcon(
                          route.key as SideTabKey,
                          isActive,
                          isActive ? active : inactive,
                        )
                      }
                    </FocusCrossfade>
                  )}
                </View>
                <View style={styles.labelSlot}>
                  <FocusCrossfade
                    count={navigationState.routes.length}
                    focused={focused}
                    index={index}
                    position={position}>
                    {(isActive) => (
                      <AppText
                        numberOfLines={1}
                        style={[
                          styles.label,
                          {
                            color: isActive ? active : inactive,
                            fontFamily: resolveFontFamily(
                              isActive ? 'semibold' : 'medium',
                            ),
                          },
                        ]}>
                        {route.title}
                      </AppText>
                    )}
                  </FocusCrossfade>
                </View>
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

type FocusCrossfadeProps = {
  position?: Animated.AnimatedInterpolation<number> | null;
  index: number;
  count: number;
  focused: boolean;
  children: (focused: boolean) => ReactNode;
};

/**
 * Crossfades active and inactive chrome with the pager position.
 * Falls back to the settled index until the pager position is bound.
 */
function FocusCrossfade({
  position,
  index,
  count,
  focused,
  children,
}: FocusCrossfadeProps) {
  const layers = useMemo(
    () => (position ? tabFocusOpacities(position, index, count) : null),
    [count, index, position],
  );

  if (!layers) {
    return <>{children(focused)}</>;
  }

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.crossfade, { opacity: layers.off }]}>
        {children(false)}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.crossfade, { opacity: layers.on }]}>
        {children(true)}
      </Animated.View>
    </>
  );
}

function tabFocusOpacities(
  position: Animated.AnimatedInterpolation<number>,
  tabIndex: number,
  count: number,
) {
  const inputRange = Array.from({ length: count }, (_, i) => i);

  return {
    on: position.interpolate({
      inputRange,
      outputRange: inputRange.map((i) => (i === tabIndex ? 1 : 0)),
      extrapolate: 'clamp',
    }),
    off: position.interpolate({
      inputRange,
      outputRange: inputRange.map((i) => (i === tabIndex ? 0 : 1)),
      extrapolate: 'clamp',
    }),
  };
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
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
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSlot: {
    height: lineHeight(11, 1.27),
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossfade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
  avatar: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
