import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>
          Manage your account and app preferences
        </Text>
        <Text style={styles.placeholder}>
          This screen will contain:
          {'\n'}• Teacher profile information
          {'\n'}• Language preferences (EN/RU/UZ)
          {'\n'}• Notification settings
          {'\n'}• Islamic calendar preferences
          {'\n'}• Privacy and security settings
          {'\n'}• Professional development tracking
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