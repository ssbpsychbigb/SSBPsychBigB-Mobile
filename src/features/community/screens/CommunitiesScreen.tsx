/**
 * Communities — public circles, join gated.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { COMMUNITIES_PREVIEW } from '@/features/community/data/communities-preview';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

/**
 * Defence-prep community list.
 */
export function CommunitiesScreen() {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [joinOpen, setJoinOpen] = useState(false);

  const onJoin = () => {
    if (!accessToken) {
      setJoinOpen(true);
      return;
    }
    showToast.info(
      'Community',
      'Join API wires in with /communities/:slug/join.',
    );
  };

  return (
    <>
      <SocialStackChrome
        showBack={false}
        subtitle="Focused rooms — not a noisy global chat"
        title="Community">
        {COMMUNITIES_PREVIEW.map((row) => (
          <View
            key={row.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}>
            <View style={[styles.mark, { backgroundColor: row.color }]}>
              <AppText color="inverse" variant="label" weight="bold">
                {row.initials}
              </AppText>
            </View>
            <View style={styles.copy}>
              <AppText variant="label">{row.name}</AppText>
              <AppText color="secondary" variant="caption">
                {row.focus}
              </AppText>
              <AppText color="muted" variant="caption">
                {row.members}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onJoin}
              style={[styles.join, { backgroundColor: theme.colors.primary }]}>
              <AppText
                color="inverse"
                style={styles.joinLabel}
                variant="caption"
                weight="semibold">
                Join
              </AppText>
            </Pressable>
          </View>
        ))}
      </SocialStackChrome>
      <JoinToContinueSheet
        message="Community posts and events unlock after you create an account."
        onClose={() => setJoinOpen(false)}
        title="Join this circle"
        visible={joinOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: ms(18),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    marginBottom: vs(10),
  },
  mark: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: ms(2),
  },
  join: {
    height: ms(32),
    paddingHorizontal: s(14),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinLabel: {
    includeFontPadding: false,
  },
});
