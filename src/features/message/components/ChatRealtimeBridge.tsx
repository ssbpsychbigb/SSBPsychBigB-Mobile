/**
 * Keeps chat queries fresh while a member is signed in.
 */

import { useEffect } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatKeys } from '@/features/message/hooks/useChatQueries';
import {
  bindChatSocketHandlers,
  connectChatSocket,
  disconnectChatSocket,
  type ChatMessageNewPayload,
  type ChatMessageReadPayload,
  type ChatTypingPayload,
} from '@/features/message/lib/chat.socket';
import { useTypingStore } from '@/features/message/lib/typing.store';
import type {
  Conversation,
  MessageListPage,
  ThreadMessage,
} from '@/features/message/types/chat.types';

function isThreadMessage(value: ThreadMessage | undefined): value is ThreadMessage {
  return Boolean(value?.id);
}

/**
 * Appends a live message onto the newest page of the thread cache.
 */
function appendIncomingMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: ChatMessageNewPayload,
) {
  const conversationId = payload.conversationId || payload.message?.conversationId;
  const incoming = payload.message;
  if (!conversationId || !isThreadMessage(incoming)) {
    return;
  }

  queryClient.setQueryData<InfiniteData<MessageListPage, string | null>>(
    chatKeys.messages(conversationId),
    (current) => {
      if (!current) {
        return current;
      }
      const already = current.pages.some((page) =>
        (page.items || []).some((item) => item.id === incoming.id),
      );
      if (already) {
        return current;
      }
      if (current.pages.length === 0) {
        return {
          ...current,
          pages: [{ items: [incoming], nextCursor: null }],
        };
      }
      const [newest, ...rest] = current.pages;
      if (!newest) {
        return current;
      }
      return {
        ...current,
        pages: [
          {
            ...newest,
            items: [...(newest.items || []), incoming],
            nextCursor: newest.nextCursor ?? null,
          },
          ...rest,
        ],
      };
    },
  );
}

function patchThreadMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: ChatMessageNewPayload,
) {
  const conversationId = payload.conversationId || payload.message?.conversationId;
  const incoming = payload.message;
  if (!conversationId || !isThreadMessage(incoming)) {
    return;
  }

  queryClient.setQueryData<InfiniteData<MessageListPage, string | null>>(
    chatKeys.messages(conversationId),
    (current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: (page.items || []).map((item) =>
            item.id === incoming.id ? incoming : item,
          ),
          nextCursor: page.nextCursor ?? null,
        })),
      };
    },
  );
}

function applyPeerRead(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: ChatMessageReadPayload,
) {
  if (!payload.conversationId || !payload.lastReadAt) {
    return;
  }

  const patch = (conversation: Conversation): Conversation => {
    if (conversation.id !== payload.conversationId) {
      return conversation;
    }
    return {
      ...conversation,
      peerLastReadAt: payload.lastReadAt,
      peerLastReadMessageId: payload.lastReadMessageId ?? null,
    };
  };

  queryClient.setQueryData(
    chatKeys.conversation(payload.conversationId),
    (current: Conversation | undefined) => (current ? patch(current) : current),
  );
}

/**
 * Connects Socket.IO for the app portal session.
 */
export function ChatRealtimeBridge() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      disconnectChatSocket();
      return undefined;
    }

    connectChatSocket(token);
    const unbind = bindChatSocketHandlers({
      onInvalidate: () => {
        void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      },
      onMessageNew: (payload) => {
        appendIncomingMessage(queryClient, payload);
      },
      onMessageDeleted: (payload) => {
        patchThreadMessage(queryClient, payload);
      },
      onMessageUpdated: (payload) => {
        patchThreadMessage(queryClient, payload);
      },
      onMessageRead: (payload) => {
        applyPeerRead(queryClient, payload);
      },
      onTypingUpdate: (payload: ChatTypingPayload) => {
        if (!payload.conversationId || !payload.userId) {
          return;
        }
        useTypingStore
          .getState()
          .setTyping(payload.conversationId, payload.userId, payload.typing);
      },
    });

    return () => {
      unbind();
      disconnectChatSocket();
    };
  }, [queryClient, token]);

  return null;
}
