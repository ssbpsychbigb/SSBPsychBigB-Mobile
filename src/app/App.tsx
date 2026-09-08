/**
 * BIGB mobile application root.
 */

import { RootNavigator } from '@/app/navigation';
import { AppProviders } from '@/app/providers/AppProviders';
import { ImmersiveStatusBar } from '@/shared/ui';

/**
 * Composition root: providers → edge-to-edge status bar → navigation.
 */
export function App() {
  return (
    <AppProviders>
      <ImmersiveStatusBar />
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
