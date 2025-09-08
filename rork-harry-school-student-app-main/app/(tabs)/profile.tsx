import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings, 
  Bell, 
  HelpCircle, 
  LogOut, 
  Edit3, 
  Award, 
  BookOpen, 
  Calendar,
  TrendingUp,
  Star,
  ChevronRight,
  X
} from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import ReferralProgram from '@/components/referral/ReferralProgram';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [showReferralProgram, setShowReferralProgram] = useState<boolean>(false);

  if (!user) return null;

  const levelProgress = (user.points % 1000) / 1000;
  const achievements = 23; // Mock data
  const completedTasks = 156; // Mock data
  const attendanceRate = 94; // Mock data

  const ProfileHeader = () => (
    <Card style={styles.profileHeader}>
      <View style={styles.avatarSection}>
        <Image
          source={{ 
            uri: user.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' 
          }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.editButton}>
          <Edit3 size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.userName}>{user.full_name}</Text>
      <Text style={styles.userEmail}>{user.email}</Text>
      
      <View style={styles.levelSection}>
        <View style={styles.levelInfo}>
          <Star size={16} color={Colors.secondary} />
          <Text style={styles.levelText}>Level {user.level}</Text>
        </View>
        <ProgressBar
          progress={levelProgress}
          height={6}
          backgroundColor={Colors.borderLight}
          progressColor={Colors.primary}
        />
        <Text style={styles.levelProgress}>
          {user.points % 1000} / 1000 XP to next level
        </Text>
      </View>
    </Card>
  );

  const StatsGrid = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.sectionTitle}>Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Award size={20} color={Colors.secondary} />
          </View>
          <Text style={styles.statValue}>{achievements}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <BookOpen size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{completedTasks}</Text>
          <Text style={styles.statLabel}>Tasks Done</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Calendar size={20} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>{attendanceRate}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <TrendingUp size={20} color={Colors.info} />
          </View>
          <Text style={styles.statValue}>#{user.rank}</Text>
          <Text style={styles.statLabel}>Global Rank</Text>
        </View>
      </View>
    </Card>
  );

  const MenuSection = ({ title, items }: { title: string; items: Array<{ icon: React.ReactNode; label: string; onPress: () => void; color?: string }> }) => (
    <Card style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={item.onPress}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, item.color && { backgroundColor: item.color + '20' }]}>
              {item.icon}
            </View>
            <Text style={[styles.menuLabel, item.color && { color: item.color }]}>
              {item.label}
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </Card>
  );

  const settingsItems = [
    {
      icon: <Settings size={20} color={Colors.textSecondary} />,
      label: 'App Settings',
      onPress: () => console.log('Settings'),
    },
    {
      icon: <Bell size={20} color={Colors.textSecondary} />,
      label: 'Notifications',
      onPress: () => console.log('Notifications'),
    },
    {
      icon: <HelpCircle size={20} color={Colors.textSecondary} />,
      label: 'Help & Support',
      onPress: () => console.log('Help'),
    },
  ];

  const referralItems = [
    {
      icon: <Award size={20} color={Colors.primary} />,
      label: 'Referral Program',
      onPress: () => setShowReferralProgram(true),
      color: Colors.primary,
    },
  ];

  const accountItems = [
    {
      icon: <LogOut size={20} color={Colors.error} />,
      label: 'Sign Out',
      onPress: logout,
      color: Colors.error,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <ProfileHeader />
          <StatsGrid />
          <MenuSection title="Rewards" items={referralItems} />
          <MenuSection title="Settings" items={settingsItems} />
          <MenuSection title="Account" items={accountItems} />
        </View>
      </ScrollView>

      {/* Referral Program Modal */}
      <Modal
        visible={showReferralProgram}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReferralProgram(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Referral Program</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowReferralProgram(false)}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <ReferralProgram studentId={user.id} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  levelSection: {
    width: '100%',
    gap: 8,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  levelText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  levelProgress: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsCard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  menuSection: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.text,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});