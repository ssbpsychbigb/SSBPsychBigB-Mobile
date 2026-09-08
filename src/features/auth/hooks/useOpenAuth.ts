/**
 * Opens the auth stack from the public app shell (guest join / login).
 */

import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';

export type AuthEntryScreen = 'Welcome' | 'Login' | 'Register';

/**
 * Navigates to the root Auth modal, optionally landing on Login or Register.
 */
export function useOpenAuth(screen: AuthEntryScreen = 'Welcome') {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return useCallback(() => {
    navigation.navigate('Auth', { screen });
  }, [navigation, screen]);
}
