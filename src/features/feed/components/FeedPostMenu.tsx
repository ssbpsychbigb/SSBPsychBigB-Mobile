/**
 * Post overflow — pin / delete (owner) or report (others). Matches thread menu chrome.
 */

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Flag, Pin, Trash2 } from 'lucide-react-native';

import {
  ChatThreadMenu,
  type ChatMenuItem,
} from '@/features/message/components/ChatSafetySheet';
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
  onSelect: (key: 'pin' | 'delete' | 'report') => void;
};

/**
 * Anchored ⋯ menu for a feed card.
 */
export function FeedPostMenu({ target, busy, onClose, onSelect }: FeedPostMenuProps) {
  const items: ChatMenuItem[] = target?.isOwn
    ? [
        {
          key: 'pin',
          label: target.pinned ? 'Unpin from profile' : 'Pin to profile',
          Icon: Pin,
        },
        {
          key: 'delete',
          label: 'Delete post',
          Icon: Trash2,
          tone: 'danger',
          separatorBefore: true,
        },
      ]
    : [
        {
          key: 'report',
          label: 'Report post',
          Icon: Flag,
          tone: 'danger',
        },
      ];

  return (
    <ChatThreadMenu
      busy={busy}
      items={items}
      onClose={onClose}
      onSelect={(key) => onSelect(key as 'pin' | 'delete' | 'report')}
      visible={Boolean(target)}
    />
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
