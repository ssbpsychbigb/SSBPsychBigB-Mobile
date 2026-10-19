/**
 * Comments sheet — threads, replies, and a quick emoji rail (IG/FB flow).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { feedApi } from '@/features/feed/api/feed.api';
import { formatPostTime } from '@/features/feed/lib/to-feed-card-post';
import type { FeedComment } from '@/features/feed/types/feed.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, ms, s, vs } from '@/shared/lib/responsive';
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

const QUICK_EMOJIS = ['❤️', '🔥', '👍', '🙌', '🫡', '💯', '🎯', '🙏', '😂', '💪'];

type CommentNode = FeedComment & { replies: CommentNode[] };

function buildTree(items: FeedComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  items.forEach((item) => map.set(item.id, { ...item, replies: [] }));
  const roots: CommentNode[] = [];
  map.forEach((node) => {
    if (node.parentCommentId && map.has(node.parentCommentId)) {
      map.get(node.parentCommentId)?.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

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
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<FeedComment[]>([]);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const tree = useMemo(() => buildTree(items), [items]);

  useEffect(() => {
    if (!visible) {
      setDraft('');
      setReplyTo(null);
      setOpenReplies({});
      return;
    }
    if (!postId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    feedApi
      .listComments(postId, token)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items || []);
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

  const requireAuth = () => {
    if (token) {
      return true;
    }
    setJoinOpen(true);
    return false;
  };

  const send = async (text: string, parentId?: string | null) => {
    if (!postId || !token) {
      return;
    }
    const content = text.trim();
    if (!content) {
      return;
    }
    setSending(true);
    try {
      const created = await feedApi.addComment(postId, content, token, parentId);
      setItems((current) => [...current, created]);
      setDraft('');
      setReplyTo(null);
      if (parentId) {
        setOpenReplies((current) => ({ ...current, [parentId]: true }));
      }
      onAdded();
    } catch (error) {
      showErrorToast(error, 'Could not post comment.', 'Comments');
    } finally {
      setSending(false);
    }
  };

  const toggleLike = async (comment: FeedComment) => {
    if (!postId || !requireAuth()) {
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.id === comment.id
          ? {
              ...item,
              liked: !item.liked,
              likesCount: Math.max(0, (item.likesCount || 0) + (item.liked ? -1 : 1)),
            }
          : item,
      ),
    );
    try {
      const result = await feedApi.toggleCommentLike(postId, comment.id, token as string);
      setItems((current) =>
        current.map((item) =>
          item.id === comment.id
            ? { ...item, liked: result.liked, likesCount: result.likesCount }
            : item,
        ),
      );
    } catch (error) {
      setItems((current) =>
        current.map((item) => (item.id === comment.id ? comment : item)),
      );
      showErrorToast(error, 'Could not like this comment.', 'Comments');
    }
  };

  const insertEmoji = (emoji: string) => {
    if (!requireAuth()) {
      return;
    }
    setDraft((current) => `${current}${emoji}`);
  };

  const renderComment = (node: CommentNode, isReply = false) => {
    const replyCount = node.replies.length;
    const expanded = openReplies[node.id] ?? replyCount <= 2;
    const shownReplies = expanded ? node.replies : node.replies.slice(0, 1);

    return (
      <View key={node.id} style={isReply ? styles.replyBlock : styles.thread}>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="link"
            disabled={!node.author?.username || !onAuthorPress}
            onPress={() =>
              onAuthorPress?.(node.author?.username || '', node.author?.fullName)
            }
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <AppText color="inverse" variant="caption" weight="semibold">
              {getUserInitials(node.author?.fullName)}
            </AppText>
          </Pressable>
          <View style={styles.copy}>
            <View style={styles.nameRow}>
              <AppText numberOfLines={1} style={styles.flex} variant="caption" weight="semibold">
                {node.author?.fullName || 'Member'}
              </AppText>
              <AppText color="muted" variant="caption">
                {formatPostTime(node.createdAt)}
              </AppText>
            </View>
            <AppText variant="body">{node.content}</AppText>
            <View style={styles.meta}>
              <Pressable
                onPress={() => {
                  if (!requireAuth()) {
                    return;
                  }
                  setReplyTo(node);
                }}>
                <AppText color="muted" variant="caption" weight="semibold">
                  Reply
                </AppText>
              </Pressable>
              {(node.likesCount || 0) > 0 ? (
                <AppText color="muted" variant="caption">
                  {node.likesCount} like{(node.likesCount || 0) === 1 ? '' : 's'}
                </AppText>
              ) : null}
            </View>
          </View>
          <Pressable
            accessibilityLabel="Like comment"
            hitSlop={ms(8)}
            onPress={() => void toggleLike(node)}
            style={styles.heart}>
            <Heart
              color={node.liked ? theme.colors.danger : theme.colors.textMuted}
              fill={node.liked ? theme.colors.danger : 'transparent'}
              size={ms(16)}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {shownReplies.map((reply) => renderComment(reply, true))}

        {replyCount > 2 ? (
          <Pressable
            onPress={() =>
              setOpenReplies((current) => ({ ...current, [node.id]: !expanded }))
            }
            style={styles.moreReplies}>
            <AppText color="brand" variant="caption" weight="semibold">
              {expanded ? 'Hide replies' : `View ${replyCount} replies`}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const placeholder = replyTo
    ? `Reply to ${replyTo.author?.fullName || 'this comment'}…`
    : 'Add a comment…';

  return (
    <>
      <Modal
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
        transparent
        visible={visible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}>
          <Pressable onPress={onClose} style={styles.backdrop} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                paddingBottom: Math.max(insets.bottom, vs(10)),
              },
            ]}>
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            </View>
            <View style={styles.head}>
              <AppText variant="subtitle" weight="bold">
                Comments
              </AppText>
              <Pressable hitSlop={ms(8)} onPress={onClose}>
                <AppText color="muted" variant="caption" weight="semibold">
                  Close
                </AppText>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator color={theme.colors.primary} style={styles.spin} />
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={styles.list}>
                {tree.length === 0 ? (
                  <AppText color="muted" style={styles.empty} variant="caption">
                    Be the first to add a useful take.
                  </AppText>
                ) : (
                  tree.map((node) => renderComment(node))
                )}
              </ScrollView>
            )}

            {token ? (
              <View style={[styles.dock, { borderTopColor: theme.colors.border }]}>
                {replyTo ? (
                  <View style={styles.replyBar}>
                    <AppText color="muted" style={styles.flex} variant="caption">
                      Replying to {replyTo.author?.fullName || 'comment'}
                    </AppText>
                    <Pressable onPress={() => setReplyTo(null)}>
                      <AppText color="brand" variant="caption" weight="semibold">
                        Cancel
                      </AppText>
                    </Pressable>
                  </View>
                ) : null}
                <ScrollView
                  contentContainerStyle={styles.emojiRow}
                  horizontal
                  keyboardShouldPersistTaps="handled"
                  showsHorizontalScrollIndicator={false}>
                  {QUICK_EMOJIS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => insertEmoji(emoji)}
                      style={styles.emojiHit}>
                      <Text style={styles.emoji}>{emoji}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={styles.composer}>
                  <TextInput
                    editable={!sending}
                    onChangeText={setDraft}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textMuted}
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                        backgroundColor:
                          theme.mode === 'dark'
                            ? theme.colors.primaryMuted
                            : theme.palette.primary[50],
                        fontFamily: resolveFontFamily('regular'),
                      },
                    ]}
                    value={draft}
                  />
                  <Pressable
                    disabled={sending || !draft.trim()}
                    onPress={() => {
                      void send(draft, replyTo?.id || null);
                    }}
                    style={[
                      styles.send,
                      {
                        backgroundColor: theme.colors.primary,
                        opacity: sending || !draft.trim() ? 0.4 : 1,
                      },
                    ]}>
                    <AppText color="inverse" variant="caption" weight="semibold">
                      {sending ? '…' : 'Post'}
                    </AppText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setJoinOpen(true)}
                style={[styles.joinRow, { borderColor: theme.colors.border }]}>
                <AppText color="muted" variant="caption">
                  Join to reply and react
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
    height: '82%',
    borderTopLeftRadius: ms(22),
    borderTopRightRadius: ms(22),
    borderWidth: 1,
    paddingHorizontal: s(16),
    paddingTop: vs(8),
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: vs(6),
  },
  handle: {
    width: ms(36),
    height: 4,
    borderRadius: 2,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(8),
  },
  spin: {
    marginVertical: vs(24),
  },
  list: {
    flex: 1,
  },
  empty: {
    paddingVertical: vs(24),
    textAlign: 'center',
  },
  thread: {
    marginBottom: vs(14),
  },
  replyBlock: {
    marginLeft: s(42),
    marginTop: vs(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(10),
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
    minWidth: 0,
    gap: vs(3),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  flex: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    marginTop: vs(2),
  },
  heart: {
    paddingTop: vs(4),
  },
  moreReplies: {
    marginLeft: s(42),
    marginTop: vs(8),
  },
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: vs(10),
    gap: vs(8),
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingBottom: vs(2),
  },
  emojiHit: {
    width: ms(36),
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: fontSize(22),
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    marginTop: vs(8),
  },
  input: {
    flex: 1,
    minHeight: ms(42),
    borderWidth: 1,
    borderRadius: ms(21),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    fontSize: 15,
  },
  send: {
    height: ms(42),
    paddingHorizontal: s(16),
    borderRadius: ms(21),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
