/**
 * WhatsApp-style message bubble with ticks, delete, and optional media.
 */

import { Image, Pressable, StyleSheet, Vibration, View } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';

import {
  isMessageSeen,
  sameDay,
  threadDayLabel,
  threadTimeLabel,
} from '@/features/message/lib/message-display';
import type { ThreadMessage } from '@/features/message/types/chat.types';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type ChatBubbleProps = {
  message: ThreadMessage;
  previousSentAt?: string;
  peerLastReadAt?: string | null;
  receiptsOn?: boolean;
  selected?: boolean;
  onLongPress?: (message: ThreadMessage) => void;
  onPress?: () => void;
};

function hapticTap(): void {
  try {
    Vibration.vibrate(18);
  } catch {
    // * Android throws if VIBRATE is not in the manifest yet.
  }
}

/**
 * Incoming left, outgoing right. Own messages show sent (✓) vs seen (✓✓).
 */
export function ChatBubble({
  message,
  previousSentAt,
  peerLastReadAt,
  receiptsOn = true,
  selected = false,
  onLongPress,
  onPress,
}: ChatBubbleProps) {
  const theme = useTheme();
  const deleted = message.status === 'deleted';
  const mine = message.author === 'you' || message.status === 'sending';
  const showDay = !previousSentAt || !sameDay(previousSentAt, message.sentAt);
  const imageUrl = resolveUploadUrl(
    message.attachment?.previewUrl || message.attachment?.path,
  );
  const isGif = !deleted && message.attachment?.kind === 'gif';
  const isFile = !deleted && message.attachment?.kind === 'file';
  const seen =
    receiptsOn && mine && !deleted && isMessageSeen(message.sentAt, peerLastReadAt);
  const tickColor = seen ? '#B8E6FF' : 'rgba(255,255,255,0.72)';
  const canAct =
    !deleted &&
    message.status !== 'sending' &&
    (mine || Boolean(message.body?.trim()) || Boolean(message.attachment));

  return (
    <View
      style={[
        styles.block,
        selected ? { backgroundColor: `${theme.colors.primary}22` } : null,
      ]}>
      {showDay ? (
        <View style={styles.dayWrap}>
          <View style={[styles.dayChip, { backgroundColor: theme.colors.background }]}>
            <AppText color="muted" style={styles.dayLabel} variant="caption" weight="semibold">
              {threadDayLabel(message.sentAt)}
            </AppText>
          </View>
        </View>
      ) : null}

      <Pressable
        delayLongPress={320}
        disabled={!canAct && !selected}
        onLongPress={() => {
          hapticTap();
          onLongPress?.(message);
        }}
        onPress={() => onPress?.()}
        style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
        <View
          style={[
            styles.bubble,
            mine
              ? {
                  backgroundColor: deleted ? theme.colors.surface : theme.colors.primary,
                  borderBottomRightRadius: ms(4),
                }
              : {
                  backgroundColor: theme.colors.background,
                  borderBottomLeftRadius: ms(4),
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border,
                },
          ]}>
          {deleted ? (
            <AppText
              color={mine ? 'muted' : 'muted'}
              style={styles.deleted}
              variant="body">
              This message was deleted
            </AppText>
          ) : (
            <>
              {isGif ? (
                <View
                  style={[
                    styles.gif,
                    { backgroundColor: theme.colors.primaryMuted },
                  ]}>
                  <AppText style={styles.gifEmoji}>
                    {message.attachment?.gifEmoji || '🎞️'}
                  </AppText>
                  <AppText
                    color={mine ? 'inverse' : 'secondary'}
                    variant="caption"
                    weight="semibold">
                    {message.attachment?.name?.replace(/\.gif$/i, '') || 'GIF'}
                  </AppText>
                </View>
              ) : null}

              {imageUrl && message.attachment?.kind === 'image' ? (
                <Image source={{ uri: imageUrl }} style={styles.image} />
              ) : null}

              {isFile ? (
                <AppText
                  color={mine ? 'inverse' : 'primary'}
                  variant="caption"
                  weight="semibold">
                  📎 {message.attachment?.name || 'Attachment'}
                </AppText>
              ) : null}

              {message.body ? (
                <AppText
                  color={mine ? 'inverse' : 'primary'}
                  style={styles.body}
                  variant="body">
                  {message.body}
                </AppText>
              ) : null}
            </>
          )}

          <View style={styles.metaRow}>
            <AppText
              color={mine && !deleted ? 'inverse' : 'muted'}
              style={styles.time}
              variant="caption">
              {threadTimeLabel(message.sentAt)}
              {message.status === 'sending' ? ' · sending' : ''}
              {message.editedAt && !deleted ? ' · Edited' : ''}
            </AppText>
            {mine && !deleted ? (
              message.status === 'sending' ? (
                <AppText color="inverse" style={styles.time} variant="caption">
                  …
                </AppText>
              ) : seen ? (
                <CheckCheck
                  accessibilityLabel="Seen"
                  color={tickColor}
                  size={ms(15)}
                  strokeWidth={2.4}
                />
              ) : (
                <Check
                  accessibilityLabel="Sent"
                  color={tickColor}
                  size={ms(15)}
                  strokeWidth={2.4}
                />
              )
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: vs(2),
    marginHorizontal: s(-14),
    paddingHorizontal: s(14),
    paddingVertical: vs(4),
  },
  dayWrap: {
    alignItems: 'center',
    marginVertical: vs(10),
  },
  dayChip: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(10),
  },
  dayLabel: {
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontSize: fontSize(10),
  },
  row: {
    maxWidth: '82%',
  },
  rowMine: {
    alignSelf: 'flex-end',
  },
  rowTheirs: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: ms(18),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    gap: vs(6),
  },
  body: {
    lineHeight: lineHeight(15, 1.4),
  },
  deleted: {
    fontStyle: 'italic',
    lineHeight: lineHeight(15, 1.4),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: s(4),
  },
  time: {
    opacity: 0.78,
    fontSize: fontSize(10),
  },
  image: {
    width: s(210),
    height: vs(160),
    borderRadius: ms(12),
    backgroundColor: '#0D1E34',
  },
  gif: {
    width: s(140),
    height: vs(110),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(4),
  },
  gifEmoji: {
    fontSize: fontSize(36),
  },
});
