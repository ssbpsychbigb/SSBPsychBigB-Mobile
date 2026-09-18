/**
 * Header overflow menu (web thread parity) and centered report dialog.
 */

import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export const CHAT_REPORT_REASONS = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'abuse', label: 'Abuse or threats' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
] as const;

export type ChatMenuItem = {
  key: string;
  label: string;
  Icon: LucideIcon;
  tone?: 'default' | 'danger';
  separatorBefore?: boolean;
};

export type ChatThreadMenuProps = {
  visible: boolean;
  items: ChatMenuItem[];
  busy?: boolean;
  onClose: () => void;
  onSelect: (key: string) => void;
};

/**
 * Anchored overflow menu with icon + label rows, matching the web thread actions.
 */
export function ChatThreadMenu({
  visible,
  items,
  busy,
  onClose,
  onSelect,
}: ChatThreadMenuProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cardBg = theme.mode === 'dark' ? theme.colors.surface : theme.colors.background;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.menuRoot}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.menuCard,
            {
              top: insets.top + vs(44),
              backgroundColor: cardBg,
              borderColor: theme.colors.border,
              shadowColor: '#0D1E34',
            },
          ]}>
          <ScrollView bounces={false} style={styles.menuScroll}>
            {items.map((item) => {
              const color =
                item.tone === 'danger' ? theme.colors.danger : theme.colors.text;
              return (
                <View key={item.key}>
                  {item.separatorBefore ? (
                    <View
                      style={[styles.separator, { backgroundColor: theme.colors.border }]}
                    />
                  ) : null}
                  <Pressable
                    disabled={busy}
                    onPress={() => onSelect(item.key)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed ? { backgroundColor: theme.colors.primaryMuted } : null,
                    ]}>
                    <item.Icon color={color} size={ms(20)} strokeWidth={2} />
                    <AppText style={[styles.menuLabel, { color }]} weight="medium">
                      {item.label}
                    </AppText>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export type ChatReportSheetProps = {
  visible: boolean;
  peerName: string;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

/**
 * Centered report dialog.
 */
export function ChatReportSheet({
  visible,
  peerName,
  busy,
  onClose,
  onSubmit,
}: ChatReportSheetProps) {
  const theme = useTheme();
  const [reason, setReason] = useState('abuse');

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <Pressable onPress={busy ? undefined : onClose} style={styles.dialogRoot}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <AppText style={styles.dialogTitle} variant="subtitle" weight="bold">
            Report {peerName}?
          </AppText>
          <AppText color="secondary" style={styles.dialogCopy} variant="caption">
            Choose a reason. They will also be blocked from messaging you.
          </AppText>
          {CHAT_REPORT_REASONS.map((item) => {
            const selected = reason === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setReason(item.value)}
                style={styles.reasonRow}>
                <View
                  style={[
                    styles.radio,
                    { borderColor: selected ? theme.colors.primary : theme.colors.border },
                  ]}>
                  {selected ? (
                    <View
                      style={[styles.radioDot, { backgroundColor: theme.colors.primary }]}
                    />
                  ) : null}
                </View>
                <AppText variant="body" weight={selected ? 'semibold' : 'regular'}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
          <View style={styles.dialogActions}>
            <Pressable disabled={busy} onPress={onClose} style={styles.dialogBtn}>
              <AppText color="muted" weight="semibold">
                Cancel
              </AppText>
            </Pressable>
            <Pressable disabled={busy} onPress={() => onSubmit(reason)} style={styles.dialogBtn}>
              <AppText style={{ color: theme.colors.danger }} weight="semibold">
                {busy ? 'Please wait…' : 'Report'}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuRoot: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    right: s(8),
    width: s(268),
    maxHeight: vs(420),
    borderRadius: ms(12),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: vs(4),
    elevation: 12,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  menuScroll: {
    maxHeight: vs(412),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize(16),
    lineHeight: lineHeight(16, 1.3),
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: vs(4),
    marginHorizontal: s(12),
  },
  dialogRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: s(28),
    backgroundColor: 'rgba(13,30,52,0.45)',
  },
  dialog: {
    borderRadius: ms(16),
    borderWidth: 1,
    paddingHorizontal: s(18),
    paddingTop: vs(18),
    paddingBottom: vs(10),
  },
  dialogTitle: {
    marginBottom: vs(6),
  },
  dialogCopy: {
    marginBottom: vs(12),
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingVertical: vs(8),
  },
  radio: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: s(16),
    marginTop: vs(10),
  },
  dialogBtn: {
    paddingVertical: vs(10),
    paddingHorizontal: s(4),
  },
});
