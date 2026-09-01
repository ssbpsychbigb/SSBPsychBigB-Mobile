/**
 * BIGB mobile application root.
 */

import { StatusBar } from 'react-native';

import { RootNavigator } from '@/app/navigation';
import { AppProviders } from '@/app/providers/AppProviders';
import { useTheme } from '@/shared/theme';

function AppStatusBar() {
  const theme = useTheme();

  return (
    <StatusBar
      backgroundColor={theme.colors.background}
      barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
    />
  );
}

/**
 * Composition root: providers → status bar → navigation.
 */
export function App() {
  return (
    <AppProviders>
      <AppStatusBar />
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
