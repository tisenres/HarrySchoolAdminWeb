import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/design';

export default function VocabularyHomeScreen() {
  const features = [
    { title: 'Flashcards', icon: 'library', color: COLORS.primary, screen: 'Flashcards' },
    { title: 'Translator', icon: 'language', color: COLORS.secondary, screen: 'Translator' },
    { title: 'Word Lists', icon: 'list', color: COLORS.warning, screen: 'WordDetail' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Vocabulary Center</Text>
        <Text style={styles.subtitle}>Expand your word knowledge</Text>
        
        {features.map((feature, index) => (
          <TouchableOpacity key={index} style={styles.featureCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${feature.color}20` }]}>
              <Ionicons name={feature.icon as any} size={32} color={feature.color} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>Coming soon!</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY['3xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING['2xl'],
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
  },
});