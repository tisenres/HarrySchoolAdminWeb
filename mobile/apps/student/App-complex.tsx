/**
 * Harry School Student App
 * 
 * Main application entry point with complete navigation structure.
 * Features 5-tab bottom navigation optimized for ages 10-18 based on UX research.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Platform, LogBox, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

// Navigation
import { RootNavigator } from './src/navigation';

// Error boundary
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Performance monitoring (disabled for web testing)
// import { performanceMonitor } from './src/services/performance-monitor';

// Suppress specific warnings for development
if (__DEV__) {
  LogBox.ignoreLogs([
    'ViewPropTypes will be removed',
    'ColorPropType will be removed',
    'EdgeInsetsPropType will be removed',
    'Require cycle:',
  ]);
}

// =====================================================
// MAIN APP COMPONENT
// =====================================================

export default function App() {
  const [isReady, setIsReady] = useState(false);

  // =====================================================
  // APP INITIALIZATION
  // =====================================================

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = useCallback(async () => {
    try {
      // Start performance monitoring (disabled for web testing)
      // performanceMonitor.startSession();

      // Additional initialization tasks can be added here:
      // - Load fonts
      // - Initialize analytics
      // - Setup crash reporting
      // - Configure notifications
      
      // Simulate initialization time (remove in production)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsReady(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      // Handle initialization errors gracefully
      setIsReady(true); // Still allow app to load
    }
  }, []);

  // =====================================================
  // NAVIGATION READY HANDLER
  // =====================================================

  const handleNavigationReady = useCallback(() => {
    // Navigation is fully initialized and ready
    // performanceMonitor.markNavigationReady();
    
    // Additional post-navigation setup can be done here
    if (__DEV__) {
      console.log('📱 Harry School Student App - Navigation Ready');
    }
  }, []);

  // =====================================================
  // ERROR BOUNDARY FALLBACK
  // =====================================================

  const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <SafeAreaProvider>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 24,
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: '700',
          color: '#dc2626',
          marginBottom: 16,
          textAlign: 'center',
        }}>
          Something went wrong
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 24,
        }}>
          The app encountered an unexpected error. Please restart the app.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#1d7452',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={resetError}
        >
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
          }}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1d7452', // Harry School primary color
        }}>
          <Text style={{
            fontSize: 32,
            fontWeight: '700',
            color: '#fff',
            marginBottom: 16,
          }}>
            Harry School
          </Text>
          <Text style={{
            fontSize: 18,
            color: '#fff',
            opacity: 0.8,
          }}>
            Student
          </Text>
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    );
  }

  // =====================================================
  // MAIN APP RENDER
  // =====================================================

  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          {/* Status Bar Configuration */}
          <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
          
          {/* Main Navigation */}
          <RootNavigator onReady={handleNavigationReady} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
