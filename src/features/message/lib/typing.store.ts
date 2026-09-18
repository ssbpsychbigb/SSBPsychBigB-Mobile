/**
 * Live typing flags per conversation — socket `typing:update`.
 */

import { create } from 'zustand';

export const EMPTY_TYPING: string[] = [];

type TypingStore = {
  byConversation: Record<string, string[]>;
  setTyping: (conversationId: string, userId: string, typing: boolean) => void;
  clearConversation: (conversationId: string) => void;
};

/**
 * Peer user ids currently typing in a thread.
 */
export const useTypingStore = create<TypingStore>((set) => ({
  byConversation: {},
  setTyping: (conversationId, userId, typing) =>
    set((state) => {
      const prev = state.byConversation[conversationId] || EMPTY_TYPING;
      const has = prev.includes(userId);
      if (typing && has) {
        return state;
      }
      if (!typing && !has) {
        return state;
      }
      const current = new Set(prev);
      if (typing) {
        current.add(userId);
      } else {
        current.delete(userId);
      }
      return {
        byConversation: {
          ...state.byConversation,
          [conversationId]: [...current],
        },
      };
    }),
  clearConversation: (conversationId) =>
    set((state) => {
      if (!(conversationId in state.byConversation)) {
        return state;
      }
      const next = { ...state.byConversation };
      delete next[conversationId];
      return { byConversation: next };
    }),
}));
