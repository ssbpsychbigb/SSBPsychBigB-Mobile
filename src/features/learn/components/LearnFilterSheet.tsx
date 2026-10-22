/**
 * Bottom sheet for Learn sort + filters — one control, not chip rows.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DEFAULT_LEARN_FILTERS,
  LEARN_EXAM_OPTIONS,
  LEARN_LEVEL_OPTIONS,
  LEARN_PRICE_OPTIONS,
  LEARN_SORT_OPTIONS,
  type LearnFilterDraft,
} from '@/features/learn/lib/learn-filters';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

export type LearnFilterSheetProps = {
  visible: boolean;
  value: LearnFilterDraft;
  onClose: () => void;
  onApply: (next: LearnFilterDraft) => void;
};

/**
 * Apple Music / Udemy-style filter sheet.
 */
export function LearnFilterSheet({
  visible,
  value,
  onClose,
  onApply,
}: LearnFilterSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: Math.max(insets.bottom, vs(16)),
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <AppText variant="subtitle" weight="bold">
            Sort & filters
          </AppText>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}>
          <Section title="Sort by">
            {LEARN_SORT_OPTIONS.map((item) => (
              <Choice
                key={item.id}
                label={item.label}
                on={draft.sort === item.id}
                onPress={() => setDraft((prev) => ({ ...prev, sort: item.id }))}
              />
            ))}
          </Section>

          <Section title="Price">
            {LEARN_PRICE_OPTIONS.map((item) => (
              <Choice
                key={String(item.id)}
                label={item.label}
                on={draft.price === item.id}
                onPress={() => setDraft((prev) => ({ ...prev, price: item.id }))}
              />
            ))}
          </Section>

          <Section title="Exam">
            {LEARN_EXAM_OPTIONS.map((item) => (
              <Choice
                key={item.id || 'any'}
                label={item.label}
                on={draft.examGoal === item.id}
                onPress={() =>
                  setDraft((prev) => ({ ...prev, examGoal: item.id }))
                }
              />
            ))}
          </Section>

          <Section title="Level">
            {LEARN_LEVEL_OPTIONS.map((item) => (
              <Choice
                key={String(item.id)}
                label={item.label}
                on={draft.difficulty === item.id}
                onPress={() =>
                  setDraft((prev) => ({ ...prev, difficulty: item.id }))
                }
              />
            ))}
          </Section>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              onPress={() => {
                setDraft(DEFAULT_LEARN_FILTERS);
                onApply(DEFAULT_LEARN_FILTERS);
              }}
              style={styles.flex}
              variant="secondary">
              Reset
            </Button>
            <Button
              onPress={() => onApply(draft)}
              style={styles.flex}>
              Apply
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <AppText color="muted" variant="caption" weight="semibold">
        {title.toUpperCase()}
      </AppText>
      <View style={styles.wrap}>{children}</View>
    </View>
  );
}

function Choice({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choice,
        {
          backgroundColor: on ? theme.colors.primary : theme.colors.surface,
          borderColor: on ? theme.colors.primary : theme.colors.border,
        },
      ]}>
      <AppText
        color={on ? 'inverse' : 'secondary'}
        variant="caption"
        weight="semibold">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13, 30, 52, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingHorizontal: s(20),
    paddingTop: vs(8),
    maxHeight: '88%',
  },
  scroll: {
    marginTop: vs(8),
    maxHeight: vs(420),
  },
  handle: {
    alignSelf: 'center',
    width: s(36),
    height: vs(4),
    borderRadius: ms(99),
    marginBottom: vs(6),
  },
  section: {
    gap: vs(8),
    marginTop: vs(6),
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  choice: {
    height: ms(36),
    paddingHorizontal: s(14),
    borderRadius: ms(18),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: vs(12),
  },
  flex: {
    flex: 1,
  },
});
