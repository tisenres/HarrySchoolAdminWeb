import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Colors from '@/constants/colors';
import AIDebugPanel from '@/components/ai/AIDebugPanel';

export default function AIScreen() {
  return (
    <View style={styles.container} testID="ai-screen">
      <Stack.Screen options={{ title: 'AI' }} />
      <AIDebugPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});