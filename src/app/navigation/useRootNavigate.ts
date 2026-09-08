/**
 * Navigates a root-stack screen from nested tab / feed surfaces.
 */

import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';

type RootName = keyof RootStackParamList;

/**
 * Walks up to the navigator that registered `name` (App tabs sit under Root).
 */
export function useRootNavigate() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return useCallback(
    (name: RootName) => {
      let current: { getState?: () => { routeNames?: string[] }; getParent?: () => unknown; navigate: (n: never) => void } | null =
        navigation;

      while (current) {
        const names = current.getState?.()?.routeNames;
        if (names?.includes(name)) {
          current.navigate(name as never);
          return;
        }
        current = (current.getParent?.() as typeof current) ?? null;
      }

      navigation.navigate(name as never);
    },
    [navigation],
  );
}
