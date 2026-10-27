/**
 * In-screen back chrome for social stack destinations (Reels, Network, …).
 */

import type { ReactElement, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

import { ms, s, vs } from '@/shared/lib/responsive';
import { useTabBarInset } from '@/shared/lib/use-tab-bar-inset';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/Text';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export type SocialStackChromeProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  /** Caption lines under the title. Default 1; Network uses 2 so the line is not clipped. */
  subtitleLines?: number;
  /** False on tab destinations that already have a bottom bar. */
  showBack?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  onNearEnd?: () => void;
};

/**
 * Matches Feed typography — no native stack header.
 * * Title row stays pinned below the status bar; only the body scrolls.
 */
export function SocialStackChrome({
  title,
  subtitle,
  children,
  rightSlot,
  showBack = true,
  subtitleLines = 1,
  refreshControl,
  onNearEnd,
}: SocialStackChromeProps) {
  const theme = useTheme();
  const navigation = useNavigation();
  const tabBarInset = useTabBarInset();

  return (
    <Screen
      contentStyle={styles.shell}
      padded={false}
      safeBottom={false}
      style={{ backgroundColor: theme.colors.background }}>
      <ScreenHeader
        style={subtitleLines > 1 ? styles.headerMultiline : undefined}>
        {showBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={ms(10)}
            onPress={() => navigation.goBack()}
            style={[
              styles.back,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}>
            <ArrowLeft color={theme.colors.text} size={ms(20)} strokeWidth={2} />
          </Pressable>
        ) : null}
        <View style={styles.titles}>
          <AppText numberOfLines={1} variant="subtitle" weight="bold">
            {title}
          </AppText>
          {subtitle ? (
            <AppText color="muted" numberOfLines={subtitleLines} variant="caption">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.right}>{rightSlot}</View>
      </ScreenHeader>
      <ScrollView
        contentContainerStyle={[styles.scrollBody, { paddingBottom: vs(16) + tabBarInset }]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          if (!onNearEnd) {
            return;
          }
          const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 280
          ) {
            onNearEnd();
          }
        }}
        refreshControl={refreshControl}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={false}
        style={styles.flex}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerMultiline: {
    alignItems: 'flex-start',
  },
  back: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(10),
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: ms(8),
  },
  scrollBody: {
    paddingBottom: vs(28),
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: s(16),
  },
});
