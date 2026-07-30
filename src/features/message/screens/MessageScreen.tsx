/**
 * Message inbox tab — communication shell.
 */

import { MessageCircle } from 'lucide-react-native';

import { ms } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { ModulePlaceholder, Screen } from '@/shared/ui';

/**
 * Messages / chat landing for aspirants.
 */
export function MessageScreen() {
  const theme = useTheme();

  return (
    <Screen safeBottom={false}>
      <ModulePlaceholder
        description="Chat with mentors, officers, and study groups. Unread threads and community DMs will show up here."
        hint="Messaging wires in with the Chat module"
        icon={<MessageCircle color={theme.colors.primary} size={ms(32)} />}
        title="Messages"
      />
    </Screen>
  );
}
