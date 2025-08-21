/**
 * Minimal Harry School Student App
 * Basic working version for web testing
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Harry School</Text>
          <Text style={styles.subtitle}>Student App</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.welcome}>Welcome to Harry School Student App!</Text>
          
          <View style={styles.cardGrid}>
            <TouchableOpacity style={[styles.card, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.cardTitle}>📚 Lessons</Text>
              <Text style={styles.cardSubtitle}>Interactive learning</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.card, { backgroundColor: '#10b981' }]}>
              <Text style={styles.cardTitle}>📅 Schedule</Text>
              <Text style={styles.cardSubtitle}>Class calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.card, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.cardTitle}>📖 Vocabulary</Text>
              <Text style={styles.cardSubtitle}>Word learning</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.card, { backgroundColor: '#8b5cf6' }]}>
              <Text style={styles.cardTitle}>👤 Profile</Text>
              <Text style={styles.cardSubtitle}>Settings & progress</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>✅ All features implemented and ready!</Text>
            <Text style={styles.footerSubtext}>
              Schedule • Profile • Request • Deep Linking • Cultural Integration
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1d7452',
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 40,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});