/**
 * Chat REST — same contracts as the web messaging API.
 */

import { apiRequest } from '@/shared/api';
import type {
  ChatPeoplePage,
  Conversation,
  ConversationFolder,
  ConversationListPage,
  MessageAttachment,
  MessageListPage,
  MessagingFilter,
  ThreadMessage,
} from '@/features/message/types/chat.types';

function normalizeConversation(raw: Conversation): Conversation {
  return {
    ...raw,
    unread: Boolean(raw.unread) || (raw.unreadCount ?? 0) > 0,
    unreadCount: raw.unreadCount ?? (raw.unread ? 1 : 0),
    folder: raw.folder === 'other' ? 'other' : 'focused',
    youBlocked: Boolean(raw.youBlocked),
    blockedByPeer: Boolean(raw.blockedByPeer),
    starred: Boolean(raw.starred),
    archived: Boolean(raw.archived),
    labeledMentors: Boolean(raw.labeledMentors),
    muted: Boolean(raw.muted),
    peerLastReadAt: raw.peerLastReadAt || null,
    peerLastReadMessageId: raw.peerLastReadMessageId || null,
    readReceiptsEnabled: raw.readReceiptsEnabled !== false,
    profilePhotoPath: raw.profilePhotoPath ?? raw.peer?.profilePhotoPath ?? null,
    name: raw.name || raw.peer?.name || 'Member',
    username: raw.username || raw.peer?.username || '',
    headline: raw.headline || raw.peer?.headline || '',
    online: Boolean(raw.online),
  };
}

export const chatApi = {
  listPeople(params: { token: string; q?: string; limit?: number }) {
    const search = new URLSearchParams();
    if (params.q) {
      search.set('q', params.q);
    }
    if (params.limit) {
      search.set('limit', String(params.limit));
    }
    const qs = search.toString();
    return apiRequest<ChatPeoplePage>(`/chat/people${qs ? `?${qs}` : ''}`, {
      token: params.token,
    }).then((page) => ({
      query: page?.query ?? '',
      items: page?.items ?? [],
    }));
  },

  listConversations(params: {
    token: string;
    filter?: MessagingFilter;
    q?: string;
    limit?: number;
  }) {
    const search = new URLSearchParams();
    if (params.filter) {
      search.set('filter', params.filter);
    }
    if (params.q) {
      search.set('q', params.q);
    }
    if (params.limit) {
      search.set('limit', String(params.limit));
    }
    const qs = search.toString();
    return apiRequest<ConversationListPage>(
      `/chat/conversations${qs ? `?${qs}` : ''}`,
      { token: params.token },
    ).then((page) => ({
      ...page,
      items: (page.items || []).map(normalizeConversation),
    }));
  },

  createConversation(params: {
    token: string;
    peerUserId?: string;
    peerUsername?: string;
  }) {
    return apiRequest<Conversation>('/chat/conversations', {
      method: 'POST',
      token: params.token,
      body: {
        peerUserId: params.peerUserId,
        peerUsername: params.peerUsername,
      },
    }).then(normalizeConversation);
  },

  getConversation(id: string, token: string) {
    return apiRequest<Conversation>(
      `/chat/conversations/${encodeURIComponent(id)}`,
      { token },
    ).then(normalizeConversation);
  },

  listMessages(params: {
    conversationId: string;
    token: string;
    before?: string | null;
    limit?: number;
  }) {
    const search = new URLSearchParams();
    if (params.before) {
      search.set('before', params.before);
    }
    if (params.limit) {
      search.set('limit', String(params.limit));
    }
    const qs = search.toString();
    return apiRequest<MessageListPage>(
      `/chat/conversations/${encodeURIComponent(params.conversationId)}/messages${qs ? `?${qs}` : ''}`,
      { token: params.token },
    ).then((page) => ({
      items: page?.items ?? [],
      nextCursor: page?.nextCursor ?? null,
    }));
  },

  sendMessage(params: {
    conversationId: string;
    body: string;
    token: string;
    attachment?: MessageAttachment;
  }) {
    return apiRequest<ThreadMessage>(
      `/chat/conversations/${encodeURIComponent(params.conversationId)}/messages`,
      {
        method: 'POST',
        token: params.token,
        body: {
          body: params.body,
          attachment: params.attachment
            ? {
                kind: params.attachment.kind,
                name: params.attachment.name,
                path: params.attachment.path,
                mime: params.attachment.mime,
                size: params.attachment.size,
                previewUrl: params.attachment.previewUrl,
                gifEmoji: params.attachment.gifEmoji,
                gifTone: params.attachment.gifTone,
              }
            : undefined,
        },
      },
    );
  },

  uploadFile(formData: FormData, token: string) {
    return apiRequest<{
      kind: 'image' | 'file';
      name: string;
      path: string;
      mime: string;
      size: number;
      sizeLabel: string;
    }>('/chat/uploads', { method: 'POST', formData, token });
  },

  markRead(id: string, token: string) {
    return apiRequest<Conversation>(
      `/chat/conversations/${encodeURIComponent(id)}/read`,
      { method: 'POST', token },
    ).then(normalizeConversation);
  },

  unreadCount(token: string) {
    return apiRequest<{ unreadCount: number }>('/chat/unread-count', { token });
  },

  patchConversation(params: {
    id: string;
    token: string;
    folder?: ConversationFolder;
    acceptRequest?: boolean;
    starred?: boolean;
    archived?: boolean;
    labeledMentors?: boolean;
    muted?: boolean;
    unread?: boolean;
  }) {
    return apiRequest<Conversation>(
      `/chat/conversations/${encodeURIComponent(params.id)}`,
      {
        method: 'PATCH',
        token: params.token,
        body: {
          folder: params.folder,
          acceptRequest: params.acceptRequest,
          starred: params.starred,
          archived: params.archived,
          labeledMentors: params.labeledMentors,
          muted: params.muted,
          unread: params.unread,
        },
      },
    ).then(normalizeConversation);
  },

  deleteConversation(id: string, token: string) {
    return apiRequest<{ id: string; deleted: boolean }>(
      `/chat/conversations/${encodeURIComponent(id)}`,
      { method: 'DELETE', token },
    );
  },

  deleteMessage(params: {
    conversationId: string;
    messageId: string;
    token: string;
  }) {
    return apiRequest<ThreadMessage>(
      `/chat/conversations/${encodeURIComponent(params.conversationId)}/messages/${encodeURIComponent(params.messageId)}`,
      { method: 'DELETE', token: params.token },
    );
  },

  editMessage(params: {
    conversationId: string;
    messageId: string;
    body: string;
    token: string;
  }) {
    return apiRequest<ThreadMessage>(
      `/chat/conversations/${encodeURIComponent(params.conversationId)}/messages/${encodeURIComponent(params.messageId)}`,
      {
        method: 'PATCH',
        token: params.token,
        body: { body: params.body },
      },
    );
  },

  unblockConversation(id: string, token: string) {
    return apiRequest<Conversation>(
      `/chat/conversations/${encodeURIComponent(id)}/unblock`,
      { method: 'POST', token },
    ).then(normalizeConversation);
  },

  blockConversation(id: string, token: string) {
    return apiRequest<Conversation>(
      `/chat/conversations/${encodeURIComponent(id)}/block`,
      { method: 'POST', token },
    ).then(normalizeConversation);
  },

  reportAndBlock(
    id: string,
    body: { reason: string; note?: string },
    token: string,
  ) {
    return apiRequest<Conversation>(
      `/chat/conversations/${encodeURIComponent(id)}/report-block`,
      { method: 'POST', token, body },
    ).then(normalizeConversation);
  },
};
