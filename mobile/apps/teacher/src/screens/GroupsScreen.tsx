import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function GroupsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Groups & Students</Text>
        <Text style={styles.subtitle}>
          Manage your classes, students, and group activities
        </Text>
        <Text style={styles.placeholder}>
          This screen will contain:
          {'\n'}• Student roster management
          {'\n'}• Group activities and assignments
          {'\n'}• Individual student progress
          {'\n'}• Behavioral notes and alerts
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