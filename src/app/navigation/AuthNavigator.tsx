/**
 * Unauthenticated navigation stack.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '@/app/navigation/types';
import {
  LoginScreen,
  OtpScreen,
  RegisterScreen,
  SplashScreen,
  WelcomeScreen,
} from '@/features/auth';
import { getAuthInitialRoute } from '@/features/auth/lib/auth-entry';
import { useTheme } from '@/shared/theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export type AuthNavigatorProps = {
  /** `modal` skips splash — used from the public Feed shell. */
  mode?: 'full' | 'modal';
};

/**
 * Auth flow: Splash (gate only) → Welcome → Login / Register → Otp.
 */
export function AuthNavigator({ mode = 'full' }: AuthNavigatorProps) {
  const theme = useTheme();
  const initialRouteName = mode === 'modal' ? 'Welcome' : getAuthInitialRoute();

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}>
      {mode === 'full' ? <Stack.Screen component={SplashScreen} name="Splash" /> : null}
      <Stack.Screen component={WelcomeScreen} name="Welcome" />
      <Stack.Screen component={LoginScreen} name="Login" />
      <Stack.Screen component={RegisterScreen} name="Register" />
      <Stack.Screen component={OtpScreen} name="Otp" />
    </Stack.Navigator>
  );
}
