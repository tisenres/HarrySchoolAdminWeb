import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/design';

export default function ProfileHomeScreen() {
  const { user, studentProfile, logout } = useAuthStore();

  const menuItems = [
    { title: 'Settings', icon: 'settings', screen: 'Settings' },
    { title: 'Edit Profile', icon: 'person', screen: 'EditProfile' },
    { title: 'Feedback', icon: 'chatbubbles', screen: 'Feedback' },
    { title: 'Refer Friends', icon: 'people', screen: 'Referrals' },
    { title: 'Support', icon: 'help-circle', screen: 'Support' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.headerCard}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0) || 'S'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userLevel}>Level {studentProfile?.level || 1}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{studentProfile?.points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{studentProfile?.coins || 0}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>#{studentProfile?.rank || 0}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
            <View style={styles.menuIcon}>
              <Ionicons name="log-out" size={24} color={COLORS.error} />
            </View>
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base },
  
  // Header
  headerCard: {
    alignItems: 'center',
    padding: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  avatarText: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
  },
  userName: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  userLevel: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: { alignItems: 'center' },
  statValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
  
  // Menu
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  menuText: {
    flex: 1,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.medium,
  },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: COLORS.error },
});