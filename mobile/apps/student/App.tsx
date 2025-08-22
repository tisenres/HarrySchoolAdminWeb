import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import SplashScreen from './src/screens/SplashScreen';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    const initApp = async () => {
      await initializeAuth();
      // Simulate minimum splash screen time for smooth experience
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
    };

    initApp();
  }, [initializeAuth]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="dark" backgroundColor="transparent" />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}