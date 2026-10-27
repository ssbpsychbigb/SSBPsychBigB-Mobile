/**
 * Post options — a bottom sheet. Report sits last, in red, away from Edit and Pin.
 */

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flag, Pencil, Pin, Trash2, type LucideIcon } from 'lucide-react-native';

import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export const FEED_REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'abuse', label: 'Abuse' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
] as const;

export type FeedPostMenuTarget = {
  id: string;
  isOwn: boolean;
  pinned: boolean;
};

export type FeedPostMenuProps = {
  target: FeedPostMenuTarget | null;
  busy?: boolean;
  onClose: () => void;
  onSelect: (key: 'edit' | 'pin' | 'delete' | 'report') => void;
};

type MenuRow = {
  key: 'edit' | 'pin' | 'delete' | 'report';
  label: string;
  hint: string;
  Icon: LucideIcon;
  danger?: boolean;
};

/**
 * Bottom sheet for a feed card or a reel. One tap closes it.
 */
export function FeedPostMenu({ target, busy, onClose, onSelect }: FeedPostMenuProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const rows: MenuRow[] = target?.isOwn
    ? [
        {
          key: 'edit',
          label: 'Edit',
          hint: 'Change the words. Photos and video stay.',
          Icon: Pencil,
        },
        {
          key: 'pin',
          label: target.pinned ? 'Unpin from profile' : 'Pin to profile',
          hint: target.pinned
            ? 'It returns to its place by time.'
            : 'It becomes the first tile on your profile.',
          Icon: Pin,
        },
        {
          key: 'delete',
          label: 'Delete',
          hint: 'This cannot be undone.',
          Icon: Trash2,
          danger: true,
        },
      ]
    : [
        {
          key: 'report',
          label: 'Report post',
          hint: 'Moderators review this. It is separate from everyday actions.',
          Icon: Flag,
          danger: true,
        },
      ];

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={Boolean(target)}>
      <View style={styles.modal}>
      <Pressable onPress={busy ? undefined : onClose} style={styles.backdrop} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: insets.bottom + vs(8),
          },
        ]}>
        <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
        <AppText color="muted" style={styles.sheetLabel} variant="caption" weight="semibold">
          {target?.isOwn ? 'Your post' : 'Post'}
        </AppText>
        {rows.map((row, index) => {
          const color = row.danger ? theme.colors.danger : theme.colors.text;
          const divided = row.danger && index > 0;
          return (
            <View key={row.key}>
              {divided ? (
                <View style={[styles.hairline, { backgroundColor: theme.colors.border }]} />
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => onSelect(row.key)}
                style={({ pressed }) => [
                  styles.row,
                  pressed ? { backgroundColor: theme.colors.surface } : null,
                ]}>
                <row.Icon color={color} size={ms(20)} strokeWidth={2} />
                <View style={styles.rowCopy}>
                  <AppText style={{ color }} variant="body" weight="semibold">
                    {row.label}
                  </AppText>
                  <AppText color="muted" variant="caption">
                    {row.hint}
                  </AppText>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
      </View>
    </Modal>
  );
}

export type FeedReportSheetProps = {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

/**
 * Centered report reasons — same density as chat report.
 */
export function FeedReportSheet({
  visible,
  busy,
  onClose,
  onSubmit,
}: FeedReportSheetProps) {
  const theme = useTheme();
  const [reason, setReason] = useState('spam');

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
            Report this post?
          </AppText>
          <AppText color="secondary" style={styles.dialogCopy} variant="caption">
            Moderators review reports. False reports can affect your account.
          </AppText>
          {FEED_REPORT_REASONS.map((item) => {
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
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13,30,52,0.45)',
  },
  sheet: {
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingTop: vs(8),
  },
  grabber: {
    alignSelf: 'center',
    width: ms(36),
    height: vs(4),
    borderRadius: ms(2),
    marginBottom: vs(8),
  },
  sheetLabel: {
    paddingHorizontal: s(20),
    paddingBottom: vs(4),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
  },
  rowCopy: {
    flex: 1,
    gap: vs(2),
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: s(20),
    marginTop: vs(4),
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
