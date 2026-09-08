/**
 * Full-tab guest state for Bookmark, Learn, and Message.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen } from '@/shared/ui';

export type GuestUnlockPanelProps = {
  icon: ReactNode;
  title: string;
  description: string;
  /** Skip the full-screen scaffold when nested in stack chrome. */
  embedded?: boolean;
};

/**
 * Centered join panel that keeps the tab chrome visible for guests.
 */
export function GuestUnlockPanel({
  icon,
  title,
  description,
  embedded = false,
}: GuestUnlockPanelProps) {
  const theme = useTheme();
  const openRegister = useOpenAuth('Register');
  const openLogin = useOpenAuth('Login');

  const body = (
    <Animated.View entering={FadeInDown.duration(420)} style={styles.block}>
      <View
        style={[styles.iconWrap, { backgroundColor: theme.colors.primaryMuted }]}>
        {icon}
      </View>
      <AppText style={styles.title} variant="subtitle" weight="bold">
        {title}
      </AppText>
      <AppText color="secondary" style={styles.copy} variant="body">
        {description}
      </AppText>
      <View style={styles.actions}>
        <Button fullWidth onPress={openRegister}>
          Join BIGB
        </Button>
        <Button fullWidth onPress={openLogin} variant="secondary">
          Log in
        </Button>
      </View>
    </Animated.View>
  );

  if (embedded) {
    return <View style={styles.embedded}>{body}</View>;
  }

  return (
    <Screen contentStyle={styles.content} safeBottom={false}>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  embedded: {
    paddingTop: vs(24),
  },
  block: {
    alignItems: 'center',
    paddingHorizontal: s(8),
  },
  iconWrap: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(16),
  },
  title: {
    textAlign: 'center',
    marginBottom: vs(8),
  },
  copy: {
    textAlign: 'center',
    maxWidth: s(300),
    marginBottom: vs(24),
  },
  actions: {
    alignSelf: 'stretch',
    gap: ms(10),
  },
});
