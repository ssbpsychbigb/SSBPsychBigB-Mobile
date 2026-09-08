/**
 * LinkedIn-style composer teaser card.
 */

import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image as ImageIcon, Smile, Sparkles, Video } from 'lucide-react-native';

import { getUserInitials } from '@/features/home/lib/user-initials';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type FeedComposerCardProps = {
  isAuthed: boolean;
  displayName?: string | null;
  onAction: (kind: 'compose' | 'photo' | 'video' | 'ai') => void;
};

/**
 * Share box — guests tap through to join; signed-in users open compose.
 */
export function FeedComposerCard({
  isAuthed,
  displayName,
  onAction,
}: FeedComposerCardProps) {
  const theme = useTheme();
  const initials = isAuthed ? getUserInitials(displayName) : 'B';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={styles.top}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primaryMuted,
              borderColor: theme.colors.primary,
            },
          ]}>
          <AppText color="brand" variant="caption" weight="semibold">
            {initials}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => onAction('compose')}
          style={({ pressed }) => [
            styles.field,
            {
              backgroundColor:
                theme.mode === 'dark'
                  ? theme.colors.primaryMuted
                  : theme.palette.primary[50],
              borderColor: theme.colors.border,
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <AppText color="muted" numberOfLines={1} style={styles.placeholder} variant="body">
            {isAuthed ? 'Share with the community…' : 'Join to share a photo or thought…'}
          </AppText>
          <Smile color={theme.colors.textMuted} size={ms(18)} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <ScrollView
          contentContainerStyle={styles.chips}
          directionalLockEnabled
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}>
          <ComposerChip
            icon={<ImageIcon color={theme.colors.primary} size={ms(14)} strokeWidth={2} />}
            label="Photo"
            onPress={() => onAction('photo')}
          />
          <ComposerChip
            icon={<Sparkles color={theme.colors.primary} size={ms(14)} strokeWidth={2} />}
            label="AI"
            onPress={() => onAction('ai')}
          />
          <ComposerChip
            icon={<Video color={theme.colors.primary} size={ms(14)} strokeWidth={2} />}
            label="Video"
            onPress={() => onAction('video')}
          />
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          onPress={() => onAction('compose')}
          style={({ pressed }) => [
            styles.postBtn,
            { backgroundColor: theme.colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}>
            <AppText color="inverse" style={styles.postLabel} variant="label">
            Post
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

type ComposerChipProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
};

function ComposerChip({ icon, label, onPress }: ComposerChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: theme.palette.primary[50],
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {icon}
      <AppText
        color="brand"
        style={styles.chipLabel}
        variant="caption"
        weight="semibold">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: ms(22),
    padding: ms(14),
    gap: ms(12),
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  avatar: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(21),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    minHeight: ms(44),
    borderRadius: ms(22),
    borderWidth: 1,
    paddingHorizontal: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(8),
  },
  placeholder: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  chipsScroll: {
    flex: 1,
    minWidth: 0,
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: s(4),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: ms(4),
    marginRight: s(8),
    height: ms(32),
    paddingHorizontal: s(10),
    borderRadius: ms(999),
  },
  chipLabel: {
    includeFontPadding: false,
  },
  postBtn: {
    flexShrink: 0,
    height: ms(32),
    paddingHorizontal: s(16),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  postLabel: {
    includeFontPadding: false,
  },
});
