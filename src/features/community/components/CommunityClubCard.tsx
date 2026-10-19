/**
 * Discover / my-club row.
 */

import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Lock, Users } from 'lucide-react-native';

import type { CommunityCardModel } from '@/features/community/lib/to-community-card';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type CommunityClubCardProps = {
  club: CommunityCardModel;
  onPress: () => void;
};

/**
 * Premium club tile: cover strip, mark, members, access badge.
 */
export function CommunityClubCard({ club, onPress }: CommunityClubCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={[styles.cover, { backgroundColor: theme.colors.primaryMuted }]}>
        {club.coverUri ? (
          <Image source={{ uri: club.coverUri }} style={styles.coverImage} />
        ) : null}
        <View
          style={[
            styles.mark,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.background,
            },
          ]}>
          {club.avatarUri ? (
            <Image source={{ uri: club.avatarUri }} style={styles.markImage} />
          ) : (
            <AppText color="inverse" variant="caption" weight="bold">
              {club.initials}
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText numberOfLines={1} style={styles.flex} variant="label" weight="bold">
            {club.name}
          </AppText>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: club.isPrivate
                  ? theme.colors.primaryMuted
                  : theme.palette.primary[50],
              },
            ]}>
            {club.isPrivate ? (
              <Lock color={theme.colors.primary} size={ms(11)} strokeWidth={2.4} />
            ) : null}
            <AppText color="brand" variant="caption" weight="semibold">
              {club.visibilityLabel}
            </AppText>
          </View>
        </View>
        {club.description ? (
          <AppText color="secondary" numberOfLines={2} variant="caption">
            {club.description}
          </AppText>
        ) : null}
        <View style={styles.meta}>
          <Users color={theme.colors.textMuted} size={ms(12)} strokeWidth={2} />
          <AppText color="muted" variant="caption">
            {club.memberLabel}
          </AppText>
          {club.isMember ? (
            <AppText color="brand" variant="caption" weight="semibold">
              Member
            </AppText>
          ) : null}
          {club.isPending ? (
            <AppText color="muted" variant="caption" weight="semibold">
              Requested
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: ms(20),
    overflow: 'hidden',
    marginBottom: vs(12),
  },
  cover: {
    height: vs(72),
    position: 'relative',
  },
  coverImage: {
    ...StyleSheet.absoluteFill,
  },
  mark: {
    position: 'absolute',
    left: s(14),
    bottom: -ms(18),
    width: ms(44),
    height: ms(44),
    borderRadius: ms(14),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    paddingHorizontal: s(14),
    paddingTop: vs(22),
    paddingBottom: vs(14),
    gap: vs(4),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  flex: {
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: ms(999),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginTop: vs(4),
  },
});
