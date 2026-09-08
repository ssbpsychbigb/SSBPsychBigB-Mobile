/**
 * Edge-to-edge status bar — screen paint shows through; icons follow contrast.
 */

import { StatusBar } from 'react-native';

import { useTheme } from '@/shared/theme';

export type ImmersiveStatusBarProps = {
  /** Force white icons (Reels / dark video). Default follows theme mode. */
  lightIcons?: boolean;
};

/**
 * Transparent, translucent status bar so each screen’s canvas fills the top inset.
 */
export function ImmersiveStatusBar({ lightIcons }: ImmersiveStatusBarProps) {
  const theme = useTheme();
  const useLightIcons = lightIcons ?? theme.mode === 'dark';

  return (
    <StatusBar
      animated
      backgroundColor="transparent"
      barStyle={useLightIcons ? 'light-content' : 'dark-content'}
      translucent
    />
  );
}
