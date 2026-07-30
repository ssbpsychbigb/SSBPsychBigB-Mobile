/**
 * Learning tab — courses catalogue shell.
 */

import { BookOpen } from 'lucide-react-native';

import { ms } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { ModulePlaceholder, Screen } from '@/shared/ui';

/**
 * My Learning / catalogue entry point.
 */
export function LearnScreen() {
  const theme = useTheme();

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
