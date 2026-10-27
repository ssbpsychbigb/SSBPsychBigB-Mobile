/**
 * Notifications inbox — live `/notifications`; guests get an in-page join card.
 */

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, CheckCheck, Inbox, type LucideIcon } from 'lucide-react-native';

import { useAppTabsActions } from '@/app/navigation/AppTabsContext';
import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { feedApi } from '@/features/feed/api/feed.api';
import { NotificationOptionsSheet } from '@/features/notifications/components/NotificationOptionsSheet';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import {
  notificationKeys,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  useNotificationUnreadQuery,
  useRemoveNotification,
} from '@/features/notifications/hooks/useNotificationQueries';
import {
  groupNotifications,
  matchesFilter,
  NOTIFICATION_FILTERS,
  type NotificationFilter,
} from '@/features/notifications/lib/group-notifications';
import { notificationTarget } from '@/features/notifications/lib/notification-target';
import type { AppNotification } from '@/features/notifications/types/notification.types';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, SocialStackChrome, Spinner, usePullToRefresh } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export function NotificationsScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const openRegister = useOpenAuth('Register');
  const openLogin = useOpenAuth('Login');

  if (!accessToken) {
    return (
      <SocialStackChrome subtitle="Follows, comments and communities" title="Notifications">
        <StateView
          Icon={Bell}
          body="Follows, reactions, comments and community announcements show up here once you join."
          title="Stay in the loop">
          <View style={styles.stateActions}>
            <Button fullWidth onPress={openRegister}>
              Join BIGB
            </Button>
            <Button fullWidth onPress={openLogin} variant="secondary">
              Log in
            </Button>
          </View>
        </StateView>
      </SocialStackChrome>
    );
  }

  return <NotificationsInbox token={accessToken} />;
}

function NotificationsInbox({ token }: { token: string }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const goRoot = useRootNavigate();
  const { jumpTo } = useAppTabsActions();
  const listQuery = useNotificationsQuery(token);
  const unreadQuery = useNotificationUnreadQuery(token);
  const markRead = useMarkNotificationRead(token);
  const markAll = useMarkAllNotificationsRead(token);
  const remove = useRemoveNotification(token);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);
  const [optionsItem, setOptionsItem] = useState<AppNotification | null>(null);
  const refreshControl = usePullToRefresh(() =>
    Promise.all([listQuery.refetch(), unreadQuery.refetch()]),
  );

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data],
  );
  const unreadCount =
    unreadQuery.data?.unreadCount ?? items.filter((item) => item.unread).length;
  const sections = useMemo(
    () => groupNotifications(items.filter((item) => matchesFilter(item, filter))),
    [items, filter],
  );
  const filteredCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  const activeFilterLabel =
    NOTIFICATION_FILTERS.find((chip) => chip.key === filter)?.label.toLowerCase() || '';

  const open = (item: AppNotification) => {
    if (item.unread) {
      markRead.mutate(item.id);
    }
    const target = notificationTarget(item);
    if (!target) {
      return;
    }
    if (target.type === 'tab') {
      jumpTo(target.key);
      return;
    }
    goRoot(target.name, target.params as never);
  };

  const followBack = async (item: AppNotification) => {
    const actorId = item.actors[0]?.id;
    if (!actorId) {
      return;
    }
    setFollowBusyId(item.id);
    try {
      await feedApi.toggleFollow(actorId, token);
      showToast.success('Following', `You now follow ${item.actors[0]?.name || 'them'}.`);
      if (item.unread) {
        markRead.mutate(item.id);
      }
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    } catch (error) {
      showErrorToast(error, 'Could not follow back.', 'Notifications');
    } finally {
      setFollowBusyId(null);
    }
  };

  const loading = listQuery.isPending;
  const showList = !loading && !listQuery.isError;
  const reachedEnd = showList && filteredCount > 0 && !listQuery.hasNextPage;

  return (
    <>
      <SocialStackChrome
        onNearEnd={() => {
          if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
            void listQuery.fetchNextPage();
          }
        }}
        refreshControl={refreshControl}
        rightSlot={
          unreadCount > 0 ? (
            <Pressable
              accessibilityLabel="Mark all notifications as read"
              accessibilityRole="button"
              disabled={markAll.isPending}
              hitSlop={ms(6)}
              onPress={() => markAll.mutate()}
              style={({ pressed }) => [
                styles.markAll,
                {
                  backgroundColor: pressed
                    ? theme.palette.primary[200]
                    : theme.mode === 'dark'
                      ? theme.colors.primaryMuted
                      : theme.palette.primary[100],
                  opacity: markAll.isPending ? 0.6 : 1,
                },
              ]}>
              <CheckCheck color={theme.colors.primary} size={ms(15)} strokeWidth={2.4} />
              <AppText style={[styles.markAllLabel, { color: theme.colors.primary }]} weight="semibold">
                Mark all read
              </AppText>
            </Pressable>
          ) : undefined
        }
        subtitle={
          loading
            ? 'Fetching your latest activity'
            : unreadCount > 0
              ? `${unreadCount} unread`
              : 'You’re all caught up'
        }
        title="Notifications">
        <ScrollView
          contentContainerStyle={styles.chips}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroller}>
          {NOTIFICATION_FILTERS.map((chip) => {
            const active = chip.key === filter;
            const badge = chip.key === 'unread' && unreadCount > 0 ? unreadCount : 0;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                key={chip.key}
                onPress={() => setFilter(chip.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.mode === 'dark'
                        ? theme.colors.surface
                        : theme.palette.secondary[100],
                  },
                ]}>
                <AppText
                  style={[
                    styles.chipLabel,
                    { color: active ? '#FFFFFF' : theme.colors.textSecondary },
                  ]}
                  weight={active ? 'semibold' : 'medium'}>
                  {chip.label}
                </AppText>
                {badge ? (
                  <View
                    style={[
                      styles.chipBadge,
                      { backgroundColor: active ? '#FFFFFF' : theme.colors.primary },
                    ]}>
                    <AppText
                      style={[
                        styles.chipBadgeText,
                        { color: active ? theme.colors.primary : '#FFFFFF' },
                      ]}
                      weight="bold">
                      {badge > 99 ? '99+' : String(badge)}
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.bleed}>
          {loading ? <Spinner label="Loading notifications" /> : null}

          {listQuery.isError ? (
            <StateView
              Icon={BellOff}
              body="Notifications unlock once your account is active. Pull down to refresh or try again."
              title="Couldn’t load notifications">
              <Button onPress={() => void listQuery.refetch()} variant="secondary">
                Try again
              </Button>
            </StateView>
          ) : null}

          {showList && items.length === 0 ? (
            <StateView
              Icon={Bell}
              body="When someone follows you, reacts to or comments on your posts, you’ll see it here."
              title="No notifications yet"
            />
          ) : null}

          {showList && items.length > 0 && filteredCount === 0 ? (
            <StateView
              Icon={filter === 'unread' ? CheckCheck : Inbox}
              body={
                filter === 'unread'
                  ? 'You’ve read every notification.'
                  : `No ${activeFilterLabel} notifications yet.`
              }
              title={filter === 'unread' ? 'All caught up' : 'Nothing here yet'}>
              <Button onPress={() => setFilter('all')} variant="secondary">
                Show all notifications
              </Button>
            </StateView>
          ) : null}

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <AppText style={[styles.sectionTitle, { color: theme.colors.text }]} weight="bold">
                {section.title}
              </AppText>
              {section.items.map((item, index) => (
                <Fragment key={item.id}>
                  {index > 0 ? (
                    <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                  ) : null}
                  <NotificationRow
                    followBusy={followBusyId === item.id}
                    item={item}
                    onFollowBack={() => void followBack(item)}
                    onOptions={() => setOptionsItem(item)}
                    onPress={() => open(item)}
                  />
                </Fragment>
              ))}
            </View>
          ))}

          {listQuery.isFetchingNextPage ? <Spinner size="small" /> : null}

          {reachedEnd ? (
            <View style={styles.end}>
              <View style={[styles.endLine, { backgroundColor: theme.colors.border }]} />
              <AppText color="muted" style={styles.endLabel}>
                That’s all for now
              </AppText>
              <View style={[styles.endLine, { backgroundColor: theme.colors.border }]} />
            </View>
          ) : null}
        </View>
      </SocialStackChrome>

      <NotificationOptionsSheet
        item={optionsItem}
        onClose={() => setOptionsItem(null)}
        onMarkRead={(item) => {
          markRead.mutate(item.id);
          setOptionsItem(null);
        }}
        onRemove={(item) => {
          remove.mutate(item.id, {
            onSuccess: () => showToast.success('Notification removed'),
          });
          setOptionsItem(null);
        }}
      />
    </>
  );
}

function StateView({
  Icon,
  title,
  body,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.stateBox, styles.state]}>
      <View
        style={[
          styles.stateIcon,
          {
            backgroundColor:
              theme.mode === 'dark' ? theme.colors.primaryMuted : theme.palette.primary[100],
          },
        ]}>
        <Icon color={theme.colors.primary} size={ms(30)} strokeWidth={1.9} />
      </View>
      <AppText style={[styles.stateTitle, { color: theme.colors.text }]} weight="bold">
        {title}
      </AppText>
      <AppText color="secondary" style={styles.stateBody}>
        {body}
      </AppText>
      {children ? <View style={styles.stateChildren}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    height: ms(34),
    paddingHorizontal: s(12),
    borderRadius: ms(17),
  },
  markAllLabel: {
    fontSize: fontSize(12.5),
  },
  chipScroller: {
    marginHorizontal: -s(16),
    marginTop: vs(2),
    marginBottom: vs(6),
    flexGrow: 0,
  },
  chips: {
    paddingHorizontal: s(16),
    gap: s(8),
    paddingVertical: vs(4),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    height: ms(34),
    paddingHorizontal: s(15),
    borderRadius: ms(17),
  },
  chipLabel: {
    fontSize: fontSize(13),
  },
  chipBadge: {
    minWidth: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    paddingHorizontal: ms(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBadgeText: {
    fontSize: fontSize(10.5),
    includeFontPadding: false,
  },
  bleed: {
    marginHorizontal: -s(16),
  },
  section: {
    paddingTop: vs(10),
  },
  sectionTitle: {
    fontSize: fontSize(16),
    paddingHorizontal: s(18),
    paddingBottom: vs(6),
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: s(18) + ms(48) + s(12),
  },
  stateBox: {
    minHeight: vs(420),
    justifyContent: 'center',
  },
  state: {
    alignItems: 'center',
    paddingHorizontal: s(32),
  },
  stateIcon: {
    width: ms(76),
    height: ms(76),
    borderRadius: ms(38),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(18),
  },
  stateTitle: {
    fontSize: fontSize(18),
    lineHeight: lineHeight(18, 1.3),
    textAlign: 'center',
  },
  stateBody: {
    marginTop: vs(6),
    fontSize: fontSize(14),
    lineHeight: lineHeight(14, 1.5),
    textAlign: 'center',
  },
  stateChildren: {
    marginTop: vs(20),
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  stateActions: {
    alignSelf: 'stretch',
    gap: vs(10),
  },
  end: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(32),
    paddingTop: vs(24),
    paddingBottom: vs(12),
  },
  endLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  endLabel: {
    fontSize: fontSize(12),
  },
});
