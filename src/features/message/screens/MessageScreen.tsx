/**
 * Message inbox — live `/chat/conversations`.
 */

import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, PencilLine, Search } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatApi } from '@/features/message/api/chat.api';
import { InboxThreadRow } from '@/features/message/components/InboxThreadRow';
import { NewMessageSheet } from '@/features/message/components/NewMessageSheet';
import {
  INBOX_FILTERS,
  type InboxFilterKey,
} from '@/features/message/data/messages-preview';
import { chatKeys, useChatInboxQuery, useChatUnreadQuery } from '@/features/message/hooks/useChatQueries';
import { toInboxThread } from '@/features/message/lib/to-inbox-thread';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

/**
 * Instagram / WhatsApp density inbox backed by the chat API.
 */
export function MessageScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthed = Boolean(accessToken);
  const openRegister = useOpenAuth('Register');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InboxFilterKey>('primary');
  const [gateOpen, setGateOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const inboxQuery = useChatInboxQuery(accessToken, 'all', query);
  const unreadQuery = useChatUnreadQuery(accessToken);

  const allThreads = useMemo(
    () => (inboxQuery.data?.items || []).map(toInboxThread),
    [inboxQuery.data],
  );

  const threads = useMemo(() => {
    if (filter === 'requests') {
      return allThreads.filter((thread) => thread.folder === 'other');
    }
    if (filter === 'starred') {
      return allThreads.filter((thread) => thread.starred);
    }
    return allThreads.filter((thread) => thread.folder !== 'other');
  }, [allThreads, filter]);

  const requestUnread = useMemo(
    () =>
      allThreads
        .filter((thread) => thread.folder === 'other')
        .reduce((sum, thread) => sum + thread.unread, 0),
    [allThreads],
  );

  const activeNow = threads.filter((thread) => thread.online);
  const unreadCount = unreadQuery.data?.unreadCount ?? 0;

  const openThread = (conversationId: string, name: string, username?: string) => {
    if (!accessToken) {
      setGateOpen(true);
      return;
    }
    navigation.navigate('ChatThread', { conversationId, name, username });
  };

  const composeMutation = useMutation({
    mutationFn: (input: { peerUserId?: string; peerUsername?: string }) =>
      chatApi.createConversation({
        token: accessToken as string,
        peerUserId: input.peerUserId,
        peerUsername: input.peerUsername,
      }),
    onSuccess: (conversation) => {
      setComposeOpen(false);
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      navigation.navigate('ChatThread', {
        conversationId: conversation.id,
        name: conversation.name,
        username: conversation.username,
      });
    },
    onError: (error) => {
      showErrorToast(error, 'Could not start this chat.', 'Messages');
    },
  });

  const starMutation = useMutation({
    mutationFn: (input: { id: string; starred: boolean }) =>
      chatApi.patchConversation({
        id: input.id,
        token: accessToken as string,
        starred: input.starred,
      }),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      showToast.success(conversation.starred ? 'Starred' : 'Unstarred');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not update this chat.', 'Messages');
    },
  });

  const sheetBg = theme.colors.background;

  return (
    <>
      <SocialStackChrome
        refreshControl={
          isAuthed ? (
            <RefreshControl
              onRefresh={() => {
                void inboxQuery.refetch();
                void unreadQuery.refetch();
              }}
              refreshing={inboxQuery.isRefetching}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
        rightSlot={
          <Pressable
            accessibilityLabel="New message"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              if (!accessToken) {
                setGateOpen(true);
                return;
              }
              setComposeOpen(true);
            }}
            style={[styles.composeBtn, { backgroundColor: theme.colors.primary }]}>
            <PencilLine color="#FFFFFF" size={ms(18)} strokeWidth={2} />
          </Pressable>
        }
        subtitle={
          !isAuthed
            ? 'Join BIGB to message mentors and your prep circle.'
            : unreadCount > 0
              ? `${unreadCount} unread`
              : 'Mentors, officers, and community rooms'
        }
        subtitleLines={2}
        title="Messages">
        <View
          style={[
            styles.search,
            {
              backgroundColor:
                theme.mode === 'dark' ? theme.colors.surface : theme.palette.neutral[100],
            },
          ]}>
          <Search color={theme.colors.textMuted} size={ms(16)} strokeWidth={2} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search names"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { color: theme.colors.text }]}
            value={query}
          />
        </View>

        <View style={styles.tabs}>
          {INBOX_FILTERS.map((item) => {
            const selected = filter === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item.key)}
                style={styles.tab}>
                <AppText
                  color={selected ? 'brand' : 'muted'}
                  style={styles.tabLabel}
                  variant="caption"
                  weight="semibold">
                  {item.key === 'requests' && requestUnread > 0
                    ? `Requests ${requestUnread}`
                    : item.label}
                </AppText>
                <View
                  style={[
                    styles.tabLine,
                    {
                      backgroundColor: selected ? theme.colors.primary : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {!isAuthed ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}>
            <MessageCircle color={theme.colors.primary} size={ms(22)} />
            <AppText variant="label" weight="semibold">
              Sign in to message
            </AppText>
            <AppText color="secondary" style={styles.emptyCopy} variant="caption">
              Watch and browse are free. Join BIGB to open chats with mentors.
            </AppText>
            <Pressable onPress={openRegister}>
              <AppText color="brand" variant="caption" weight="semibold">
                Create a free account
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {isAuthed && inboxQuery.isPending ? <Spinner /> : null}

        {isAuthed && inboxQuery.isError ? (
          <View style={styles.empty}>
            <AppText variant="label" weight="semibold">
              Could not load messages
            </AppText>
            <AppText color="secondary" style={styles.emptyCopy} variant="caption">
              Pull to refresh, or retry once your API is reachable.
            </AppText>
            <Pressable onPress={() => void inboxQuery.refetch()}>
              <AppText color="brand" variant="caption" weight="semibold">
                Retry
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {isAuthed && filter === 'primary' && !query.trim() && activeNow.length > 0 ? (
          <View style={styles.activeBlock}>
            <AppText color="muted" style={styles.activeTitle} variant="caption" weight="semibold">
              Active now
            </AppText>
            <ScrollView
              contentContainerStyle={styles.activeRow}
              directionalLockEnabled
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}>
              {activeNow.map((thread) => (
                <Pressable
                  key={`active-${thread.id}`}
                  accessibilityLabel={thread.name}
                  accessibilityRole="button"
                  onPress={() => openThread(thread.id, thread.name, thread.username)}
                  style={styles.activeItem}>
                  <View style={[styles.activeRing, { borderColor: theme.colors.primary }]}>
                    <View style={[styles.activeAvatar, { backgroundColor: thread.color }]}>
                      <AppText color="inverse" style={styles.activeInitials} weight="bold">
                        {thread.initials}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.activeDot,
                        {
                          borderColor: theme.palette.primary[50],
                          backgroundColor: theme.colors.success,
                        },
                      ]}
                    />
                  </View>
                  <AppText numberOfLines={1} style={styles.activeName} variant="caption">
                    {thread.name.split(' ')[0]}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {isAuthed ? (
          <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
            {!inboxQuery.isPending && !inboxQuery.isError && threads.length === 0 ? (
              <View style={styles.empty}>
                <MessageCircle color={theme.colors.primary} size={ms(22)} />
                <AppText variant="label" weight="semibold">
                  {query.trim()
                    ? 'No matches'
                    : filter === 'requests'
                      ? 'No message requests'
                      : filter === 'starred'
                        ? 'No starred chats'
                        : 'No conversations yet'}
                </AppText>
                <AppText color="secondary" style={styles.emptyCopy} variant="caption">
                  {query.trim()
                    ? 'Try another name, or clear search.'
                    : filter === 'requests'
                      ? "When someone you don't follow messages you, it lands here until you accept."
                      : filter === 'starred'
                        ? 'Tap the star on a chat to keep it here.'
                        : 'Message anyone by username. People you follow land in Primary; others see a request.'}
                </AppText>
              </View>
            ) : (
              threads.map((thread, index) => (
                <InboxThreadRow
                  key={thread.id}
                  onPress={() => openThread(thread.id, thread.name, thread.username)}
                  onToggleStar={() =>
                    starMutation.mutate({
                      id: thread.id,
                      starred: !thread.starred,
                    })
                  }
                  showDivider={index < threads.length - 1}
                  starBusy={starMutation.isPending}
                  thread={thread}
                />
              ))
            )}
          </View>
        ) : null}
      </SocialStackChrome>

      <JoinToContinueSheet
        message="Watch and browse are free. Join BIGB to open chats with mentors and community rooms."
        onClose={() => setGateOpen(false)}
        title="Join to message"
        visible={gateOpen}
      />

      <NewMessageSheet
        busy={composeMutation.isPending}
        onClose={() => setComposeOpen(false)}
        onPickPerson={(person) =>
          composeMutation.mutate({ peerUserId: person.id })
        }
        onPickUsername={(username) =>
          composeMutation.mutate({ peerUsername: username })
        }
        visible={composeOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  composeBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    height: ms(42),
    marginBottom: vs(4),
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.3),
    paddingVertical: 0,
    includeFontPadding: false,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: vs(12),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: vs(10),
  },
  tabLabel: {
    includeFontPadding: false,
    marginBottom: vs(8),
  },
  tabLine: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  activeBlock: {
    marginBottom: vs(12),
  },
  activeTitle: {
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: vs(10),
  },
  activeRow: {
    paddingRight: s(8),
    gap: s(14),
  },
  activeItem: {
    width: s(64),
    alignItems: 'center',
    gap: vs(6),
  },
  activeRing: {
    width: ms(58),
    height: ms(58),
    borderRadius: ms(29),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeAvatar: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeInitials: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.1),
  },
  activeDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    borderWidth: 2,
  },
  activeName: {
    textAlign: 'center',
    width: '100%',
  },
  sheet: {
    borderRadius: ms(20),
    overflow: 'hidden',
    marginHorizontal: s(-4),
  },
  empty: {
    paddingHorizontal: s(16),
    paddingVertical: vs(28),
    alignItems: 'center',
    gap: vs(6),
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: ms(18),
    paddingHorizontal: s(16),
    paddingVertical: vs(22),
    alignItems: 'center',
    gap: vs(6),
    marginBottom: vs(12),
  },
  emptyCopy: {
    textAlign: 'center',
  },
});
