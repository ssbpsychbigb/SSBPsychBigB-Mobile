/**
 * Chat Socket.IO client — JWT handshake, same origin as the REST API.
 */

import { io } from 'socket.io-client';

import { API_BASE_URL } from '@/shared/api/client';
import type { ThreadMessage } from '@/features/message/types/chat.types';

const SOCKET_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/i, '');

type SocketLike = {
  connected: boolean;
  on: (event: string, fn: (...args: unknown[]) => void) => void;
  off: (event: string, fn: (...args: unknown[]) => void) => void;
  emit: (event: string, payload?: unknown) => void;
  disconnect: () => void;
  removeAllListeners: () => void;
};

export type ChatMessageNewPayload = {
  conversationId?: string;
  message?: ThreadMessage;
};

export type ChatMessageReadPayload = {
  conversationId: string;
  readerId: string;
  lastReadAt: string;
  lastReadMessageId?: string | null;
};

export type ChatTypingPayload = {
  conversationId: string;
  userId: string;
  typing: boolean;
};

type ChatSocketHandlers = {
  onInvalidate?: () => void;
  onMessageNew?: (payload: ChatMessageNewPayload) => void;
  onMessageDeleted?: (payload: ChatMessageNewPayload) => void;
  onMessageUpdated?: (payload: ChatMessageNewPayload) => void;
  onMessageRead?: (payload: ChatMessageReadPayload) => void;
  onTypingUpdate?: (payload: ChatTypingPayload) => void;
};

let socket: SocketLike | null = null;
let activeToken: string | null = null;

/**
 * Ensures a single authenticated chat socket.
 */
export function connectChatSocket(token: string): SocketLike | null {
  if (socket && activeToken === token && socket.connected) {
    return socket;
  }

  disconnectChatSocket();
  activeToken = token;
  socket = io(SOCKET_ORIGIN, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1200,
    reconnectionAttempts: 20,
  }) as SocketLike;
  return socket;
}

export function disconnectChatSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  activeToken = null;
}

/**
 * Inbox / thread refetch triggers. Returns cleanup.
 */
export function bindChatSocketHandlers(handlers: ChatSocketHandlers): () => void {
  if (!socket) {
    return () => undefined;
  }

  const refresh = () => handlers.onInvalidate?.();
  const onNew = (...args: unknown[]) => {
    const payload = (args[0] || {}) as ChatMessageNewPayload;
    handlers.onMessageNew?.(payload);
    refresh();
  };
  const onDeleted = (...args: unknown[]) => {
    const payload = (args[0] || {}) as ChatMessageNewPayload;
    handlers.onMessageDeleted?.(payload);
    refresh();
  };
  const onUpdated = (...args: unknown[]) => {
    const payload = (args[0] || {}) as ChatMessageNewPayload;
    handlers.onMessageUpdated?.(payload);
    refresh();
  };
  const onRead = (...args: unknown[]) => {
    const payload = (args[0] || {}) as ChatMessageReadPayload;
    handlers.onMessageRead?.(payload);
  };
  const onTyping = (...args: unknown[]) => {
    const payload = (args[0] || {}) as ChatTypingPayload;
    handlers.onTypingUpdate?.(payload);
  };

  socket.on('message:new', onNew);
  socket.on('message:updated', onUpdated);
  socket.on('message:deleted', onDeleted);
  socket.on('message:read', onRead);
  socket.on('typing:update', onTyping);
  socket.on('conversation:updated', refresh);
  socket.on('unread:total', refresh);

  return () => {
    socket?.off('message:new', onNew);
    socket?.off('message:updated', onUpdated);
    socket?.off('message:deleted', onDeleted);
    socket?.off('message:read', onRead);
    socket?.off('typing:update', onTyping);
    socket?.off('conversation:updated', refresh);
    socket?.off('unread:total', refresh);
  };
}

export function joinConversationRoom(conversationId: string): void {
  socket?.emit('conversation:join', { conversationId });
}

export function leaveConversationRoom(conversationId: string): void {
  socket?.emit('conversation:leave', { conversationId });
}

export function emitTypingStart(conversationId: string): void {
  socket?.emit('typing:start', { conversationId });
}

export function emitTypingStop(conversationId: string): void {
  socket?.emit('typing:stop', { conversationId });
}
