/**
 * Student Dashboard Screen - Simplified Version
 * Harry School Student Mobile App
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const dashboardCards = [
    {
      title: 'Today\'s Lessons',
      subtitle: '3 lessons scheduled',
      icon: 'book',
      color: '#3b82f6',
    },
    {
      title: 'Progress',
      subtitle: 'Level 12 • 1,250 XP',
      icon: 'trending-up',
      color: '#10b981',
    },
    {
      title: 'Assignments',
      subtitle: '2 pending tasks',
      icon: 'clipboard',
      color: '#f59e0b',
    },
    {
      title: 'Achievements',
      subtitle: '5 new badges',
      icon: 'trophy',
      color: '#8b5cf6',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.studentName}>Student</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle" size={40} color="#1d7452" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to Harry School!</Text>
          <Text style={styles.welcomeSubtitle}>
            Ready to continue your learning journey?
          </Text>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.cardsContainer}>
          {dashboardCards.map((card, index) => (
            <TouchableOpacity 
              key={index}
              style={[styles.card, { borderLeftColor: card.color }]}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
                  <Ionicons 
                    name={card.icon as keyof typeof Ionicons.glyphMap} 
                    size={24} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="play-circle" size={32} color="#1d7452" />
              <Text style={styles.actionText}>Start Lesson</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="library" size={32} color="#1d7452" />
              <Text style={styles.actionText}>Vocabulary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="calendar" size={32} color="#1d7452" />
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Deep Link Tester (Development Only) */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.devTitle}>🔗 Deep Link Tester</Text>
            <Text style={styles.devText}>
              Test deep linking functionality with age-appropriate security validation.
            </Text>
            <TouchableOpacity 
              style={styles.devButton}
              onPress={() => console.log('Deep Link Tester - Coming soon')}
            >
              <Ionicons name="link" size={20} color="#1d7452" />
              <Text style={styles.devButtonText}>Open Tester</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Coming Soon */}
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonTitle}>🚀 Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            More features are being developed! This includes advanced lessons, 
            progress tracking, achievements, and much more.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 2,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#1d7452',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  cardsContainer: {
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 8,
    textAlign: 'center',
  },
  comingSoon: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  devSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    marginBottom: 32,
  },
  devTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  devText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  devButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1d7452',
    marginLeft: 8,
  },
});