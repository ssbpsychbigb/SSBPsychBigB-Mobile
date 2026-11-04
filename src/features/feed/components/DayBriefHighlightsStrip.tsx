/**
 * Profile highlights row — permanent story collections.
 */

import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react-native';

import { dayBriefApi } from '@/features/feed/api/feed.api';
import type { DayBriefHighlight } from '@/features/feed/types/feed.types';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

export type DayBriefHighlightsStripProps = {
  userId: string;
  token?: string | null;
  isSelf?: boolean;
};

/**
 * Circular highlight covers under the profile actions.
 */
export function DayBriefHighlightsStrip({
  userId,
  token,
  isSelf,
}: DayBriefHighlightsStripProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [active, setActive] = useState<DayBriefHighlight | null>(null);

  const query = useQuery({
    queryKey: ['day-brief-highlights', userId],
    enabled: Boolean(userId),
    queryFn: () => dayBriefApi.listHighlights(userId, token),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Not signed in');
      }
      return dayBriefApi.createHighlight(token, {
        title: title.trim() || 'Highlight',
      });
    },
    onSuccess: async () => {
      setCreateOpen(false);
      setTitle('');
      await queryClient.invalidateQueries({
        queryKey: ['day-brief-highlights', userId],
      });
      showToast.success('Highlight created', 'Add stories from your live Story viewer.');
    },
    onError: () => {
      showToast.error('Could not create highlight', 'Try again in a moment.');
    },
  });

  const items = query.data?.items || [];
  if (!items.length && !isSelf) {
    return null;
  }

  return (
    <View style={styles.shell}>
      <ScrollView
        contentContainerStyle={styles.row}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {isSelf ? (
          <Pressable
            onPress={() => setCreateOpen(true)}
            style={styles.item}>
            <View
              style={[
                styles.ring,
                {
                  borderColor: theme.colors.border,
                  borderStyle: 'dashed',
                  backgroundColor: theme.colors.surface,
                },
              ]}>
              <Plus color={theme.colors.primary} size={ms(22)} strokeWidth={2.4} />
            </View>
            <AppText color="brand" numberOfLines={1} style={styles.label} variant="caption">
              New
            </AppText>
          </Pressable>
        ) : null}

        {items.map((highlight) => {
          const cover = resolveUploadUrl(highlight.coverUrl);
          return (
            <Pressable
              key={highlight.id}
              onPress={() => setActive(highlight)}
              style={styles.item}>
              <View
                style={[
                  styles.ring,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.primaryMuted,
                  },
                ]}>
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.cover} />
                ) : (
                  <AppText color="brand" weight="bold">
                    {highlight.title.slice(0, 1).toUpperCase()}
                  </AppText>
                )}
              </View>
              <AppText numberOfLines={1} style={styles.label} variant="caption">
                {highlight.title}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setCreateOpen(false)}
        transparent
        visible={createOpen}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCreateOpen(false)} />
        <View style={[styles.modalCard, { backgroundColor: theme.colors.background }]}>
          <AppText variant="label" weight="bold">
            New highlight
          </AppText>
          <TextInput
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.titleInput,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
            value={title}
          />
          <Pressable
            disabled={createMutation.isPending}
            onPress={() => createMutation.mutate()}
            style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}>
            <AppText color="inverse" weight="semibold">
              Create
            </AppText>
          </Pressable>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setActive(null)}
        transparent
        visible={Boolean(active)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActive(null)} />
        <View style={[styles.modalCard, { backgroundColor: theme.colors.background }]}>
          <AppText variant="label" weight="bold">
            {active?.title}
          </AppText>
          <AppText color="muted" variant="caption">
            {active?.itemCount || 0} saved{' '}
            {(active?.itemCount || 0) === 1 ? 'story' : 'stories'}
          </AppText>
          <AppText color="secondary" style={styles.hint} variant="caption">
            Open your live Story and tap Highlight to add a segment here.
          </AppText>
          <Pressable
            onPress={() => setActive(null)}
            style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}>
            <AppText color="inverse" weight="semibold">
              Close
            </AppText>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginTop: vs(12),
    marginBottom: vs(4),
  },
  row: {
    paddingHorizontal: s(16),
    gap: s(12),
  },
  item: {
    width: s(72),
    alignItems: 'center',
  },
  ring: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    borderWidth: ms(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  label: {
    marginTop: vs(6),
    width: '100%',
    textAlign: 'center',
    fontSize: fontSize(11),
    lineHeight: lineHeight(11, 1.2),
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    marginTop: '40%',
    marginHorizontal: s(24),
    borderRadius: ms(16),
    padding: s(16),
    gap: vs(10),
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    fontSize: fontSize(15),
  },
  createBtn: {
    borderRadius: ms(12),
    alignItems: 'center',
    paddingVertical: vs(12),
  },
  hint: {
    marginTop: vs(2),
  },
});
