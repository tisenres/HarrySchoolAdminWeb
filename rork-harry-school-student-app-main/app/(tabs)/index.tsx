import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, RefreshControl, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Search, Bot, Award, MessageSquare, AlertCircle, Calendar, Clock, Trophy, Crown, Medal } from 'lucide-react-native';
import { router, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import RankingCard from '@/components/dashboard/RankingCard';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import QuickStats from '@/components/dashboard/QuickStats';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import { useStudent } from '@/providers/StudentProvider';
import AIDebugPanel from '@/components/ai/AIDebugPanel';
import Confetti from '@/components/ui/Confetti';
import NotificationPanel from '@/components/ui/NotificationPanel';
import SearchPanel from '@/components/ui/SearchPanel';
import Card from '@/components/ui/Card';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'homework' | 'event';
  author: string;
  created_at: string;
  read: boolean;
}

function LeaderboardPreview() {
  const mockLeaderboard = React.useMemo(() => [
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      points: 15420,
      rank: 1,
      level: 15,
    },
    {
      id: '2',
      name: 'Bob Smith',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      points: 14890,
      rank: 2,
      level: 14,
    },
    {
      id: '3',
      name: 'Carol Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      points: 14320,
      rank: 3,
      level: 14,
    },
  ], []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={16} color="#FFD700" />;
      case 2:
        return <Medal size={16} color="#C0C0C0" />;
      case 3:
        return <Trophy size={16} color="#CD7F32" />;
      default:
        return null;
    }
  };

  return (
    <Card style={styles.previewCard} testID="leaderboard-preview">
      <View style={styles.previewHeader}>
        <View style={styles.previewTitleRow}>
          <View style={styles.previewIconWrap}>
            <Trophy size={16} color={Colors.primary} />
          </View>
          <Text style={styles.previewTitle}>Leaderboard</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/leaderboard')}>
          <Text style={styles.previewSeeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.leaderboardList}>
        {mockLeaderboard.map((entry) => (
          <View key={entry.id} style={styles.leaderboardItem}>
            <View style={styles.leaderboardLeft}>
              {getRankIcon(entry.rank)}
              <Image
                source={{ uri: entry.avatar }}
                style={styles.leaderboardAvatar}
                contentFit="cover"
              />
              <View style={styles.leaderboardInfo}>
                <Text style={styles.leaderboardName} numberOfLines={1}>
                  {entry.name}
                </Text>
                <Text style={styles.leaderboardLevel}>Level {entry.level}</Text>
              </View>
            </View>
            <Text style={styles.leaderboardPoints}>{entry.points.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function MessagesPreview() {
  const announcements: Announcement[] = React.useMemo(() => ([
    {
      id: '1',
      title: 'Welcome to the New Semester!',
      content: 'We are excited to start this new academic year with you. Please check your schedule and make sure you have all the required materials.',
      type: 'general',
      author: 'Principal Johnson',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
    },
    {
      id: '2',
      title: 'Math Quiz Tomorrow',
      content: "Don\'t forget about the math quiz scheduled for tomorrow at 10 AM. Please review chapters 5-7.",
      type: 'homework',
      author: 'Mr. Smith',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      read: true,
    },
    {
      id: '3',
      title: 'School Closure Due to Weather',
      content: 'Due to severe weather conditions, the school will be closed tomorrow. All classes will be conducted online.',
      type: 'urgent',
      author: 'Administration',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      read: false,
    },
  ]), []);

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle size={14} color={Colors.error} />;
      case 'homework':
        return <Clock size={14} color={Colors.warning} />;
      case 'event':
        return <Calendar size={14} color={Colors.info} />;
      default:
        return <Bell size={14} color={Colors.primary} />;
    }
  };

  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent':
        return Colors.error;
      case 'homework':
        return Colors.warning;
      case 'event':
        return Colors.info;
      default:
        return Colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card style={styles.previewCard} testID="messages-preview">
      <View style={styles.previewHeader}>
        <View style={styles.previewTitleRow}>
          <View style={styles.previewIconWrap}>
            <MessageSquare size={16} color={Colors.primary} />
          </View>
          <Text style={styles.previewTitle}>Announcements</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/messages')}>
          <Text style={styles.previewSeeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.announcementsList}>
        {announcements.slice(0, 3).map((a) => (
          <View key={a.id} style={styles.announcementItem}>
            <View style={styles.announcementIcon}>{getTypeIcon(a.type)}</View>
            <View style={styles.announcementContent}>
              <View style={styles.announcementHeader}>
                <Text style={styles.announcementTitle} numberOfLines={1}>
                  {a.title}
                </Text>
                <Text style={styles.announcementTime}>{formatDate(a.created_at)}</Text>
              </View>
              <Text style={styles.announcementText} numberOfLines={2}>{a.content}</Text>
              <View style={[styles.announcementBadge, { backgroundColor: getTypeColor(a.type) + '20' }]}>
                <Text style={[styles.announcementBadgeText, { color: getTypeColor(a.type) }]}>{a.type.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}


export default function DashboardScreen() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { refreshData } = useStudent();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [aiOpen, setAiOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const expand = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const [celebrateKey, setCelebrateKey] = useState<number>(0);
  const [unreadNotifications] = useState<number>(2);
  const insets = useSafeAreaInsets();

  // Remove problematic useEffect that was causing navigation issues
  
  // Move useEffect after conditional returns to fix React hooks rule
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])
    ).start();
  }, [glow]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Auth gate: if not authenticated and not loading, redirect without imperative navigation
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/onboarding" />;
  }

  // Show splash screen while loading
  if (isLoading) {
    return (
      <LinearGradient
        colors={Colors.gradient.primary}
        style={styles.splashContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.splashContent}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop' }}
            style={styles.logo}
            contentFit="cover"
          />
        </View>
      </LinearGradient>
    );
  }

  const toggleAI = () => {
    const to = aiOpen ? 0 : 1;
    setAiOpen(!aiOpen);
    Animated.timing(expand, { toValue: to, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  };



  const glowColor = glow.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', Colors.primary + '33'] });
  const aiHeight = expand.interpolate({ inputRange: [0, 1], outputRange: [0, 520] });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileSection} onPress={() => router.push('/profile')}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.statusIndicator} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.full_name || 'Student'}</Text>
            <View style={styles.levelBadge}>
              <Award size={12} color={Colors.secondary} />
              <Text style={styles.levelText}>Level 5</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setSearchOpen(true)}
          >
            <Search size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setNotificationsOpen(true)}
          >
            <Bell size={24} color={Colors.text} />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <RankingCard />
          <TodaySchedule />
          <QuickStats />

          <LeaderboardPreview />
          <MessagesPreview />

          <Animated.View style={[styles.aiCard, { shadowColor: Colors.primary, shadowOpacity: 0.15, shadowRadius: 12, borderColor: glowColor as any }]}
            testID="ai-card">
            <TouchableOpacity style={styles.aiHeader} onPress={toggleAI} testID="ai-toggle">
              <View style={styles.aiTitleRow}>
                <View style={styles.aiIconWrap}><Bot color={Colors.primary} size={20} /></View>
                <Text style={styles.aiTitle}>AI Study Assistant</Text>
              </View>
              <Text style={styles.aiToggleText}>{aiOpen ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            <Animated.View style={[styles.aiContent, { height: aiHeight }]}>
              <View style={styles.aiContentInner}>
                <AIDebugPanel onCelebrate={() => setCelebrateKey(k => k + 1)} />
              </View>
            </Animated.View>
          </Animated.View>

          <Confetti key={`confetti-${celebrateKey}`} trigger={celebrateKey} />
        </View>
      </ScrollView>
      
      <NotificationPanel 
        visible={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
      
      <SearchPanel 
        visible={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  splashContainer: {
    flex: 1,
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.primary + '33',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  userName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  levelText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.secondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  },
  aiCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '22', alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text },
  aiToggleText: { color: Colors.primary, fontWeight: FontWeights.semibold },
  aiContent: { overflow: 'hidden' },
  aiContentInner: { paddingTop: 8 },
  confettiWrap: { position: 'absolute', left: 0, right: 0, top: 0, height: 260 },
  
  // Preview card styles
  previewCard: { padding: 16 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  previewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '22', alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.text },
  previewSeeAll: { color: Colors.primary, fontWeight: FontWeights.semibold },
  
  // Leaderboard preview styles
  leaderboardList: { gap: 12 },
  leaderboardItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  leaderboardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  leaderboardAvatar: { width: 32, height: 32, borderRadius: 16 },
  leaderboardInfo: { flex: 1 },
  leaderboardName: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text },
  leaderboardLevel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  leaderboardPoints: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.primary },
  
  // Announcements preview styles
  announcementsList: { gap: 12 },
  announcementItem: { paddingVertical: 6, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  announcementIcon: { marginTop: 2 },
  announcementContent: { flex: 1 },
  announcementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  announcementTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text },
  announcementTime: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  announcementText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  announcementBadge: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  announcementBadgeText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
});