import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import Colors from '@/constants/colors';
import { StudentProvider } from '@/providers/StudentProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import ErrorBoundary from '@/components/common/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack initialRouteName="login" screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('App initialization start');
        await SystemUI.setBackgroundColorAsync(Colors.background);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        SplashScreen.hideAsync();
        console.log('App initialization end');
      }
    };

    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StudentProvider>
          <ErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }} testID="root-gesture-container">
              <StatusBar style="dark" />
              <RootLayoutNav />
            </GestureHandlerRootView>
          </ErrorBoundary>
        </StudentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}