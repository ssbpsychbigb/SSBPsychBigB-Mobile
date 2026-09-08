/**
 * Feed ranking tabs — For You / Latest / Following / Trending.
 */

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  FEED_TABS,
  type FeedTabKey,
} from '@/features/feed/data/feed-preview';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type FeedSegmentTabsProps = {
  active: FeedTabKey;
  onChange: (key: FeedTabKey) => void;
};

/**
 * Compact pill switcher under the composer.
 */
export function FeedSegmentTabs({ active, onChange }: FeedSegmentTabsProps) {
  const theme = useTheme();

  return (
    <View style={styles.shell}>
      <ScrollView
        contentContainerStyle={styles.row}
        directionalLockEnabled
        horizontal
        nestedScrollEnabled
        overScrollMode="never"
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}>
        {FEED_TABS.map((tab) => {
          const selected = tab.key === active;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(tab.key)}
              style={[
                styles.pill,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.background,
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}>
              <AppText
                color={selected ? 'inverse' : 'secondary'}
                style={styles.label}
                variant="caption"
                weight="semibold">
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: vs(40),
  },
  row: {
    paddingHorizontal: s(16),
    paddingRight: s(28),
    alignItems: 'center',
    paddingVertical: vs(2),
  },
  pill: {
    flexShrink: 0,
    marginRight: s(8),
    paddingHorizontal: s(16),
    height: vs(36),
    borderRadius: ms(999),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    includeFontPadding: false,
  },
});
