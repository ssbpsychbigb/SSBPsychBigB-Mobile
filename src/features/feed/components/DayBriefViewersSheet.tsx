/**
 * “Seen by” list for the story owner.
 */

import { useEffect } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react-native';

import { dayBriefApi } from '@/features/feed/api/feed.api';
import type { DayBriefViewerPerson } from '@/features/feed/types/feed.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Spinner } from '@/shared/ui';

export type DayBriefViewersSheetProps = {
  visible: boolean;
  briefId: string | null;
  token: string | null;
  onClose: () => void;
};

function formatViewedAt(iso: string): string {
  const msAgo = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(msAgo / 60_000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * Bottom sheet of people who viewed the current segment.
 */
export function DayBriefViewersSheet({
  visible,
  briefId,
  token,
  onClose,
}: DayBriefViewersSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({
    queryKey: ['day-brief-viewers', briefId],
    enabled: Boolean(visible && briefId && token),
    queryFn: () => dayBriefApi.listViewers(token as string, briefId as string),
  });

  useEffect(() => {
    if (visible && briefId) {
      void query.refetch();
    }
  }, [visible, briefId]);

  const items = query.data?.items ?? [];

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: insets.bottom + vs(12),
          },
        ]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <AppText variant="label" weight="bold">
            Seen by {query.data?.total ?? items.length}
          </AppText>
          <Pressable accessibilityLabel="Close" hitSlop={ms(8)} onPress={onClose}>
            <X color={theme.colors.text} size={ms(22)} strokeWidth={2.2} />
          </Pressable>
        </View>

        {query.isLoading ? (
          <Spinner label="Loading viewers" style={styles.center} />
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <AppText color="muted" variant="body">
              No views yet
            </AppText>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: DayBriefViewerPerson }) => {
              const photo = resolveUploadUrl(item.avatarUrl);
              return (
                <View style={styles.row}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: theme.colors.primaryMuted },
                    ]}>
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.avatarImage} />
                    ) : (
                      <AppText color="brand" variant="caption" weight="bold">
                        {getUserInitials(item.name)}
                      </AppText>
                    )}
                  </View>
                  <View style={styles.copy}>
                    <AppText numberOfLines={1} weight="semibold">
                      {item.name}
                    </AppText>
                    <AppText color="muted" variant="caption">
                      {item.username ? `@${item.username} · ` : ''}
                      {formatViewedAt(item.viewedAt)}
                    </AppText>
                  </View>
                  {item.reaction ? (
                    <AppText style={styles.reaction}>{item.reaction}</AppText>
                  ) : null}
                </View>
              );
            }}
            style={styles.list}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: ms(18),
    borderTopRightRadius: ms(18),
    paddingTop: vs(8),
  },
  handle: {
    alignSelf: 'center',
    width: s(40),
    height: vs(4),
    borderRadius: ms(2),
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: vs(8),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: vs(10),
  },
  list: {
    paddingHorizontal: s(16),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingVertical: vs(10),
  },
  avatar: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  copy: {
    flex: 1,
    gap: vs(2),
  },
  reaction: {
    fontSize: ms(20),
  },
  center: {
    paddingVertical: vs(36),
    alignItems: 'center',
  },
});
