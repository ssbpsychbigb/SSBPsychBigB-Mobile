/**
 * Unit tests for inbox thread mapping.
 */

import { toInboxThread } from '@/features/message/lib/to-inbox-thread';
import type { Conversation } from '@/features/message/types/chat.types';

describe('toInboxThread', () => {
  it('maps a DM onto the inbox row', () => {
    const conversation: Conversation = {
      id: 'c1',
      name: 'Meera Sharma',
      username: 'meera',
      headline: 'GTO coach',
      kind: 'mentor',
      type: 'dm',
      preview: 'Assign roles before the plank.',
      updatedAt: new Date().toISOString(),
      unread: true,
      unreadCount: 2,
    };
    const row = toInboxThread(conversation);
    expect(row.kind).toBe('direct');
    expect(row.folder).toBe('focused');
    expect(row.unread).toBe(2);
    expect(row.initials).toBe('MS');
    expect(row.starred).toBe(false);
  });

  it('keeps message requests in the other folder', () => {
    const conversation: Conversation = {
      id: 'c2',
      name: 'Rohan Das',
      username: 'rohan',
      headline: '',
      kind: 'person',
      type: 'dm',
      preview: 'Hi, can we connect?',
      updatedAt: new Date().toISOString(),
      unread: true,
      unreadCount: 1,
      folder: 'other',
    };
    expect(toInboxThread(conversation).folder).toBe('other');
  });

  it('keeps the starred flag for the inbox row', () => {
    const conversation: Conversation = {
      id: 'c3',
      name: 'Capt Rao',
      username: 'rao',
      headline: '',
      kind: 'mentor',
      type: 'dm',
      preview: 'Pinned brief',
      updatedAt: new Date().toISOString(),
      unread: false,
      starred: true,
    };
    expect(toInboxThread(conversation).starred).toBe(true);
  });
});
