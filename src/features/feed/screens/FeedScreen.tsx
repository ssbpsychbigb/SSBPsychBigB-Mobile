/**
 * Social feed tab — shell until FEED module APIs land.
 */

import { Newspaper } from 'lucide-react-native';

import { ms } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { ModulePlaceholder, Screen } from '@/shared/ui';

/**
 * Community feed landing for aspirants.
 */
export function FeedScreen() {
  const theme = useTheme();

  return (
    <Screen safeBottom={false}>
      <ModulePlaceholder
        description="Posts from officers, educators, and peers will live here — updates, tips, and defence community discussion."
        hint="Coming next in the mobile roadmap"
        icon={<Newspaper color={theme.colors.primary} size={ms(32)} />}
        title="Community feed"
      />
    </Screen>
  );
}
