/**
 * Saved library — internal stack screen (not a tab).
 */

import { StyleSheet, View } from 'react-native';
import { Bookmark } from 'lucide-react-native';

import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ms, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ModulePlaceholder, SocialStackChrome } from '@/shared/ui';

/**
 * Bookmarks opened from Profile or post save — back to Feed.
 */
export function BookmarkScreen() {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);
  const openRegister = useOpenAuth('Register');
  const openLogin = useOpenAuth('Login');

  if (!accessToken) {
    return (
      <SocialStackChrome
        subtitle="Your private library"
        title="Saved">
        <View
          style={[
            styles.guest,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <View
            style={[styles.icon, { backgroundColor: theme.colors.primaryMuted }]}>
            <Bookmark color={theme.colors.primary} size={ms(28)} />
          </View>
          <AppText style={styles.center} variant="subtitle" weight="bold">
            Save what matters
          </AppText>
          <AppText color="secondary" style={styles.center} variant="body">
            Bookmark posts and reels after you join. This screen stays off the
            tab bar on purpose.
          </AppText>
          <Button fullWidth onPress={openRegister}>
            Join BIGB
          </Button>
          <Button fullWidth onPress={openLogin} variant="secondary">
            Log in
          </Button>
        </View>
      </SocialStackChrome>
    );
  }

  return (
    <SocialStackChrome subtitle="Posts, reels, and lessons you keep" title="Saved">
      <ModulePlaceholder
        description="Saved posts and clips will collect here, synced across sessions."
        hint="Opened from You → Saved, or the bookmark on a post"
        icon={<Bookmark color={theme.colors.primary} size={ms(32)} />}
        title="Nothing saved yet"
      />
    </SocialStackChrome>
  );
}

const styles = StyleSheet.create({
  guest: {
    borderWidth: 1,
    borderRadius: ms(20),
    padding: ms(20),
    alignItems: 'center',
    gap: ms(10),
  },
  icon: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(4),
  },
  center: {
    textAlign: 'center',
  },
});
