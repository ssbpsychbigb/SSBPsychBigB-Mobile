/**
 * Time labels for the inbox and thread.
 */

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

/**
 * Inbox row timestamp: now · 12m · Yesterday · 13 Aug.
 */
export function inboxTimeLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) {
    return 'now';
  }
  if (diffMin < 60) {
    return `${diffMin}m`;
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24 && startOfDay(date).getTime() === startOfDay(now).getTime()) {
    return `${diffHr}h`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (startOfDay(date).getTime() === startOfDay(yesterday).getTime()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/**
 * Bubble timestamp — WhatsApp-style 12-hour clock (4:39 pm).
 */
export function threadTimeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Date chip in the thread (Today · Yesterday · weekday).
 */
export function threadDayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  if (startOfDay(date).getTime() === startOfDay(now).getTime()) {
    return 'Today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (startOfDay(date).getTime() === startOfDay(yesterday).getTime()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * WhatsApp-style seen: own message is read when the peer cursor is at or after sentAt.
 */
export function isMessageSeen(sentAt: string, peerLastReadAt?: string | null): boolean {
  if (!peerLastReadAt) {
    return false;
  }
  const sent = Date.parse(sentAt);
  const readAt = Date.parse(peerLastReadAt);
  return !Number.isNaN(sent) && !Number.isNaN(readAt) && sent <= readAt;
}

export function sameDay(a: string, b: string): boolean {
  const left = new Date(a);
  const right = new Date(b);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) {
    return false;
  }
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}
