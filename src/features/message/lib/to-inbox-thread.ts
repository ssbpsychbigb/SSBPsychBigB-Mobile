/**
 * Maps API conversations onto the inbox row model.
 */

import type { InboxThreadPreview } from '@/features/message/data/messages-preview';
import { inboxTimeLabel } from '@/features/message/lib/message-display';
import type { Conversation } from '@/features/message/types/chat.types';
import { getUserInitials } from '@/features/home/lib/user-initials';

const COLORS = ['#1351A1', '#1667CF', '#1877F2', '#CC5800', '#0E2B50'];

function avatarColor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index)) % COLORS.length;
  }
  return COLORS[hash] ?? '#1351A1';
}

/**
 * Inbox row from `/chat/conversations`.
 */
export function toInboxThread(conversation: Conversation): InboxThreadPreview {
  const name = conversation.name?.trim() || 'Member';
  const isGroup =
    conversation.type === 'group' || conversation.kind === 'group';
  return {
    id: conversation.id,
    name,
    username: conversation.username || undefined,
    initials: getUserInitials(name),
    color: avatarColor(conversation.id),
    roleLabel: conversation.headline || (isGroup ? 'Community' : 'Direct'),
    lastMessage: conversation.preview || 'No messages yet',
    timeLabel: inboxTimeLabel(conversation.updatedAt),
    unread: conversation.unreadCount ?? (conversation.unread ? 1 : 0),
    kind: isGroup ? 'community' : 'direct',
    folder: conversation.folder === 'other' ? 'other' : 'focused',
    youBlocked: Boolean(conversation.youBlocked),
    blockedByPeer: Boolean(conversation.blockedByPeer),
    online: Boolean(conversation.online),
    starred: Boolean(conversation.starred),
  };
}
