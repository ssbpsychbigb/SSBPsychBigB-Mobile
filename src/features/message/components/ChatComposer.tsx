/**
 * Chat composer — emoji, GIF, photo, file (web MessageComposer parity).
 */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Check, ImagePlus, Paperclip, Send, Smile, Sticker, X } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import { toMultipartFilePart } from '@/features/auth/lib/upload-asset';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatApi } from '@/features/message/api/chat.api';
import { emitTypingStart, emitTypingStop } from '@/features/message/lib/chat.socket';
import { EMOJI_GRID } from '@/features/message/lib/emoji-catalog';
import { MOCK_GIFS, type MockGif } from '@/features/message/lib/gif-catalog';
import type { MessageAttachment } from '@/features/message/types/chat.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';
import { showErrorToast } from '@/shared/ui/toast';

export type ChatComposerProps = {
  conversationId?: string;
  draft: string;
  onDraft: (value: string) => void;
  onSend: (attachment?: MessageAttachment) => void;
  onCancelEdit?: () => void;
  editing?: boolean;
  busy: boolean;
};

type Picker = 'emoji' | 'gif' | null;

/**
 * Bottom bar pinned under the thread, WhatsApp density + LinkedIn tools.
 */
export function ChatComposer({
  conversationId,
  draft,
  onDraft,
  onSend,
  onCancelEdit,
  editing = false,
  busy,
}: ChatComposerProps) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const [picker, setPicker] = useState<Picker>(null);
  const [pending, setPending] = useState<MessageAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActive = useRef(false);

  const canSend =
    Boolean(draft.trim() || (!editing && pending)) && !busy && !uploading;

  const stopTyping = () => {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
    if (typingActive.current && conversationId) {
      emitTypingStop(conversationId);
      typingActive.current = false;
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      if (typingActive.current && conversationId) {
        emitTypingStop(conversationId);
        typingActive.current = false;
      }
    };
  }, [conversationId]);

  const bumpTyping = (nextDraft: string) => {
    if (!conversationId || editing) {
      return;
    }
    if (nextDraft.trim()) {
      if (!typingActive.current) {
        emitTypingStart(conversationId);
        typingActive.current = true;
      }
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      typingTimer.current = setTimeout(() => {
        emitTypingStop(conversationId);
        typingActive.current = false;
      }, 1800);
      return;
    }
    stopTyping();
  };

  const setDraft = (value: string) => {
    onDraft(value);
    bumpTyping(value);
  };

  const uploadAsset = async (mediaType: 'photo' | 'mixed') => {
    if (!token || editing) {
      return;
    }
    const result = await launchImageLibrary({
      mediaType,
      selectionLimit: 1,
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (result.didCancel || !asset?.uri) {
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(
        'file',
        toMultipartFilePart(
          {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName,
          },
          'file',
        ) as unknown as Blob,
      );
      const uploaded = await chatApi.uploadFile(formData, token);
      setPending({
        kind: uploaded.kind,
        name: uploaded.name,
        path: uploaded.path,
        mime: uploaded.mime,
        size: uploaded.size,
        sizeLabel: uploaded.sizeLabel,
        previewUrl: uploaded.path,
      });
    } catch (error) {
      showErrorToast(error, 'Could not attach this file.', 'Chat');
    } finally {
      setUploading(false);
    }
  };

  const pickGif = (gif: MockGif) => {
    if (editing) {
      return;
    }
    setPending({
      kind: 'gif',
      name: `${gif.label}.gif`,
      gifEmoji: gif.emoji,
      gifTone: gif.color,
    });
    setPicker(null);
  };

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
      ]}>
      {editing ? (
        <View style={[styles.editBar, { backgroundColor: theme.colors.primaryMuted }]}>
          <AppText style={styles.pendingName} variant="caption" weight="semibold">
            Editing message
          </AppText>
          <Pressable
            accessibilityLabel="Cancel edit"
            hitSlop={ms(8)}
            onPress={() => {
              setPicker(null);
              onCancelEdit?.();
            }}>
            <X color={theme.colors.text} size={ms(18)} strokeWidth={2} />
          </Pressable>
        </View>
      ) : null}

      {picker === 'emoji' ? (
        <ScrollView
          contentContainerStyle={styles.emojiGrid}
          keyboardShouldPersistTaps="handled"
          style={styles.panel}>
          {EMOJI_GRID.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => {
                setDraft(`${draft}${emoji}`);
              }}
              style={styles.emojiCell}>
              <AppText style={styles.emoji}>{emoji}</AppText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {picker === 'gif' && !editing ? (
        <ScrollView
          contentContainerStyle={styles.gifGrid}
          keyboardShouldPersistTaps="handled"
          style={styles.panel}>
          {MOCK_GIFS.map((gif) => (
            <Pressable
              key={gif.id}
              onPress={() => pickGif(gif)}
              style={[styles.gifCell, { backgroundColor: gif.color }]}>
              <AppText style={styles.gifEmoji}>{gif.emoji}</AppText>
              <AppText color="inverse" numberOfLines={1} style={styles.gifLabel} variant="caption">
                {gif.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {pending && !editing ? (
        <View style={[styles.pending, { backgroundColor: theme.colors.primaryMuted }]}>
          <AppText numberOfLines={1} style={styles.pendingName} variant="caption" weight="semibold">
            {pending.gifEmoji ? `${pending.gifEmoji} ` : ''}
            {pending.name}
          </AppText>
          <Pressable onPress={() => setPending(null)}>
            <AppText color="brand" variant="caption" weight="semibold">
              Remove
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Emoji"
          onPress={() => setPicker((value) => (value === 'emoji' ? null : 'emoji'))}
          style={styles.tool}>
          <Smile color={theme.colors.textMuted} size={ms(22)} strokeWidth={2} />
        </Pressable>
        {editing ? null : (
          <>
            <Pressable
              accessibilityLabel="GIF"
              onPress={() => setPicker((value) => (value === 'gif' ? null : 'gif'))}
              style={styles.tool}>
              <Sticker color={theme.colors.textMuted} size={ms(22)} strokeWidth={2} />
            </Pressable>
            <Pressable
              accessibilityLabel="Photo"
              onPress={() => void uploadAsset('photo')}
              style={styles.tool}>
              <ImagePlus color={theme.colors.textMuted} size={ms(22)} strokeWidth={2} />
            </Pressable>
            <Pressable
              accessibilityLabel="Attachment"
              onPress={() => void uploadAsset('mixed')}
              style={styles.tool}>
              <Paperclip color={theme.colors.textMuted} size={ms(22)} strokeWidth={2} />
            </Pressable>
          </>
        )}

        <View
          style={[
            styles.field,
            {
              backgroundColor:
                theme.mode === 'dark' ? theme.colors.surface : theme.palette.neutral[100],
            },
          ]}>
          <TextInput
            editable={!busy}
            multiline
            onChangeText={setDraft}
            placeholder={editing ? 'Edit message' : 'Message'}
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                fontFamily: resolveFontFamily('regular'),
              },
            ]}
            value={draft}
          />
        </View>

        <Pressable
          accessibilityLabel={editing ? 'Save edit' : 'Send'}
          disabled={!canSend}
          onPress={() => {
            onSend(editing ? undefined : pending || undefined);
            if (!editing) {
              setPending(null);
            }
            setPicker(null);
            stopTyping();
          }}
          style={[
            styles.send,
            {
              backgroundColor: theme.colors.primary,
              opacity: canSend ? 1 : 0.4,
            },
          ]}>
          {uploading || busy ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : editing ? (
            <Check color="#FFFFFF" size={ms(18)} strokeWidth={2.4} />
          ) : (
            <Send color="#FFFFFF" size={ms(16)} strokeWidth={2.2} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: s(8),
    paddingTop: vs(8),
    paddingBottom: vs(8),
  },
  panel: {
    maxHeight: vs(168),
    marginBottom: vs(8),
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: s(6),
  },
  emojiCell: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: fontSize(22),
  },
  gifGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    paddingHorizontal: s(4),
  },
  gifCell: {
    width: s(72),
    height: vs(72),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(4),
  },
  gifEmoji: {
    fontSize: fontSize(26),
  },
  gifLabel: {
    fontSize: fontSize(9),
  },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: ms(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    marginBottom: vs(8),
    gap: s(8),
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: ms(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    marginBottom: vs(8),
    gap: s(8),
  },
  pendingName: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: s(4),
  },
  tool: {
    width: ms(34),
    height: ms(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    minHeight: ms(40),
    maxHeight: vs(96),
    borderRadius: ms(20),
    paddingHorizontal: s(12),
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    maxHeight: vs(88),
    paddingVertical: vs(8),
  },
  send: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
