/**
 * Intentional empty-state for modules that are scaffolded but not wired yet.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/Text';

export type ModulePlaceholderProps = {
  icon: ReactNode;
  title: string;
  description: string;
  hint?: string;
};

/**
 * Soft empty module panel used on Feed / Learn / AI until APIs land.
 */
export function ModulePlaceholder({
  icon,
  title,
  description,
  hint,
}: ModulePlaceholderProps) {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors.primaryMuted },
        ]}>
        {icon}
      </View>
      <AppText variant="subtitle" weight="semibold" style={styles.title}>
        {title}
      </AppText>
      <AppText color="secondary" style={styles.description} variant="body">
        {description}
      </AppText>
      {hint ? (
        <AppText color="muted" style={styles.hint} variant="caption">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(28),
    gap: ms(12),
  },
  iconWrap: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: s(300),
  },
  hint: {
    textAlign: 'center',
    marginTop: vs(4),
  },
});
