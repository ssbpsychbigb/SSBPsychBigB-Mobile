/**
 * LinkedIn-style composer teaser card.
 */

import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image as ImageIcon, Smile, Sparkles, Video } from 'lucide-react-native';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
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
  const user = useAuthStore((state) => state.user);
  const photo = isAuthed
    ? resolveUploadUrl(user?.profilePhotoPath || user?.officerPhotoPath)
    : null;
  const initials = isAuthed ? getUserInitials(displayName || user?.fullName) : 'B';

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
              overflow: 'hidden',
            },
          ]}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImage} />
          ) : (
            <AppText color="brand" variant="caption" weight="semibold">
              {initials}
            </AppText>
          )}
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
          showsHorizontalScrollIndicator={false}>
          <ComposerChip
            icon={<ImageIcon color={theme.colors.primary} size={ms(16)} strokeWidth={2} />}
            label="Photo"
            onPress={() => onAction('photo')}
          />
          <ComposerChip
            icon={<Sparkles color={theme.colors.primary} size={ms(16)} strokeWidth={2} />}
            label="AI"
            onPress={() => onAction('ai')}
          />
          <ComposerChip
            icon={<Video color={theme.colors.primary} size={ms(16)} strokeWidth={2} />}
            label="Video"
            onPress={() => onAction('video')}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => onAction('compose')}
            style={[styles.postChip, { backgroundColor: theme.colors.primary }]}>
            <AppText color="inverse" variant="caption" weight="semibold">
              Post
            </AppText>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

function ComposerChip({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}>
      {icon}
      <AppText variant="caption" weight="semibold">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(16),
    paddingHorizontal: s(12),
    paddingTop: vs(12),
    paddingBottom: vs(10),
    gap: vs(10),
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  avatar: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  field: {
    flex: 1,
    minHeight: ms(40),
    borderRadius: ms(20),
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  placeholder: {
    flex: 1,
  },
  actions: {
    marginLeft: ms(50),
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingRight: s(4),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    height: ms(32),
    paddingHorizontal: s(10),
    borderRadius: ms(16),
    borderWidth: StyleSheet.hairlineWidth,
  },
  postChip: {
    height: ms(32),
    paddingHorizontal: s(14),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
