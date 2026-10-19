/**
 * WhatsApp-style delete list — shown after tapping Delete on a selected message.
 */

import Clipboard from '@react-native-clipboard/clipboard';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThreadMessage } from '@/features/message/types/chat.types';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

export type MessageDeleteSheetProps = {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onDeleteEveryone: () => void;
};

/**
 * Plain text used for Copy on a selected bubble.
 */
export function messageCopyText(message: ThreadMessage): string {
  if (message.body?.trim()) {
    return message.body.trim();
  }
  if (message.attachment?.name) {
    return message.attachment.name;
  }
  return '';
}

/**
 * Copies bubble text with the community clipboard module (needs a native rebuild).
 */
export async function copyThreadMessage(message: ThreadMessage): Promise<void> {
  const copyText = messageCopyText(message);
  if (!copyText) {
    return;
  }
  Clipboard.setString(copyText);
  showToast.success('Copied');
}

/**
 * Bottom stacked actions: Delete for everyone / Cancel.
 */
export function MessageDeleteSheet({
  visible,
  busy,
  onClose,
  onDeleteEveryone,
}: MessageDeleteSheetProps) {
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
      <Pressable onPress={busy ? undefined : onClose} style={styles.root}>
        <View
          pointerEvents="box-none"
          style={[
            styles.sheetWrap,
            { paddingBottom: Math.max(insets.bottom, vs(12)) },
          ]}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.sheetBlock}>
            <View
              style={[
                styles.sheetCard,
                { backgroundColor: cardBg, borderColor: theme.colors.border },
              ]}>
              <AppText color="muted" style={styles.sheetHint} variant="caption">
                This message will be removed for everyone in this chat.
              </AppText>
              <Pressable
                disabled={busy}
                onPress={onDeleteEveryone}
                style={styles.sheetRow}>
                <AppText
                  style={[styles.sheetAction, { color: theme.colors.danger }]}
                  weight="semibold">
                  {busy ? 'Deleting…' : 'Delete for everyone'}
                </AppText>
              </Pressable>
            </View>
            <Pressable
              disabled={busy}
              onPress={onClose}
              style={[
                styles.sheetCard,
                styles.cancelCard,
                { backgroundColor: cardBg, borderColor: theme.colors.border },
              ]}>
              <AppText
                style={[styles.sheetAction, { color: theme.colors.primary }]}
                weight="bold">
                Cancel
              </AppText>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13,30,52,0.4)',
  },
  sheetWrap: {
    paddingHorizontal: s(10),
  },
  sheetBlock: {
    gap: vs(8),
  },
  sheetCard: {
    borderRadius: ms(14),
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cancelCard: {
    alignItems: 'center',
  },
  sheetHint: {
    textAlign: 'center',
    paddingHorizontal: s(16),
    paddingTop: vs(14),
    paddingBottom: vs(6),
  },
  sheetRow: {
    minHeight: vs(52),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAction: {
    fontSize: fontSize(17),
    lineHeight: lineHeight(17, 1.2),
    paddingVertical: vs(14),
    textAlign: 'center',
  },
});
