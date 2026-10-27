/**
 * Comments sheet — threads, replies, and a quick emoji rail (IG/FB flow).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowUp, Heart, MessageCircle, MessageSquareX, Pin, X } from 'lucide-react-native';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { feedApi } from '@/features/feed/api/feed.api';
import { SelfAvatar } from '@/features/feed/components/ComposeParts';
import { formatPostTime } from '@/features/feed/lib/to-feed-card-post';
import type { FeedComment } from '@/features/feed/types/feed.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, KeyboardSheet, Spinner, useDiscardGuard } from '@/shared/ui';
import { showErrorToast } from '@/shared/ui/toast';

const MAX_COMMENT_LENGTH = 2000;

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
  roots.sort((a, b) => {
    const pinned = Number(Boolean(b.pinnedAt)) - Number(Boolean(a.pinnedAt));
    if (pinned !== 0) {
      return pinned;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
  const [items, setItems] = useState<FeedComment[]>([]);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [canPin, setCanPin] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(items), [items]);
  const guard = useDiscardGuard(draft.trim().length > 0 && !sending, onClose, visible);

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
          setCanPin(Boolean(data.canPin));
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

  const pinComment = async (comment: FeedComment) => {
    if (!postId || !requireAuth() || pinningId) {
      return;
    }
    setPinningId(comment.id);
    try {
      const result = await feedApi.pinComment(postId, comment.id, token as string);
      setItems((current) =>
        current.map((item) => {
          if (item.id === result.commentId) {
            return { ...item, pinnedAt: result.pinned ? result.pinnedAt : null };
          }
          if (result.pinned && item.pinnedAt) {
            return { ...item, pinnedAt: null };
          }
          return item;
        }),
      );
    } catch (error) {
      showErrorToast(error, 'Could not pin this comment.', 'Comments');
    } finally {
      setPinningId(null);
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
            style={[
              styles.avatar,
              isReply ? styles.avatarSmall : null,
              { backgroundColor: theme.colors.primary },
            ]}>
            {resolveUploadUrl(node.author?.profilePhotoPath) ? (
              <Image
                source={{ uri: resolveUploadUrl(node.author?.profilePhotoPath) as string }}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <AppText color="inverse" variant="caption" weight="semibold">
                {getUserInitials(node.author?.fullName)}
              </AppText>
            )}
          </Pressable>
          <View style={styles.copy}>
            {!isReply && node.pinnedAt ? (
              <View style={styles.pinned}>
                <Pin color={theme.colors.primary} size={ms(11)} strokeWidth={2.4} />
                <AppText color="brand" variant="caption" weight="semibold">
                  Pinned
                </AppText>
              </View>
            ) : null}
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
              {!isReply && canPin ? (
                <Pressable
                  disabled={pinningId === node.id}
                  onPress={() => void pinComment(node)}>
                  <AppText color="brand" variant="caption" weight="semibold">
                    {node.pinnedAt ? 'Unpin' : 'Pin'}
                  </AppText>
                </Pressable>
              ) : null}
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
      <KeyboardSheet
        height={0.82}
        onRequestClose={guard.requestClose}
        style={styles.sheet}
        visible={visible}>
            <View style={[styles.head, { borderBottomColor: theme.colors.border }]}>
              <AppText style={styles.headTitle} variant="subtitle" weight="bold">
                Comments
              </AppText>
              {items.length > 0 ? (
                <View style={[styles.countPill, { backgroundColor: theme.colors.surface }]}>
                  <AppText color="secondary" variant="caption" weight="semibold">
                    {items.length}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.flex} />
              <Pressable
                accessibilityLabel="Close comments"
                accessibilityRole="button"
                hitSlop={ms(8)}
                onPress={guard.requestClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
                ]}>
                <X color={theme.colors.text} size={ms(18)} strokeWidth={2.2} />
              </Pressable>
            </View>

            {loading ? (
              <Spinner fullScreen label="Loading comments" />
            ) : (
              <ScrollView
                contentContainerStyle={tree.length === 0 ? styles.listEmpty : styles.listContent}
                keyboardShouldPersistTaps="handled"
                style={styles.list}>
                {tree.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surface }]}>
                      <MessageCircle color={theme.colors.primary} size={ms(24)} strokeWidth={1.9} />
                    </View>
                    <AppText variant="label" weight="semibold">
                      No comments yet
                    </AppText>
                    <AppText color="muted" style={styles.empty} variant="caption">
                      Be the first to add a useful take.
                    </AppText>
                  </View>
                ) : (
                  tree.map((node) => renderComment(node))
                )}
              </ScrollView>
            )}

            {token ? (
              <View style={[styles.dock, { borderTopColor: theme.colors.border }]}>
                {replyTo ? (
                  <View
                    style={[
                      styles.replyBar,
                      {
                        backgroundColor:
                          theme.mode === 'dark' ? theme.colors.primaryMuted : theme.palette.primary[50],
                      },
                    ]}>
                    <AppText color="secondary" numberOfLines={1} style={styles.flex} variant="caption">
                      Replying to{' '}
                      <AppText color="brand" variant="caption" weight="semibold">
                        {replyTo.author?.fullName || 'comment'}
                      </AppText>
                    </AppText>
                    <Pressable
                      accessibilityLabel="Cancel reply"
                      hitSlop={ms(8)}
                      onPress={() => setReplyTo(null)}>
                      <X color={theme.colors.textSecondary} size={ms(15)} strokeWidth={2.2} />
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
                  <SelfAvatar size={ms(34)} />
                  <View
                    style={[
                      styles.inputShell,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor:
                          theme.mode === 'dark'
                            ? theme.colors.primaryMuted
                            : theme.palette.primary[50],
                      },
                    ]}>
                    <TextInput
                      editable={!sending}
                      maxLength={MAX_COMMENT_LENGTH}
                      multiline
                      onChangeText={setDraft}
                      placeholder={placeholder}
                      placeholderTextColor={theme.colors.textMuted}
                      scrollEnabled
                      style={[
                        styles.input,
                        { color: theme.colors.text, fontFamily: resolveFontFamily('regular') },
                      ]}
                      value={draft}
                    />
                    <Pressable
                      accessibilityLabel="Post comment"
                      accessibilityRole="button"
                      disabled={sending || !draft.trim()}
                      onPress={() => {
                        void send(draft, replyTo?.id || null);
                      }}
                      style={({ pressed }) => [
                        styles.send,
                        {
                          backgroundColor: draft.trim() ? theme.colors.primary : theme.colors.border,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}>
                      {sending ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <ArrowUp color="#FFFFFF" size={ms(18)} strokeWidth={2.6} />
                      )}
                    </Pressable>
                  </View>
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
      </KeyboardSheet>
      <ConfirmModal
        Icon={MessageSquareX}
        cancelLabel="Keep writing"
        confirmLabel="Discard"
        message="Your comment hasn’t been posted yet. Leave and lose it?"
        onCancel={guard.keepEditing}
        onConfirm={guard.discard}
        title="Discard comment?"
        tone="danger"
        visible={guard.asking}
      />
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
  sheet: {
    paddingHorizontal: s(16),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingBottom: vs(10),
    marginBottom: vs(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headTitle: {
    fontSize: fontSize(17),
    lineHeight: lineHeight(17, 1.3),
  },
  countPill: {
    minWidth: ms(24),
    height: ms(22),
    paddingHorizontal: s(7),
    borderRadius: ms(11),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: vs(10),
    paddingBottom: vs(8),
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    gap: vs(6),
    paddingVertical: vs(24),
  },
  emptyIcon: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(4),
  },
  empty: {
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
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSmall: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vs(3),
  },
  pinned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginBottom: vs(2),
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
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(7),
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
    alignItems: 'flex-end',
    gap: s(8),
  },
  inputShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: ms(22),
    paddingLeft: s(14),
    paddingRight: ms(4),
    paddingVertical: ms(4),
    gap: s(6),
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
    minHeight: ms(34),
    maxHeight: ms(112),
    paddingHorizontal: 0,
    paddingTop: ms(7),
    paddingBottom: ms(7),
    textAlignVertical: 'center',
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.4),
  },
  send: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
