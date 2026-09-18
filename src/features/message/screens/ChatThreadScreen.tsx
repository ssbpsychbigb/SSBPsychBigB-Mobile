/**
 * Direct / group thread — WhatsApp-style history pinned to the bottom.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowLeft,
  Bell,
  BellOff,
  Copy,
  Flag,
  GraduationCap,
  Inbox,
  Mail,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
  Unlock,
  UserRound,
  X,
} from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatApi } from '@/features/message/api/chat.api';
import { ChatBubble } from '@/features/message/components/ChatBubble';
import { ChatComposer } from '@/features/message/components/ChatComposer';
import {
  copyThreadMessage,
  messageCopyText,
  MessageDeleteSheet,
} from '@/features/message/components/MessageActionOverlay';
import {
  ChatReportSheet,
  ChatThreadMenu,
  type ChatMenuItem,
} from '@/features/message/components/ChatSafetySheet';
import {
  chatKeys,
  useChatConversationQuery,
  useChatMessagesQuery,
} from '@/features/message/hooks/useChatQueries';
import { joinConversationRoom, leaveConversationRoom } from '@/features/message/lib/chat.socket';
import { EMPTY_TYPING, useTypingStore } from '@/features/message/lib/typing.store';
import type { MessageAttachment, ThreadMessage } from '@/features/message/types/chat.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, Screen, ScreenHeader, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatThread'>;

/**
 * Professional chat canvas: messages rise from the composer, incoming left / outgoing right.
 */
export function ChatThreadScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ThreadMessage>>(null);
  const readyRef = useRef(false);
  const { conversationId, name, username: usernameParam } = route.params;
  const token = useAuthStore((state) => state.accessToken);
  const selfId = useAuthStore((state) => state.user?.id);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actionMessage, setActionMessage] = useState<ThreadMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ThreadMessage | null>(null);
  const [deleteMessageOpen, setDeleteMessageOpen] = useState(false);
  const typingIds = useTypingStore(
    (state) => state.byConversation[conversationId] || EMPTY_TYPING,
  );
  const peerTyping = typingIds.some((id) => id && id !== selfId);

  const conversationQuery = useChatConversationQuery(conversationId, token);
  const messagesQuery = useChatMessagesQuery(conversationId, token);

  const title = conversationQuery.data?.name || name || 'Chat';
  const messages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    return [...pages].reverse().flatMap((page) => page.items ?? []);
  }, [messagesQuery.data]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }
    joinConversationRoom(conversationId);
    void chatApi.markRead(conversationId, token).then(() => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
    });
    return () => {
      leaveConversationRoom(conversationId);
      useTypingStore.getState().clearConversation(conversationId);
    };
  }, [conversationId, queryClient, token]);

  useEffect(() => {
    readyRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    const last = messages[messages.length - 1];
    const jump = !readyRef.current || last?.author === 'you';
    readyRef.current = true;
    if (!jump) {
      return;
    }
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: Boolean(last?.author === 'you') });
    });
  }, [conversationId, messages]);

  useEffect(() => {
    if (!actionMessage && !editingMessage) {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (actionMessage) {
        setDeleteMessageOpen(false);
        setActionMessage(null);
        return true;
      }
      setEditingMessage(null);
      setDraft('');
      return true;
    });
    return () => sub.remove();
  }, [actionMessage, editingMessage]);

  const isGroup =
    conversationQuery.data?.type === 'group' ||
    conversationQuery.data?.kind === 'group';
  const isRequest = conversationQuery.data?.folder === 'other';
  const youBlocked = Boolean(conversationQuery.data?.youBlocked);
  const blockedByPeer = Boolean(conversationQuery.data?.blockedByPeer);
  const messagingLocked = youBlocked || blockedByPeer;

  const acceptMutation = useMutation({
    mutationFn: () =>
      chatApi.patchConversation({
        id: conversationId,
        token: token as string,
        acceptRequest: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
    onError: (error) => {
      showErrorToast(error, 'Could not accept this request.', 'Chat');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => chatApi.deleteConversation(conversationId, token as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      navigation.goBack();
    },
    onError: (error) => {
      showErrorToast(error, 'Could not delete this chat.', 'Chat');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) =>
      chatApi.deleteMessage({
        conversationId,
        messageId,
        token: token as string,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      setActionMessage(null);
      setDeleteMessageOpen(false);
    },
    onError: (error) => {
      showErrorToast(error, 'Could not delete this message.', 'Chat');
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: (input: { messageId: string; body: string }) =>
      chatApi.editMessage({
        conversationId,
        messageId: input.messageId,
        body: input.body,
        token: token as string,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      setEditingMessage(null);
      setDraft('');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not edit this message.', 'Chat');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => chatApi.unblockConversation(conversationId, token as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      setMenuOpen(false);
      showToast.success('Unblocked', `${title} can message you again.`);
    },
    onError: (error) => {
      showErrorToast(error, 'Could not unblock this person.', 'Chat');
    },
  });

  const reportMutation = useMutation({
    mutationFn: (reason: string) =>
      chatApi.reportAndBlock(conversationId, { reason }, token as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      setReportOpen(false);
      setMenuOpen(false);
      showToast.success('Reported', `${title} is blocked and the report was sent.`);
    },
    onError: (error) => {
      showErrorToast(error, 'Could not send this report.', 'Chat');
    },
  });

  const patchMutation = useMutation({
    mutationFn: (body: {
      folder?: 'focused' | 'other';
      starred?: boolean;
      archived?: boolean;
      labeledMentors?: boolean;
      muted?: boolean;
      unread?: boolean;
    }) =>
      chatApi.patchConversation({
        id: conversationId,
        token: token as string,
        ...body,
      }),
    onSuccess: (conversation, body) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      setMenuOpen(false);
      if (body.archived) {
        navigation.goBack();
        return;
      }
      if (body.starred !== undefined) {
        showToast.success(conversation.starred ? 'Starred' : 'Unstarred');
      }
    },
    onError: (error) => {
      showErrorToast(error, 'Could not update this chat.', 'Chat');
    },
  });

  const conversation = conversationQuery.data;
  const starred = Boolean(conversation?.starred);
  const muted = Boolean(conversation?.muted);
  const labeledMentors = Boolean(conversation?.labeledMentors);
  const unread = Boolean(conversation?.unread);
  const peerUsername =
    conversation?.username?.trim() || usernameParam?.trim() || '';

  const openPeerProfile = () => {
    if (!peerUsername) {
      showToast.error('This chat has no profile to open.');
      return;
    }
    setMenuOpen(false);
    navigation.navigate('MemberProfile', { username: peerUsername, name: title });
  };

  const menuItems = useMemo<ChatMenuItem[]>(() => {
    if (isGroup) {
      return [];
    }
    const items: ChatMenuItem[] = [];
    if (peerUsername) {
      items.push({ key: 'profile', label: 'View profile', Icon: UserRound });
    }
    items.push(
      {
        key: 'folder',
        label: isRequest ? 'Move to Focused' : 'Move to Other',
        Icon: Inbox,
      },
      {
        key: 'mentors',
        label: labeledMentors ? 'Remove Mentors label' : 'Label as Mentors',
        Icon: GraduationCap,
      },
      {
        key: 'unread',
        label: unread ? 'Mark as read' : 'Mark as unread',
        Icon: Mail,
      },
      {
        key: 'star',
        label: starred ? 'Unstar' : 'Star',
        Icon: Star,
      },
      {
        key: 'archive',
        label: 'Archive',
        Icon: Archive,
      },
      {
        key: 'mute',
        label: muted ? 'Unmute notifications' : 'Mute notifications',
        Icon: muted ? Bell : BellOff,
      },
      {
        key: 'report',
        label: 'Report / Block',
        Icon: Flag,
        separatorBefore: true,
        tone: 'danger',
      },
    );
    if (youBlocked) {
      items.push({ key: 'unblock', label: 'Unblock', Icon: Unlock });
    }
    items.push({
      key: 'delete',
      label: 'Delete conversation',
      Icon: Trash2,
      tone: 'danger',
    });
    return items;
  }, [
    isGroup,
    isRequest,
    labeledMentors,
    muted,
    peerUsername,
    starred,
    unread,
    youBlocked,
  ]);

  const onMenuSelect = (key: string) => {
    if (key === 'profile') {
      openPeerProfile();
      return;
    }
    if (key === 'folder') {
      patchMutation.mutate({ folder: isRequest ? 'focused' : 'other' });
      return;
    }
    if (key === 'mentors') {
      patchMutation.mutate({ labeledMentors: !labeledMentors });
      return;
    }
    if (key === 'unread') {
      patchMutation.mutate({ unread: !unread });
      return;
    }
    if (key === 'star') {
      patchMutation.mutate({ starred: !starred });
      return;
    }
    if (key === 'archive') {
      patchMutation.mutate({ archived: true });
      return;
    }
    if (key === 'mute') {
      patchMutation.mutate({ muted: !muted });
      return;
    }
    if (key === 'report') {
      setMenuOpen(false);
      setReportOpen(true);
      return;
    }
    if (key === 'unblock') {
      unblockMutation.mutate();
      return;
    }
    if (key === 'delete') {
      setMenuOpen(false);
      setDeleteConfirm(true);
    }
  };

  const sendMutation = useMutation({
    mutationFn: (input: { body: string; attachment?: MessageAttachment }) =>
      chatApi.sendMessage({
        conversationId,
        body: input.body,
        attachment: input.attachment,
        token: token as string,
      }),
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
    onError: (error) => {
      showErrorToast(error, 'Could not send this message.', 'Chat');
    },
  });

  const canvas =
    theme.mode === 'dark' ? theme.colors.background : theme.palette.primary[50];

  return (
    <Screen
      contentStyle={styles.shell}
      padded={false}
      safeBottom
      style={{ backgroundColor: canvas }}>
      <ScreenHeader>
        {actionMessage ? (
          <>
            <Pressable
              accessibilityLabel="Clear selection"
              accessibilityRole="button"
              hitSlop={ms(10)}
              onPress={() => {
                setDeleteMessageOpen(false);
                setActionMessage(null);
              }}
              style={[
                styles.back,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}>
              <X color={theme.colors.text} size={ms(20)} strokeWidth={2} />
            </Pressable>
            <AppText style={styles.titles} variant="subtitle" weight="bold">
              1 selected
            </AppText>
            <View style={styles.headerActions}>
              {messageCopyText(actionMessage) ? (
                <Pressable
                  accessibilityLabel="Copy"
                  accessibilityRole="button"
                  hitSlop={ms(8)}
                  onPress={() => void copyThreadMessage(actionMessage)}
                  style={styles.moreBtn}>
                  <Copy color={theme.colors.text} size={ms(22)} strokeWidth={2} />
                </Pressable>
              ) : null}
              {actionMessage.author === 'you' &&
              actionMessage.status !== 'deleted' &&
              Boolean(actionMessage.body?.trim()) ? (
                <Pressable
                  accessibilityLabel="Edit"
                  accessibilityRole="button"
                  hitSlop={ms(8)}
                  onPress={() => {
                    setEditingMessage(actionMessage);
                    setDraft(actionMessage.body);
                    setActionMessage(null);
                    setDeleteMessageOpen(false);
                  }}
                  style={styles.moreBtn}>
                  <Pencil color={theme.colors.text} size={ms(20)} strokeWidth={2} />
                </Pressable>
              ) : null}
              {actionMessage.author === 'you' ? (
                <Pressable
                  accessibilityLabel="Delete"
                  accessibilityRole="button"
                  hitSlop={ms(8)}
                  onPress={() => setDeleteMessageOpen(true)}
                  style={styles.moreBtn}>
                  <Trash2 color={theme.colors.danger} size={ms(22)} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>
          </>
        ) : (
          <>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={ms(10)}
          onPress={() => navigation.goBack()}
          style={[
            styles.back,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <ArrowLeft color={theme.colors.text} size={ms(20)} strokeWidth={2} />
        </Pressable>
        <Pressable
          accessibilityHint="Opens this member’s profile"
          accessibilityLabel={title}
          accessibilityRole="link"
          disabled={!peerUsername || isGroup}
          onPress={openPeerProfile}
          style={styles.titles}>
          <AppText numberOfLines={1} variant="subtitle" weight="bold">
            {title}
          </AppText>
          <AppText color="muted" numberOfLines={1} variant="caption">
            {youBlocked
              ? 'You blocked this person'
              : blockedByPeer
                ? 'This person blocked you'
                : peerTyping
                  ? 'typing…'
                  : conversationQuery.data?.folder === 'other'
                    ? 'Message request'
                    : conversationQuery.data?.headline || 'Direct message'}
          </AppText>
        </Pressable>
        {!isGroup ? (
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel={starred ? 'Unstar' : 'Star'}
              accessibilityRole="button"
              hitSlop={ms(8)}
              onPress={() => patchMutation.mutate({ starred: !starred })}
              style={styles.moreBtn}>
              <Star
                color={starred ? theme.colors.primary : theme.colors.text}
                fill={starred ? theme.colors.primary : 'none'}
                size={ms(22)}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="Thread actions"
              accessibilityRole="button"
              hitSlop={ms(8)}
              onPress={() => setMenuOpen(true)}
              style={styles.moreBtn}>
              <MoreVertical color={theme.colors.text} size={ms(22)} strokeWidth={2} />
            </Pressable>
          </View>
        ) : null}
          </>
        )}
      </ScreenHeader>

      {youBlocked || blockedByPeer ? (
        <View style={styles.chipWrap}>
          <View
            style={[
              styles.blockChip,
              { backgroundColor: `${theme.colors.danger}18` },
            ]}>
            <AppText style={{ color: theme.colors.danger }} variant="caption" weight="semibold">
              {youBlocked ? `You blocked ${title}` : `${title} blocked you`}
            </AppText>
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.flex}>
        {messagesQuery.isPending ? (
          <Spinner />
        ) : messagesQuery.isError && messages.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="label" weight="semibold">
              Could not load this chat
            </AppText>
            <AppText color="secondary" style={styles.emptyCopy} variant="caption">
              Check that the API is running, then retry.
            </AppText>
            <Pressable onPress={() => void messagesQuery.refetch()}>
              <AppText color="brand" variant="caption" weight="semibold">
                Retry
              </AppText>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ListEmptyComponent={
              <View style={styles.empty}>
                <AppText variant="label" weight="semibold">
                  No messages yet
                </AppText>
                <AppText color="secondary" style={styles.emptyCopy} variant="caption">
                  Say hello — your first message starts the thread.
                </AppText>
              </View>
            }
            ListHeaderComponent={
              messagesQuery.hasNextPage ? (
                <Pressable
                  onPress={() => void messagesQuery.fetchNextPage()}
                  style={styles.earlier}>
                  <AppText color="brand" variant="caption" weight="semibold">
                    {messagesQuery.isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
                  </AppText>
                </Pressable>
              ) : null
            }
            contentContainerStyle={
              messages.length === 0 ? styles.listEmpty : styles.list
            }
            data={messages}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ref={listRef}
            renderItem={({ item, index }) => (
              <ChatBubble
                message={item}
                onLongPress={setActionMessage}
                onPress={() => {
                  if (actionMessage) {
                    setActionMessage(null);
                    setDeleteMessageOpen(false);
                  }
                }}
                peerLastReadAt={
                  conversationQuery.data?.readReceiptsEnabled === false
                    ? null
                    : conversationQuery.data?.peerLastReadAt
                }
                previousSentAt={index > 0 ? messages[index - 1]?.sentAt : undefined}
                receiptsOn={conversationQuery.data?.readReceiptsEnabled !== false}
                selected={
                  actionMessage?.id === item.id || editingMessage?.id === item.id
                }
              />
            )}
            style={styles.flex}
          />
        )}

        {messagingLocked ? (
          <View
            style={[
              styles.requestBanner,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText variant="caption" style={styles.requestCopy}>
              {youBlocked
                ? `You blocked ${title}. Unblock to send messages again.`
                : `${title} is not accepting messages from you.`}
            </AppText>
            {youBlocked ? (
              <Pressable
                disabled={unblockMutation.isPending}
                onPress={() => unblockMutation.mutate()}
                style={[styles.requestBtn, { backgroundColor: theme.colors.primary }]}>
                <AppText color="inverse" variant="caption" weight="semibold">
                  Unblock
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : isRequest ? (
          <View
            style={[
              styles.requestBanner,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText variant="caption" style={styles.requestCopy}>
              {title} is not someone you follow. Accept to move this chat to
              Primary, or delete to hide it. Replying also accepts.
            </AppText>
            <View style={styles.requestActions}>
              <Pressable
                disabled={acceptMutation.isPending}
                onPress={() => acceptMutation.mutate()}
                style={[styles.requestBtn, { backgroundColor: theme.colors.primary }]}>
                <AppText color="inverse" variant="caption" weight="semibold">
                  Accept
                </AppText>
              </Pressable>
              <Pressable
                disabled={deleteMutation.isPending}
                onPress={() => deleteMutation.mutate()}
                style={[
                  styles.requestBtn,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                  },
                ]}>
                <AppText variant="caption" weight="semibold">
                  Delete
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        {messagingLocked ? null : (
        <ChatComposer
          busy={sendMutation.isPending || editMessageMutation.isPending}
          conversationId={conversationId}
          draft={draft}
          editing={Boolean(editingMessage)}
          onCancelEdit={() => {
            setEditingMessage(null);
            setDraft('');
          }}
          onDraft={setDraft}
          onSend={(attachment) => {
            if (editingMessage) {
              const body = draft.trim();
              if (!body) {
                return;
              }
              editMessageMutation.mutate({
                messageId: editingMessage.id,
                body,
              });
              return;
            }
            sendMutation.mutate({
              body: draft.trim(),
              attachment,
            });
          }}
        />
        )}
      </KeyboardAvoidingView>

      <ChatThreadMenu
        busy={
          patchMutation.isPending ||
          unblockMutation.isPending ||
          deleteMutation.isPending
        }
        items={menuItems}
        onClose={() => setMenuOpen(false)}
        onSelect={onMenuSelect}
        visible={menuOpen}
      />
      <ChatReportSheet
        busy={reportMutation.isPending}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason) => reportMutation.mutate(reason)}
        peerName={title}
        visible={reportOpen}
      />
      <ConfirmModal
        Icon={Trash2}
        confirmLabel="Delete for me"
        isLoading={deleteMutation.isPending}
        message="This removes the conversation from your inbox only. They won’t be notified."
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={`Delete chat with ${title}?`}
        tone="danger"
        visible={deleteConfirm}
      />
      <MessageDeleteSheet
        busy={deleteMessageMutation.isPending}
        onClose={() => setDeleteMessageOpen(false)}
        onDeleteEveryone={() => {
          if (actionMessage) {
            deleteMessageMutation.mutate(actionMessage.id);
          }
        }}
        visible={deleteMessageOpen}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  back: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(10),
  },
  moreBtn: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  list: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: s(14),
    paddingTop: vs(8),
    paddingBottom: vs(10),
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: s(28),
    gap: vs(6),
  },
  emptyCopy: {
    textAlign: 'center',
  },
  earlier: {
    alignItems: 'center',
    paddingVertical: vs(10),
  },
  requestBanner: {
    marginHorizontal: s(14),
    marginBottom: vs(8),
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    gap: vs(10),
  },
  requestCopy: {
    textAlign: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: s(8),
  },
  requestBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(12),
    paddingVertical: vs(10),
  },
  chipWrap: {
    alignItems: 'center',
    paddingBottom: vs(8),
  },
  blockChip: {
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
  },
});
