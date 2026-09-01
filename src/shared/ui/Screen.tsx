/**
 * Theme-aware screen scaffold with safe-area insets.
 */

import type { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Apply top safe-area inset (default true). */
  safeTop?: boolean;
  /** Apply bottom safe-area inset (default true; set false inside tab screens). */
  safeBottom?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Pull-to-refresh (only when `scroll` is true). */
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
};

/**
 * Full-screen layout that respects safe areas and theme background.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  safeTop = true,
  safeBottom = true,
  style,
  contentStyle,
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: safeTop ? insets.top : 0,
    paddingBottom: safeBottom ? insets.bottom : 0,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    ...style,
  };

  const bodyStyle: ViewStyle = {
    ...(padded
      ? {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.lg,
        }
      : {}),
    ...contentStyle,
  };

  if (scroll) {
    return (
      <View style={containerStyle}>
        <ScrollView
          contentContainerStyle={bodyStyle}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                colors={[theme.colors.primary]}
                onRefresh={() => {
                  void onRefresh();
                }}
                refreshing={refreshing}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    );
  }

  return <View style={[containerStyle, bodyStyle]}>{children}</View>;
}
