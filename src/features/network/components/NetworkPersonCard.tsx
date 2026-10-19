/**
 * Network person card — elevated profile tile with follow state.
 */

import { Image, Pressable, StyleSheet, View } from 'react-native';
import { BadgeCheck, Users } from 'lucide-react-native';

import {
  NETWORK_KIND_LABEL,
  type NetworkPersonPreview,
} from '@/features/network/data/network-preview';
import { followCtaLabel } from '@/features/network/lib/network-display';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type NetworkPersonCardProps = {
  person: NetworkPersonPreview;
  following: boolean;
  featured?: boolean;
  onFollow: () => void;
  onPressProfile?: () => void;
};

/**
 * Professional follow card. Featured variant is a spotlight hero.
 */
export function NetworkPersonCard({
  person,
  following,
  featured = false,
  onFollow,
  onPressProfile,
}: NetworkPersonCardProps) {
  const theme = useTheme();
  const surface = theme.colors.background;
  const kindLabel = NETWORK_KIND_LABEL[person.kind];
  const cta = followCtaLabel(
    Boolean(person.followingAuthor) || following,
    Boolean(person.followsYou),
  );

  return (
    <View
      style={[
        featured ? styles.hero : styles.card,
        {
          backgroundColor: surface,
          borderColor: theme.mode === 'dark' ? theme.colors.border : 'transparent',
          shadowColor: theme.colors.primary,
        },
      ]}>
      <View style={[styles.accent, { backgroundColor: person.color }]} />

      <Pressable
        accessibilityLabel={`${person.name} profile`}
        accessibilityRole="link"
        disabled={!onPressProfile}
        onPress={onPressProfile}
        style={featured ? styles.heroBody : styles.body}>
        <View
          style={[
            styles.avatarRing,
            {
              borderColor: person.color,
              width: featured ? ms(72) : ms(56),
              height: featured ? ms(72) : ms(56),
              borderRadius: featured ? ms(36) : ms(28),
            },
          ]}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: person.color,
                width: featured ? ms(62) : ms(48),
                height: featured ? ms(62) : ms(48),
                borderRadius: featured ? ms(31) : ms(24),
              },
            ]}>
              {person.photoUri ? (
                <Image source={{ uri: person.photoUri }} style={styles.photo} />
              ) : (
                <AppText
                  color="inverse"
                  style={featured ? styles.heroInitials : styles.initials}
                  weight="bold">
                  {person.initials}
                </AppText>
              )}
          </View>
        </View>

        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <AppText numberOfLines={1} style={styles.name} weight="bold">
              {person.name}
            </AppText>
            {person.verified ? (
              <BadgeCheck
                color={theme.colors.primary}
                fill={theme.colors.primaryMuted}
                size={ms(16)}
                strokeWidth={2}
              />
            ) : null}
          </View>
          <AppText color="secondary" numberOfLines={1} variant="caption">
            {person.role}
          </AppText>
          {featured ? (
            <AppText color="muted" style={styles.headline} variant="caption">
              {person.headline}
            </AppText>
          ) : null}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.kindChip,
                { backgroundColor: theme.colors.primaryMuted },
              ]}>
              <AppText color="brand" style={styles.kindLabel} variant="caption" weight="semibold">
                {kindLabel}
              </AppText>
            </View>
            <Users color={theme.colors.textMuted} size={ms(12)} strokeWidth={2.2} />
            <AppText color="muted" numberOfLines={1} style={styles.meta} variant="caption">
              {person.followersLabel} · {person.mutual}
            </AppText>
          </View>
        </View>
      </Pressable>

      {!featured ? (
        <Pressable
          accessibilityLabel={following ? `Following ${person.name}` : `Follow ${person.name}`}
          accessibilityRole="button"
          onPress={onFollow}
          style={({ pressed }) => [
            styles.follow,
            following
              ? {
                  backgroundColor: theme.colors.primaryMuted,
                  borderColor: theme.colors.primaryMuted,
                }
              : {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
            pressed ? styles.pressed : null,
          ]}>
          <AppText
            color={following ? 'brand' : 'inverse'}
            style={styles.followLabel}
            variant="caption"
            weight="semibold">
            {cta}
          </AppText>
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel={following ? `Following ${person.name}` : `Follow ${person.name}`}
          accessibilityRole="button"
          onPress={onFollow}
          style={({ pressed }) => [
            styles.heroFollow,
            following
              ? {
                  backgroundColor: theme.colors.primaryMuted,
                  borderColor: theme.colors.primaryMuted,
                }
              : {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
            pressed ? styles.pressed : null,
          ]}>
          <AppText
            color={following ? 'brand' : 'inverse'}
            style={styles.followLabel}
            variant="caption"
            weight="semibold">
            {cta}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ms(20),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: vs(14),
    paddingRight: s(12),
    paddingLeft: s(10),
    marginBottom: vs(12),
    overflow: 'hidden',
    shadowOffset: { width: 0, height: vs(6) },
    shadowOpacity: 0.08,
    shadowRadius: ms(14),
    elevation: ms(3),
  },
  hero: {
    borderRadius: ms(22),
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: vs(14),
    paddingRight: s(14),
    paddingLeft: s(10),
    paddingTop: vs(14),
    marginBottom: vs(18),
    overflow: 'hidden',
    shadowOffset: { width: 0, height: vs(8) },
    shadowOpacity: 0.1,
    shadowRadius: ms(16),
    elevation: ms(4),
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: s(4),
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    paddingLeft: s(6),
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: s(6),
    marginBottom: vs(12),
  },
  avatarRing: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.1),
  },
  heroInitials: {
    fontSize: fontSize(18),
    lineHeight: lineHeight(18, 1.1),
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vs(3),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  name: {
    flex: 1,
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.25),
  },
  headline: {
    marginTop: vs(2),
    lineHeight: lineHeight(13, 1.4),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginTop: vs(4),
  },
  kindChip: {
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    borderRadius: ms(8),
  },
  kindLabel: {
    includeFontPadding: false,
    fontSize: fontSize(10),
  },
  meta: {
    flex: 1,
  },
  follow: {
    height: ms(34),
    paddingHorizontal: s(12),
    borderRadius: ms(10),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(8),
  },
  heroFollow: {
    height: ms(42),
    marginLeft: s(10),
    marginRight: s(4),
    borderRadius: ms(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followLabel: {
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.88,
  },
});
