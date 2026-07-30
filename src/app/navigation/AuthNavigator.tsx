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

/**
 * Auth flow: Splash (cold launch only) → Welcome → Login / Register → Otp.
 * After sign-out, stack remounts on Login.
 */
export function AuthNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName={getAuthInitialRoute()}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen component={SplashScreen} name="Splash" />
      <Stack.Screen component={WelcomeScreen} name="Welcome" />
      <Stack.Screen component={LoginScreen} name="Login" />
      <Stack.Screen component={RegisterScreen} name="Register" />
      <Stack.Screen component={OtpScreen} name="Otp" />
    </Stack.Navigator>
  );
}
