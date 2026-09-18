/**
 * Comments sheet — list + add for a single post.
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { feedApi } from '@/features/feed/api/feed.api';
import type { FeedComment } from '@/features/feed/types/feed.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';
import { showErrorToast } from '@/shared/ui/toast';

export type FeedCommentsSheetProps = {
  postId: string | null;
  token: string | null;
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
  onAuthorPress?: (username: string, name?: string) => void;
};

/**
 * Loads comments when opened. Guests can read; posting needs a token.
 */
export function FeedCommentsSheet({
  postId,
  token,
  visible,
  onClose,
  onAdded,
  onAuthorPress,
}: FeedCommentsSheetProps) {
  const theme = useTheme();
  const [items, setItems] = useState<FeedComment[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (!visible || !postId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    feedApi
      .listComments(postId, token)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          showErrorToast(error, 'Could not load comments.', 'Comments');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [postId, token, visible]);

  const send = async () => {
    if (!postId || !token || !draft.trim()) {
      return;
    }
    setSending(true);
    try {
      const created = await feedApi.addComment(postId, draft.trim(), token);
      setItems((current) => [...current, created]);
      setDraft('');
      onAdded();
    } catch (error) {
      showErrorToast(error, 'Could not post comment.', 'Comments');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <View style={styles.head}>
            <AppText variant="subtitle" weight="bold">
              Comments
            </AppText>
            <Pressable onPress={onClose}>
              <AppText color="muted" variant="caption" weight="semibold">
                Close
              </AppText>
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={styles.spin} />
          ) : (
            <ScrollView style={styles.list}>
              {items.length === 0 ? (
                <AppText color="muted" style={styles.empty} variant="caption">
                  Be the first to add a useful take.
                </AppText>
              ) : (
                items.map((item) => (
                  <View key={item.id} style={styles.row}>
                    <Pressable
                      accessibilityRole="link"
                      disabled={!item.author?.username || !onAuthorPress}
                      onPress={() =>
                        onAuthorPress?.(
                          item.author?.username || '',
                          item.author?.fullName,
                        )
                      }>
                      <View
                        style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                        <AppText color="inverse" variant="caption" weight="semibold">
                          {getUserInitials(item.author?.fullName)}
                        </AppText>
                      </View>
                    </Pressable>
                    <View style={styles.copy}>
                      <Pressable
                        accessibilityRole="link"
                        disabled={!item.author?.username || !onAuthorPress}
                        onPress={() =>
                          onAuthorPress?.(
                            item.author?.username || '',
                            item.author?.fullName,
                          )
                        }>
                        <AppText variant="caption" weight="semibold">
                          {item.author?.fullName || 'Member'}
                        </AppText>
                      </Pressable>
                      <AppText variant="body">{item.content}</AppText>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
          {token ? (
            <View style={styles.composer}>
              <TextInput
                editable={!sending}
                onChangeText={setDraft}
                placeholder="Add a comment"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    fontFamily: resolveFontFamily('regular'),
                  },
                ]}
                value={draft}
              />
              <Pressable
                disabled={sending || !draft.trim()}
                onPress={() => {
                  void send();
                }}>
                <AppText
                  color="brand"
                  variant="caption"
                  weight="semibold">
                  {sending ? '…' : 'Send'}
                </AppText>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setJoinOpen(true)}
              style={[styles.joinRow, { borderColor: theme.colors.border }]}>
              <AppText color="muted" variant="caption">
                Join to add a comment
              </AppText>
              <AppText color="brand" variant="caption" weight="semibold">
                Join
              </AppText>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
      <JoinToContinueSheet
        message="Comments are for members. Create an account to add your take."
        onClose={() => setJoinOpen(false)}
        title="Join the discussion"
        visible={joinOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13,30,52,0.35)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    borderWidth: 1,
    paddingHorizontal: s(16),
    paddingTop: vs(16),
    paddingBottom: vs(20),
    gap: vs(10),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spin: {
    marginVertical: vs(24),
  },
  list: {
    maxHeight: vs(320),
  },
  empty: {
    paddingVertical: vs(16),
  },
  row: {
    flexDirection: 'row',
    gap: s(10),
    marginBottom: vs(12),
  },
  avatar: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: vs(2),
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    fontSize: 14,
  },
});
