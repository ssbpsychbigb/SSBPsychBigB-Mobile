/**
 * In-screen back chrome for social stack destinations (Reels, Network, …).
 */

import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

import { ms, s, vs } from '@/shared/lib/responsive';
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
}: SocialStackChromeProps) {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <Screen
      contentStyle={styles.shell}
      padded={false}
      safeBottom={false}
      style={{
        backgroundColor:
          theme.mode === 'dark' ? theme.colors.background : theme.palette.primary[50],
      }}>
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
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
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
    minWidth: ms(40),
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
