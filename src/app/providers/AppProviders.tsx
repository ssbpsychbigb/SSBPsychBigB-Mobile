/**
 * Application providers shell (Query + Theme + SafeArea).
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { APP_CONFIG } from '@/shared/constants/config';
import { AppErrorBoundary } from '@/shared/errors';
import { ThemeProvider } from '@/shared/theme';
import { AppToastHost } from '@/shared/ui/toast';
import { LogoutConfirmGate } from '@/features/auth/components/LogoutConfirmGate';
import { ChatRealtimeBridge } from '@/features/message/components/ChatRealtimeBridge';

export type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Wraps the app tree with global providers.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: APP_CONFIG.queryStaleTimeMs,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppErrorBoundary>{children}</AppErrorBoundary>
            <ChatRealtimeBridge />
            <LogoutConfirmGate />
            <AppToastHost />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
