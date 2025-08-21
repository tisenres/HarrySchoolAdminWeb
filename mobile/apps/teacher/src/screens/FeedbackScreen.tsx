import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FeedbackScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Feedback & Assessment</Text>
        <Text style={styles.subtitle}>
          Grade assignments and communicate with parents
        </Text>
        <Text style={styles.placeholder}>
          This screen will contain:
          {'\n'}• Assignment grading interface
          {'\n'}• Parent-teacher communication
          {'\n'}• Student progress reports
          {'\n'}• Behavioral feedback forms
          {'\n'}• Cultural communication templates
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'left',
    lineHeight: 20,
  },
});