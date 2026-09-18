/**
 * Chat types — aligned with the web messaging module.
 */

export type ConversationFolder = 'focused' | 'other';

export type MessagingFilter =
  | 'all'
  | 'focused'
  | 'other'
  | 'unread'
  | 'mentors'
  | 'institutes'
  | 'starred';

export type ConversationKind = 'person' | 'mentor' | 'institute' | 'group';

export type ConversationType = 'dm' | 'group';

export type MessageAuthor = 'them' | 'you';

export type MessageAttachment = {
  kind: 'image' | 'file' | 'gif';
  name: string;
  sizeLabel?: string;
  previewUrl?: string;
  path?: string;
  mime?: string;
  size?: number;
  gifEmoji?: string;
  gifTone?: string;
};

export type ThreadMessage = {
  id: string;
  conversationId?: string;
  senderId?: string;
  author: MessageAuthor;
  body: string;
  sentAt: string;
  editedAt?: string | null;
  status?: 'sending' | 'sent' | 'failed' | 'deleted';
  attachment?: MessageAttachment;
};

export type ChatPeer = {
  id: string;
  name: string;
  username: string;
  headline?: string;
  role?: string;
  profilePhotoPath?: string | null;
};

export type Conversation = {
  id: string;
  peer?: ChatPeer;
  name: string;
  username: string;
  headline: string;
  kind: ConversationKind;
  type?: ConversationType;
  title?: string;
  preview: string;
  updatedAt: string;
  unread: boolean;
  unreadCount?: number;
  folder?: ConversationFolder;
  youBlocked?: boolean;
  blockedByPeer?: boolean;
  starred?: boolean;
  archived?: boolean;
  labeledMentors?: boolean;
  muted?: boolean;
  online?: boolean;
  peerLastReadAt?: string | null;
  peerLastReadMessageId?: string | null;
  readReceiptsEnabled?: boolean;
  profilePhotoPath?: string | null;
  messages?: ThreadMessage[];
};

export type ChatPersonRelation =
  | 'friend'
  | 'following'
  | 'follower'
  | 'recent'
  | 'suggested';

export type ChatPerson = {
  id: string;
  username: string;
  name: string;
  headline: string;
  profilePhotoPath?: string | null;
  relation: ChatPersonRelation;
  followingAuthor: boolean;
  followsYou: boolean;
  isMutual: boolean;
  isRecent?: boolean;
  sendsAsRequest?: boolean;
};

export type ChatPeoplePage = {
  query: string;
  items: ChatPerson[];
};

export type ConversationListPage = {
  items: Conversation[];
  nextCursor: string | null;
};

export type MessageListPage = {
  items: ThreadMessage[];
  nextCursor: string | null;
};
