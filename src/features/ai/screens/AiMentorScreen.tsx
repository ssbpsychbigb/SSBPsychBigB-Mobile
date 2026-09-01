/**
 * AI Mentor tab — lite mentor shell.
 */

import { Brain } from 'lucide-react-native';

import { ms } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { ModulePlaceholder, Screen } from '@/shared/ui';

/**
 * AI Mentor quick actions entry (chat, plan, daily mission).
 */
export function AiMentorScreen() {
  const theme = useTheme();

  return (
    <Screen safeBottom={false}>
      <ModulePlaceholder
        description="Ask study questions, get a daily mission, and build a plan around your exam goal — lightweight mentor on the go."
        hint="AI Mentor Lite lands after core learning APIs"
        icon={<Brain color={theme.colors.primary} size={ms(32)} />}
        title="AI Mentor"
      />
    </Screen>
  );
}
