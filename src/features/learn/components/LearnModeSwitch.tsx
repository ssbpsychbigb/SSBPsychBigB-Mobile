/**
 * Underline tabs for Learn hub — Explore / My learning / Tests.
 */

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { LearnHubMode } from '@/features/learn/types/course.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

const MODES: { id: LearnHubMode; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'mine', label: 'My learning' },
  { id: 'tests', label: 'Tests' },
];

export type LearnModeSwitchProps = {
  value: LearnHubMode;
  onChange: (mode: LearnHubMode) => void;
};

/**
 * Compact text tabs — no filled capsules.
 */
export function LearnModeSwitch({ value, onChange }: LearnModeSwitchProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {MODES.map((mode) => {
          const on = value === mode.id;
          return (
            <Pressable
              key={mode.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(mode.id)}
              style={styles.tab}>
              <AppText
                color={on ? 'primary' : 'muted'}
                numberOfLines={1}
                variant="label"
                weight={on ? 'bold' : 'semibold'}>
                {mode.label}
              </AppText>
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor: on ? theme.colors.primary : 'transparent',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -s(16),
    marginBottom: vs(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: s(8),
    flexGrow: 1,
  },
  tab: {
    flexGrow: 1,
    paddingHorizontal: s(12),
    paddingTop: vs(4),
    minHeight: ms(40),
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: vs(8),
  },
  line: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
});
