/**
 * Tests mode on the Learn hub — search, loading, empty, and the live list.
 */

import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Bookmark, ClipboardList, Search, Target, X } from 'lucide-react-native';

import { AssessmentPreviewCard } from '@/features/assessments/components/AssessmentPreviewCard';
import type { AssessmentCard } from '@/features/assessments/types/assessment.types';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type TestsHubProps = {
  items: AssessmentCard[];
  loading: boolean;
  isError: boolean;
  searching: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (next?: string) => void;
  onRetry: () => void;
  onOpen: (slug: string) => void;
  onOpenHistory?: () => void;
  onOpenBookmarks?: () => void;
  onOpenRevision?: () => void;
};

/**
 * Foundation catalogue. Guests can browse. Start is gated on the detail screen.
 */
export function TestsHub({
  items,
  loading,
  isError,
  searching,
  query,
  onQueryChange,
  onSubmitSearch,
  onRetry,
  onOpen,
  onOpenHistory,
  onOpenBookmarks,
  onOpenRevision,
}: TestsHubProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const column = width >= 720 ? 720 : undefined;

  return (
    <View style={[styles.column, column ? { maxWidth: column } : null]}>
      <View
        style={[
          styles.search,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <Search color={theme.colors.textMuted} size={ms(16)} strokeWidth={2} />
        <TextInput
          accessibilityLabel="Search tests"
          onChangeText={onQueryChange}
          onSubmitEditing={() => onSubmitSearch()}
          placeholder="Search tests"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              fontFamily: resolveFontFamily('regular'),
            },
          ]}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear search"
            hitSlop={ms(8)}
            onPress={() => {
              onQueryChange('');
              onSubmitSearch('');
            }}>
            <X color={theme.colors.textMuted} size={ms(16)} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      {onOpenHistory || onOpenBookmarks || onOpenRevision ? (
        <View style={styles.shortcuts}>
          {onOpenHistory ? (
            <HubShortcut
              hint="Scores"
              icon={ClipboardList}
              label="Attempts"
              onPress={onOpenHistory}
            />
          ) : null}
          {onOpenBookmarks ? (
            <HubShortcut
              hint="Questions"
              icon={Bookmark}
              label="Saved"
              onPress={onOpenBookmarks}
            />
          ) : null}
          {onOpenRevision ? (
            <HubShortcut
              hint="Topics"
              icon={Target}
              label="Revise"
              onPress={onOpenRevision}
            />
          ) : null}
        </View>
      ) : null}

      <AppText color="muted" style={styles.meta} variant="caption">
        {loading
          ? 'Loading…'
          : isError
            ? 'Couldn’t refresh tests'
            : `${items.length} ${items.length === 1 ? 'test' : 'tests'}`}
      </AppText>

      {loading ? <TestsSkeleton /> : null}

      {!loading && isError ? (
        <LearnEmptyState
          actionLabel="Retry"
          description="Check your connection and try again."
          icon={<ClipboardList color={theme.colors.textMuted} size={ms(28)} />}
          onAction={onRetry}
          title="Couldn’t load tests"
        />
      ) : null}

      {!loading && !isError && items.length === 0 ? (
        <LearnEmptyState
          actionLabel={searching ? 'Clear search' : undefined}
          description={
            searching
              ? 'Try another name. Only published tests are listed.'
              : 'Published practice, mocks, and psych tests will show up here.'
          }
          icon={<ClipboardList color={theme.colors.textMuted} size={ms(28)} />}
          onAction={
            searching
              ? () => {
                  onQueryChange('');
                  onSubmitSearch('');
                }
              : undefined
          }
          title={searching ? 'No tests match' : 'No tests yet'}
        />
      ) : null}

      {!loading && !isError
        ? items.map((item) => (
            <AssessmentPreviewCard
              item={item}
              key={item.id}
              onPress={() => onOpen(item.slug || item.id)}
            />
          ))
        : null}
    </View>
  );
}

function HubShortcut({
  icon: Icon,
  label,
  hint,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.shortcut,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={[styles.shortcutIcon, { backgroundColor: theme.colors.primaryMuted }]}>
        <Icon color={theme.colors.primary} size={ms(16)} strokeWidth={2} />
      </View>
      <AppText numberOfLines={1} variant="label" weight="semibold">
        {label}
      </AppText>
      <AppText color="muted" numberOfLines={1} variant="caption">
        {hint}
      </AppText>
    </Pressable>
  );
}

function TestsSkeleton() {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading tests">
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.skelRow}>
          <View
            style={[
              styles.skelCover,
              { backgroundColor: theme.colors.surface },
            ]}
          />
          <View style={styles.skelCopy}>
            <View
              style={[
                styles.skelLine,
                styles.skelShort,
                { backgroundColor: theme.colors.surface },
              ]}
            />
            <View
              style={[
                styles.skelLine,
                { backgroundColor: theme.colors.surface },
              ]}
            />
            <View
              style={[
                styles.skelLine,
                styles.skelMid,
                { backgroundColor: theme.colors.surface },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    alignSelf: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    height: ms(44),
    marginBottom: vs(14),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: vs(16),
  },
  shortcut: {
    flex: 1,
    minWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(16),
    paddingHorizontal: s(10),
    paddingVertical: vs(12),
    gap: vs(4),
  },
  shortcutIcon: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(2),
  },
  meta: {
    marginBottom: vs(14),
  },
  skelRow: {
    flexDirection: 'row',
    gap: s(12),
    marginBottom: vs(18),
  },
  skelCover: {
    width: s(112),
    height: vs(84),
    borderRadius: ms(12),
  },
  skelCopy: {
    flex: 1,
    justifyContent: 'center',
    gap: vs(8),
  },
  skelLine: {
    height: vs(12),
    borderRadius: ms(6),
    width: '88%',
  },
  skelShort: {
    width: '32%',
  },
  skelMid: {
    width: '52%',
  },
});
