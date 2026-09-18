/**
 * Navigates a root-stack screen from nested tab / feed surfaces.
 */

import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';

type RootName = keyof RootStackParamList;

type NavNode = {
  getState?: () => { routeNames?: string[] };
  getParent?: () => unknown;
  navigate: (name: string, params?: object) => void;
};

/**
 * Walks up to the navigator that registered `name` (App tabs sit under Root).
 */
export function useRootNavigate() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return useCallback(
    <T extends RootName>(name: T, params?: RootStackParamList[T]) => {
      let current: NavNode | null = navigation as unknown as NavNode;
      const payload = params as object | undefined;

      while (current) {
        const names = current.getState?.()?.routeNames;
        if (names?.includes(name)) {
          current.navigate(name, payload);
          return;
        }
        current = (current.getParent?.() as NavNode) ?? null;
      }

      (navigation as unknown as NavNode).navigate(name, payload);
    },
    [navigation],
  );
}
