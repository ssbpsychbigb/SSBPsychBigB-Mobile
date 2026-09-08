/**
 * Message inbox — searchable threads; open is gated for guests.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { PencilLine, Search } from 'lucide-react-native';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { InboxThreadRow } from '@/features/message/components/InboxThreadRow';
import {
  INBOX_FILTERS,
  INBOX_THREADS_PREVIEW,
  type InboxFilterKey,
  type InboxThreadPreview,
} from '@/features/message/data/messages-preview';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

/**
 * Instagram / WhatsApp density inbox for client review before Chat APIs.
 */
export function MessageScreen() {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InboxFilterKey>('all');
  const [gateOpen, setGateOpen] = useState(false);

  const threads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return INBOX_THREADS_PREVIEW.filter((thread) => {
      if (filter !== 'all' && thread.kind !== filter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        thread.name.toLowerCase().includes(needle) ||
        thread.lastMessage.toLowerCase().includes(needle)
      );
    });
  }, [filter, query]);

  const activeNow = INBOX_THREADS_PREVIEW.filter((thread) => thread.online);
  const unreadCount = INBOX_THREADS_PREVIEW.reduce(
    (sum, thread) => sum + thread.unread,
    0,
  );

  const openThread = (thread: InboxThreadPreview) => {
    if (!accessToken) {
      setGateOpen(true);
      return;
    }
    showToast.info(
      thread.name,
      'Conversation view wires in with the Chat module.',
    );
  };

  const openCompose = () => {
    if (!accessToken) {
      setGateOpen(true);
      return;
    }
    showToast.info('New message', 'Compose wires in with the Chat module.');
  };

  const sheetBg = theme.colors.background;

  return (
    <>
      <SocialStackChrome
        rightSlot={
          <Pressable
            accessibilityLabel="New message"
            accessibilityRole="button"
            hitSlop={10}
            onPress={openCompose}
            style={[styles.composeBtn, { backgroundColor: theme.colors.primary }]}>
            <PencilLine color="#FFFFFF" size={ms(18)} strokeWidth={2} />
          </Pressable>
        }
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread · mentors and community rooms`
            : 'Mentors, officers, and community rooms'
        }
        subtitleLines={2}
        title="Messages">
        <View
          style={[
            styles.search,
            { backgroundColor: theme.mode === 'dark' ? theme.colors.surface : theme.palette.neutral[100] },
          ]}>
          <Search color={theme.colors.textMuted} size={ms(16)} strokeWidth={2} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search"
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
                  {item.label}
                </AppText>
                <View
                  style={[
                    styles.tabLine,
                    {
                      backgroundColor: selected
                        ? theme.colors.primary
                        : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {filter === 'all' && !query.trim() && activeNow.length > 0 ? (
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
                  onPress={() => openThread(thread)}
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

        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          {threads.length === 0 ? (
            <View style={styles.empty}>
              <AppText variant="label" weight="semibold">
                No conversations
              </AppText>
              <AppText color="secondary" style={styles.emptyCopy} variant="caption">
                Try another search, or switch All / Direct / Community.
              </AppText>
            </View>
          ) : (
            threads.map((thread, index) => (
              <InboxThreadRow
                key={thread.id}
                onPress={() => openThread(thread)}
                showDivider={index < threads.length - 1}
                thread={thread}
              />
            ))
          )}
        </View>
      </SocialStackChrome>

      <JoinToContinueSheet
        message="Watch and browse are free. Join BIGB to open chats with mentors and community rooms."
        onClose={() => setGateOpen(false)}
        title="Join to message"
        visible={gateOpen}
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
  },
  emptyCopy: {
    marginTop: vs(6),
    textAlign: 'center',
  },
});
