import { useContext } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

/**
 * Height of the overlay tab bar, or 0 outside the tab navigator.
 * Use it as scroll-content padding so the last row can move clear of the
 * icons. Do not apply it as layout padding — that clips the screen above a box.
 */
export function useTabBarInset(): number {
  return useContext(BottomTabBarHeightContext) ?? 0;
}
