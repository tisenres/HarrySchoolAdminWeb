import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Trophy, Medal, Award, Crown, TrendingUp, Loader2 } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useStudent } from '@/providers/StudentProvider';
import { StudentRanking } from '@/lib/supabase';

// Extended type for leaderboard display
type LeaderboardEntry = StudentRanking & {
  full_name?: string;
  avatar_url?: string;
};

// Mock data for fallback
const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    organization_id: 'mock-org-1',
    student_id: '1',
    total_points: 15420,
    available_coins: 1542,
    spent_coins: 100,
    current_level: 15,
    current_rank: 1,
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    full_name: 'Alice Johnson',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '2',
    organization_id: 'mock-org-1',
    student_id: '2',
    total_points: 14890,
    available_coins: 1489,
    spent_coins: 80,
    current_level: 14,
    current_rank: 2,
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    full_name: 'Bob Smith',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '3',
    organization_id: 'mock-org-1',
    student_id: '3',
    total_points: 14320,
    available_coins: 1432,
    spent_coins: 60,
    current_level: 14,
    current_rank: 3,
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    full_name: 'Carol Davis',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '4',
    organization_id: 'mock-org-1',
    student_id: '4',
    total_points: 13750,
    available_coins: 1375,
    spent_coins: 50,
    current_level: 13,
    current_rank: 4,
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    full_name: 'David Wilson',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '5',
    organization_id: 'mock-org-1',
    student_id: '5',
    total_points: 13200,
    available_coins: 1320,
    spent_coins: 40,
    current_level: 13,
    current_rank: 5,
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    full_name: 'Eva Brown',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  },
];

export default function LeaderboardScreen() {
  const { 
    leaderboard, 
    student,
    isLoadingLeaderboard, 
    leaderboardError,
    refreshData 
  } = useStudent();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Use actual leaderboard data or fallback to mock data
  const displayLeaderboard: LeaderboardEntry[] = leaderboardError || !leaderboard.length ? mockLeaderboard : leaderboard;

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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return (
          <View style={styles.rankNumber}>
            <Text style={styles.rankNumberText}>{rank}</Text>
          </View>
        );
    }
  };



  const TopThree = () => {
    if (displayLeaderboard.length < 3) {
      return (
        <Card style={styles.topThreeContainer}>
          <Text style={styles.emptyText}>Not enough participants for podium</Text>
        </Card>
      );
    }

    return (
      <Card style={styles.topThreeContainer}>
        <View style={styles.podium}>
          {/* Second Place */}
          <View style={[styles.podiumPlace, styles.secondPlace]}>
            <Image
              source={{ uri: displayLeaderboard[1].avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }}
              style={styles.podiumAvatar}
            />
            <Medal size={20} color="#C0C0C0" />
            <Text style={styles.podiumName}>{displayLeaderboard[1].full_name?.split(' ')[0] || `Student ${displayLeaderboard[1].student_id}`}</Text>
            <Text style={styles.podiumPoints}>{displayLeaderboard[1].total_points.toLocaleString()}</Text>
            <View style={[styles.podiumBase, styles.podiumSecond]} />
          </View>

          {/* First Place */}
          <View style={[styles.podiumPlace, styles.firstPlace]}>
            <Image
              source={{ uri: displayLeaderboard[0].avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' }}
              style={[styles.podiumAvatar, styles.winnerAvatar]}
            />
            <Crown size={24} color="#FFD700" />
            <Text style={styles.podiumName}>{displayLeaderboard[0].full_name?.split(' ')[0] || `Student ${displayLeaderboard[0].student_id}`}</Text>
            <Text style={styles.podiumPoints}>{displayLeaderboard[0].total_points.toLocaleString()}</Text>
            <View style={[styles.podiumBase, styles.podiumFirst]} />
          </View>

          {/* Third Place */}
          <View style={[styles.podiumPlace, styles.thirdPlace]}>
            <Image
              source={{ uri: displayLeaderboard[2].avatar_url || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' }}
              style={styles.podiumAvatar}
            />
            <Award size={20} color="#CD7F32" />
            <Text style={styles.podiumName}>{displayLeaderboard[2].full_name?.split(' ')[0] || `Student ${displayLeaderboard[2].student_id}`}</Text>
            <Text style={styles.podiumPoints}>{displayLeaderboard[2].total_points.toLocaleString()}</Text>
            <View style={[styles.podiumBase, styles.podiumThird]} />
          </View>
        </View>
      </Card>
    );
  };

  const LeaderboardItem = ({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) => (
    <Card style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
      <View style={styles.itemLeft}>
        {getRankIcon(entry.current_rank || 0)}
        <Image
          source={{ uri: entry.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
            {entry.full_name || `Student ${entry.student_id}`}
          </Text>
          <Text style={styles.userLevel}>Level {entry.current_level}</Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.points, isCurrentUser && styles.currentUserText]}>
          {entry.total_points.toLocaleString()}
        </Text>
        <Text style={styles.pointsLabel}>points</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.timeframeSelector}>
          {(['weekly', 'monthly', 'all'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.timeframeButton,
                timeframe === period && styles.timeframeButtonActive,
              ]}
              onPress={() => setTimeframe(period)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  timeframe === period && styles.timeframeTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
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
          {isLoadingLeaderboard ? (
            <View style={styles.loadingContainer}>
              <Loader2 size={32} color={Colors.primary} />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : leaderboardError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load leaderboard</Text>
              <Button title="Retry" onPress={onRefresh} style={styles.retryButton} />
            </View>
          ) : (
            <>
              <TopThree />

              <View style={styles.leaderboardList}>
                <View style={styles.listHeader}>
                  <TrendingUp size={20} color={Colors.primary} />
                  <Text style={styles.listTitle}>Full Rankings</Text>
                </View>

                {displayLeaderboard.slice(3).map((entry) => (
                  <LeaderboardItem
                    key={entry.id}
                    entry={entry}
                    isCurrentUser={entry.student_id === student?.id}
                  />
                ))}

                {displayLeaderboard.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Trophy size={48} color={Colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No rankings yet</Text>
                    <Text style={styles.emptyText}>Complete lessons to appear on the leaderboard!</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
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
    marginBottom: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeframeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeframeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  timeframeTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 100,
  },
  topThreeContainer: {
    padding: 20,
    backgroundColor: Colors.card,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 200,
  },
  podiumPlace: {
    alignItems: 'center',
    flex: 1,
  },
  firstPlace: {
    zIndex: 3,
  },
  secondPlace: {
    zIndex: 2,
  },
  thirdPlace: {
    zIndex: 1,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  winnerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  podiumName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginTop: 4,
  },
  podiumPoints: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  podiumBase: {
    width: '80%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumFirst: {
    height: 80,
    backgroundColor: '#FFD700',
  },
  podiumSecond: {
    height: 60,
    backgroundColor: '#C0C0C0',
  },
  podiumThird: {
    height: 40,
    backgroundColor: '#CD7F32',
  },
  leaderboardList: {
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rankNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  currentUserText: {
    color: Colors.primary,
  },
  userLevel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  pointsLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  regularPlace: {},
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.error,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});