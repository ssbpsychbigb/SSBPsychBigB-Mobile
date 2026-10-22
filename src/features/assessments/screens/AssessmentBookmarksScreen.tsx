/**
 * Questions saved from a result review, grouped by folder.
 * A card opens the test. Remove asks first.
 */

import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Bookmark, ChevronRight, Trash2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';
import {
  useAssessmentBookmarksQuery,
  useRemoveBookmarkMutation,
} from '@/features/assessments/hooks/useAssessmentQueries';
import { BOOKMARK_FOLDERS } from '@/features/assessments/lib/result-actions';
import type { BookmarkList } from '@/features/assessments/types/assessment.types';
import { GuestUnlockPanel } from '@/features/auth/components/GuestUnlockPanel';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, SocialStackChrome } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentBookmarks'>;
type SavedItem = BookmarkList['items'][number];

/**
 * Saved questions. Folder chips filter the list on this device.
 */
export function AssessmentBookmarksScreen({ navigation }: Props) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const saved = useAssessmentBookmarksQuery(Boolean(token));
  const remove = useRemoveBookmarkMutation();
  const [folder, setFolder] = useState<string | null>(null);
  const [pending, setPending] = useState<SavedItem | null>(null);
  const items = saved.data?.items ?? [];
  const folders = useMemo(() => folderOptions(items, saved.data?.folders), [items, saved.data?.folders]);
  const visible = folder ? items.filter((row) => row.folder === folder) : items;

  return (
    <SocialStackChrome
      refreshControl={
        <RefreshControl
          onRefresh={() => void saved.refetch()}
          refreshing={Boolean(saved.isRefetching && saved.data)}
          tintColor={theme.colors.primary}
        />
      }
      subtitle="Questions you saved while reviewing a result."
      title="Saved questions">
      {!token ? (
        <GuestUnlockPanel
          description="Sign in, finish a test, and save a question from the review."
          embedded
          icon={<Bookmark color={theme.colors.primary} size={ms(32)} />}
          title="Sign in to see saved questions"
        />
      ) : saved.isLoading && !saved.data ? (
        <SavedSkeleton />
      ) : saved.isError ? (
        <LearnEmptyState
          actionLabel="Retry"
          description="Check your connection and try again."
          icon={<Bookmark color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => void saved.refetch()}
          title="Couldn’t load saved questions"
        />
      ) : items.length === 0 ? (
        <LearnEmptyState
          actionLabel="Browse tests"
          description="Open a finished result, then save a question into Difficult, Revise later, Favourite, or Incorrect."
          icon={<Bookmark color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => navigation.goBack()}
          title="No saved questions"
        />
      ) : (
        <View style={styles.column}>
          <View style={styles.filters}>
            <FolderChip
              count={items.length}
              label="All"
              onPress={() => setFolder(null)}
              selected={folder == null}
            />
            {folders.map((name) => (
              <FolderChip
                count={items.filter((row) => row.folder === name).length}
                key={name}
                label={name}
                onPress={() => setFolder(name)}
                selected={folder === name}
              />
            ))}
          </View>

          {visible.length === 0 ? (
            <LearnEmptyState
              actionLabel="Show all"
              description="Nothing in this folder yet. The other questions are still saved."
              icon={<Bookmark color={theme.colors.textMuted} size={ms(28)} />}
              onAction={() => setFolder(null)}
              title="This folder is empty"
            />
          ) : (
            visible.map((row) => (
              <SavedCard
                key={row.id}
                onOpen={
                  row.slug
                    ? () => navigation.navigate('AssessmentDetail', { slug: row.slug as string })
                    : undefined
                }
                onRemove={() => setPending(row)}
                row={row}
              />
            ))
          )}
        </View>
      )}

      <ConfirmModal
        Icon={Trash2}
        confirmLabel="Remove"
        isLoading={remove.isPending}
        message={pending ? `“${clip(pending.prompt)}” leaves ${pending.folder}.` : ''}
        onCancel={() => {
          if (!remove.isPending) setPending(null);
        }}
        onConfirm={() => {
          if (!pending) return;
          remove.mutate(pending.itemId, {
            onSuccess: () => {
              showToast.success('Removed');
              setPending(null);
            },
            onError: (error) => showErrorToast(error),
          });
        }}
        title="Remove this question?"
        tone="danger"
        visible={pending != null}
      />
    </SocialStackChrome>
  );
}

function FolderChip({
  label,
  count,
  selected,
  onPress,
}: {
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}>
      <AppText
        style={{ color: selected ? '#FFFFFF' : theme.colors.text }}
        variant="caption"
        weight="semibold">
        {count > 0 ? `${label} ${count}` : label}
      </AppText>
    </Pressable>
  );
}

function SavedCard({
  row,
  onOpen,
  onRemove,
}: {
  row: SavedItem;
  onOpen?: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const topic = [row.topic, row.title].filter(Boolean).join(' · ');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}>
      <Pressable
        accessibilityHint={onOpen ? 'Opens the test' : undefined}
        accessibilityRole={onOpen ? 'button' : 'text'}
        disabled={!onOpen}
        onPress={onOpen}
        style={styles.cardMain}>
        <View style={styles.copy}>
          <View style={[styles.pill, { backgroundColor: theme.colors.primaryMuted }]}>
            <AppText color="brand" variant="caption" weight="semibold">
              {row.folder}
            </AppText>
          </View>
          <AppText numberOfLines={4} variant="label" weight="semibold">
            {row.prompt.trim() || 'Saved question'}
          </AppText>
          {topic ? (
            <AppText color="muted" numberOfLines={2} variant="caption">
              {topic}
            </AppText>
          ) : null}
        </View>
        {onOpen ? <ChevronRight color={theme.colors.textMuted} size={ms(18)} /> : null}
      </Pressable>
      <Pressable
        accessibilityLabel="Remove saved question"
        accessibilityRole="button"
        hitSlop={ms(8)}
        onPress={onRemove}
        style={[styles.remove, { borderTopColor: theme.colors.border }]}>
        <Trash2 color={theme.colors.textMuted} size={ms(14)} strokeWidth={2} />
        <AppText color="secondary" variant="caption" weight="semibold">
          Remove
        </AppText>
      </Pressable>
    </View>
  );
}

function SavedSkeleton() {
  const theme = useTheme();
  const bone = { backgroundColor: theme.colors.surface };
  return (
    <View accessibilityLabel="Loading saved questions" style={styles.column}>
      <View style={styles.filters}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={[styles.skelChip, bone]} />
        ))}
      </View>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={[styles.card, styles.skelCard, bone]}>
          <View style={[styles.skelLine, styles.skelShort, { backgroundColor: theme.colors.background }]} />
          <View style={[styles.skelLine, { backgroundColor: theme.colors.background }]} />
          <View style={[styles.skelLine, styles.skelMid, { backgroundColor: theme.colors.background }]} />
        </View>
      ))}
    </View>
  );
}

function folderOptions(items: SavedItem[], fromApi?: string[]) {
  const known = new Set<string>(BOOKMARK_FOLDERS);
  for (const name of fromApi ?? []) known.add(name);
  for (const row of items) {
    if (row.folder) known.add(row.folder);
  }
  const extras = [...known].filter(
    (name) => !BOOKMARK_FOLDERS.includes(name as (typeof BOOKMARK_FOLDERS)[number]),
  );
  return [...BOOKMARK_FOLDERS, ...extras];
}

function clip(value: string) {
  const text = value.trim() || 'This question';
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: vs(12),
    paddingTop: vs(4),
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginBottom: vs(4),
  },
  chip: {
    minHeight: ms(34),
    borderRadius: ms(999),
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(18),
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingHorizontal: s(14),
    paddingTop: vs(14),
    paddingBottom: vs(12),
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vs(6),
    alignItems: 'flex-start',
  },
  pill: {
    borderRadius: ms(999),
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
  },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: s(14),
    minHeight: ms(40),
  },
  skelChip: {
    width: s(72),
    height: ms(34),
    borderRadius: ms(999),
  },
  skelCard: {
    gap: vs(8),
    padding: s(14),
  },
  skelLine: {
    height: vs(10),
    borderRadius: ms(6),
    width: '100%',
  },
  skelShort: {
    width: '28%',
  },
  skelMid: {
    width: '64%',
  },
});
