/**
 * Learning tab — courses catalogue shell.
 */

import { BookOpen } from 'lucide-react-native';

import { GuestUnlockPanel } from '@/features/auth/components/GuestUnlockPanel';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ms } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { ModulePlaceholder, Screen } from '@/shared/ui';

/**
 * My Learning / catalogue entry point.
 */
export function LearnScreen() {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) {
    return (
      <GuestUnlockPanel
        description="Courses, lessons, and progress tracking unlock after you create a BIGB account."
        icon={<BookOpen color={theme.colors.primary} size={ms(32)} />}
        title="Start learning as a member"
      />
    );
  }

  return (
    <Screen safeBottom={false}>
      <ModulePlaceholder
        description="Browse courses, continue lessons, and track progress for NDA, CDS, AFCAT, SSB and more."
        hint="Course catalogue wires in with the Learning module"
        icon={<BookOpen color={theme.colors.primary} size={ms(32)} />}
        title="My learning"
      />
    </Screen>
  );
}
