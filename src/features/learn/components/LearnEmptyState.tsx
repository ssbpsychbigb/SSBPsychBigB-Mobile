/**
 * Quiet empty / error copy — no boxed “card on white”.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ms, vs } from '@/shared/lib/responsive';
import { AppText, Button } from '@/shared/ui';

export type LearnEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Centered empty state that sits on the screen background.
 */
export function LearnEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: LearnEmptyStateProps) {
  return (
    <View style={styles.block}>
      <View style={styles.icon}>{icon}</View>
      <AppText style={styles.title} variant="label" weight="bold">
        {title}
      </AppText>
      <AppText color="secondary" style={styles.copy} variant="caption">
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <Button onPress={onAction} size="sm" variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    paddingVertical: vs(48),
    paddingHorizontal: ms(12),
  },
  icon: {
    marginBottom: vs(14),
    opacity: 0.9,
  },
  title: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
    marginTop: vs(6),
    marginBottom: vs(18),
    maxWidth: ms(280),
  },
});
