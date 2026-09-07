/**
 * Discover rail — Network + Communities (Reels lives in the tab bar).
 */

import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Hash, Users } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type FeedDiscoverKey = Extract<keyof RootStackParamList, 'Network'> | 'communities';

export type FeedDiscoverRailProps = {
  onOpen: (key: FeedDiscoverKey) => void;
};

const ITEMS: {
  key: FeedDiscoverKey;
  label: string;
  hint: string;
  Icon: LucideIcon;
}[] = [
  { key: 'Network', label: 'Network', hint: 'Officers & mentors', Icon: Users },
  { key: 'communities', label: 'Community', hint: 'Prep circles', Icon: Hash },
];

/**
 * Two-up hub under briefs — Reels is a dedicated tab.
 */
export function FeedDiscoverRail({ onOpen }: FeedDiscoverRailProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}>
      {ITEMS.map((item, index) => {
        const Icon = item.Icon;

        return (
          <View key={item.key} style={styles.cellWrap}>
            {index > 0 ? (
              <View
                style={[styles.rule, { backgroundColor: theme.colors.border }]}
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpen(item.key)}
              style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.82 : 1 }]}>
              <View
                style={[
                  styles.icon,
                  { backgroundColor: theme.colors.primaryMuted },
                ]}>
                <Icon color={theme.colors.primary} size={ms(18)} strokeWidth={2} />
              </View>
              <AppText style={styles.label} variant="label">
                {item.label}
              </AppText>
              <AppText color="muted" style={styles.hint} variant="caption">
                {item.hint}
              </AppText>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: ms(20),
    overflow: 'hidden',
    shadowColor: '#0D1E34',
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 0.05,
    shadowRadius: ms(10),
    elevation: ms(2),
  },
  cellWrap: {
    flex: 1,
    flexDirection: 'row',
  },
  rule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: vs(12),
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(8),
  },
  icon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(6),
  },
  label: {
    includeFontPadding: false,
  },
  hint: {
    includeFontPadding: false,
    marginTop: vs(2),
  },
});
