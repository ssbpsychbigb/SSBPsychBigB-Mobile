/**
 * Bookmark / saved content tab shell.
 */

import { Bookmark } from 'lucide-react-native';

import { ms } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { ModulePlaceholder, Screen } from '@/shared/ui';

/**
 * Saved posts, courses, and resources.
 */
export function BookmarkScreen() {
  const theme = useTheme();

  return (
    <Screen safeBottom={false}>
      <ModulePlaceholder
        description="Save posts, lessons, and officer tips for later. Your bookmarks stay synced across sessions."
        hint="Bookmarks connect to Feed and Learning modules"
        icon={<Bookmark color={theme.colors.primary} size={ms(32)} />}
        title="Bookmarks"
      />
    </Screen>
  );
}
