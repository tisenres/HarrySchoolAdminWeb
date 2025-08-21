/**
 * Recent Achievements Card Component
 * Harry School Student Mobile App
 * 
 * Displays recent achievements with celebration effects
 * Age-adaptive presentation and sharing features
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Card, Badge, AchievementBadge } from '@harry-school/ui';
import type { StudentAgeGroup } from '../../navigation/types';
import type { Achievement, AchievementData } from '../../hooks/useDashboardData';
import { theme } from '@harry-school/ui/theme';

interface RecentAchievementsCardProps {
  ageGroup: StudentAgeGroup;
  data?: AchievementData;
  onPress?: () => void;
  onAchievementPress?: (achievementId: string) => void;
  onShare?: (achievement: Achievement) => void;
  style?: ViewStyle;
  testID?: string;
}

export const RecentAchievementsCard: React.FC<RecentAchievementsCardProps> = ({
  ageGroup,
  data,
  onPress,
  onAchievementPress,
  onShare,
  style,
  testID,
}) => {
  // Age-specific configuration
  const config = useMemo(() => {
    const isElementary = ageGroup === '10-12';
    
    return {
      badgeGallery: isElementary,
      animatedReveals: isElementary,
      soundIntegration: isElementary,
      parentSharing: isElementary,
      collectionMetaphor: isElementary,
      portfolioIntegration: !isElementary,
      peerRecognition: !isElementary,
      realWorldConnection: !isElementary,
      reflectionPrompts: !isElementary,
      selectiveSharing: !isElementary,
      maxVisible: isElementary ? 3 : 4,
    };
  }, [ageGroup]);

  // Mock data for development
  const achievementData: AchievementData = data || {
    recent: [
      {
        id: 'ach-1',
        title: 'Reading Master',
        description: 'Completed 10 reading assignments',
        icon: '📚',
        category: 'academic',
        earnedDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        points: 100,
        rarity: 'rare',
        shared: false,
      },
      {
        id: 'ach-2',
        title: '7-Day Streak',
        description: 'Logged in for 7 consecutive days',
        icon: '🔥',
        category: 'streaks',
        earnedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        points: 50,
        rarity: 'common',
        shared: true,
      },
      {
        id: 'ach-3',
        title: 'Helper Badge',
        description: 'Helped 5 classmates with questions',
        icon: '🤝',
        category: 'social',
        earnedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        points: 75,
        rarity: 'rare',
        shared: false,
      },
    ],
    featured: {
      id: 'ach-featured',
      title: 'Math Genius',
      description: 'Perfect scores on 5 math quizzes',
      icon: '🧮',
      category: 'academic',
      earnedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Week ago
      points: 200,
      rarity: 'legendary',
      shared: true,
    },
    progressTowardNext: [
      {
        id: 'next-1',
        title: 'Vocabulary Champion',
        progress: 80,
        target: 100,
        category: 'academic',
      },
      {
        id: 'next-2',
        title: 'Social Butterfly',
        progress: 3,
        target: 10,
        category: 'social',
      },
    ],
    totalEarned: 47,
    totalPossible: 100,
  };

  // Get rarity display
  const getRarityDisplay = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return { color: '#FFD700', glow: true, stars: '✨✨✨' };
      case 'epic':
        return { color: '#9B59B6', glow: true, stars: '⭐⭐' };
      case 'rare':
        return { color: '#3498DB', glow: false, stars: '⭐' };
      case 'common':
        return { color: '#95A5A6', glow: false, stars: '' };
    }
  };

  // Get category emoji
  const getCategoryEmoji = (category: Achievement['category']) => {
    switch (category) {
      case 'academic':
        return '🎓';
      case 'engagement':
        return '⚡';
      case 'streaks':
        return '🔥';
      case 'social':
        return '👥';
      default:
        return '🏆';
    }
  };

  // Format time since earned
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return 'Today';
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };

  // Empty state
  if (!achievementData.recent || achievementData.recent.length === 0) {
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Card variant="interactive" style={[styles.card, style]}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>
              {config.collectionMetaphor ? 'Start Your Collection!' : 'Earn Your First Achievement'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {config.collectionMetaphor 
                ? 'Complete tasks to unlock amazing treasures!'
                : 'Complete activities to earn achievements'}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${achievementData.recent.length} recent achievements`}
      accessibilityHint="View all achievements"
      testID={testID}
    >
      <Card variant="visual" size="expanded" style={[styles.card, style]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {config.collectionMetaphor ? 'Treasure Collection' : 'Recent Achievements'}
            </Text>
            <Text style={styles.subtitle}>
              {config.collectionMetaphor 
                ? `${achievementData.totalEarned} treasures collected!`
                : `${achievementData.totalEarned}/${achievementData.totalPossible} earned`
              }
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            {config.parentSharing && (
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => achievementData.featured && onShare?.(achievementData.featured)}
                accessibilityRole="button"
                accessibilityLabel="Share achievements"
              >
                <Text style={styles.shareIcon}>📤</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Featured Achievement (if legendary/epic) */}
        {achievementData.featured && (achievementData.featured.rarity === 'legendary' || achievementData.featured.rarity === 'epic') && (
          <TouchableOpacity
            style={styles.featuredSection}
            onPress={() => onAchievementPress?.(achievementData.featured!.id)}
          >
            <View style={[
              styles.featuredCard,
              { borderColor: getRarityDisplay(achievementData.featured.rarity).color }
            ]}>
              <View style={styles.featuredHeader}>
                <Text style={styles.featuredLabel}>
                  {config.collectionMetaphor ? 'Legendary Treasure!' : 'Featured Achievement'}
                </Text>
                <Text style={styles.featuredRarity}>
                  {getRarityDisplay(achievementData.featured.rarity).stars}
                </Text>
              </View>
              
              <View style={styles.featuredContent}>
                <Text style={styles.featuredIcon}>{achievementData.featured.icon}</Text>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredTitle}>{achievementData.featured.title}</Text>
                  <Text style={styles.featuredDescription}>
                    {achievementData.featured.description}
                  </Text>
                  <Text style={styles.featuredPoints}>
                    +{achievementData.featured.points} points
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Recent Achievements List */}
        <ScrollView 
          style={styles.achievementsList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {achievementData.recent.slice(0, config.maxVisible).map((achievement) => {
            const rarityDisplay = getRarityDisplay(achievement.rarity);
            
            return (
              <TouchableOpacity
                key={achievement.id}
                style={styles.achievementItem}
                onPress={() => onAchievementPress?.(achievement.id)}
                accessibilityRole="button"
                accessibilityLabel={`${achievement.title} achievement`}
              >
                <View style={styles.achievementContent}>
                  {/* Achievement Icon with Rarity Glow */}
                  <View style={[
                    styles.achievementIconContainer,
                    rarityDisplay.glow && { 
                      shadowColor: rarityDisplay.color,
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                      elevation: 8,
                    }
                  ]}>
                    <Text style={[
                      styles.achievementIcon,
                      { 
                        backgroundColor: rarityDisplay.color + '20',
                        borderColor: rarityDisplay.color,
                      }
                    ]}>
                      {achievement.icon}
                    </Text>
                    
                    {/* Category Badge */}
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryEmoji}>
                        {getCategoryEmoji(achievement.category)}
                      </Text>
                    </View>
                  </View>

                  {/* Achievement Info */}
                  <View style={styles.achievementInfo}>
                    <View style={styles.achievementTitleRow}>
                      <Text style={styles.achievementTitle}>
                        {achievement.title}
                      </Text>
                      <Text style={styles.achievementTime}>
                        {getTimeAgo(achievement.earnedDate)}
                      </Text>
                    </View>
                    
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                    
                    <View style={styles.achievementMeta}>
                      <Text style={styles.achievementPoints}>
                        +{achievement.points} pts
                      </Text>
                      
                      {rarityDisplay.stars && (
                        <Text style={styles.achievementRarity}>
                          {rarityDisplay.stars}
                        </Text>
                      )}
                      
                      {achievement.shared && config.parentSharing && (
                        <Text style={styles.sharedIndicator}>📤</Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Progress Toward Next */}
        {achievementData.progressTowardNext.length > 0 && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>
              {config.collectionMetaphor ? 'Nearly There!' : 'Progress Toward Next'}
            </Text>
            
            {achievementData.progressTowardNext.slice(0, 2).map((progress) => (
              <View key={progress.id} style={styles.progressItem}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressName}>{progress.title}</Text>
                  <Text style={styles.progressValue}>
                    {progress.progress}/{progress.target}
                  </Text>
                </View>
                
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${(progress.progress / progress.target) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Character Encouragement (Elementary) */}
        {config.collectionMetaphor && (
          <View style={styles.characterMessage}>
            <Text style={styles.characterEmoji}>🦉</Text>
            <Text style={styles.characterText}>
              {achievementData.recent.length > 2
                ? "Wow! You're collecting treasures like a true explorer!"
                : "Keep exploring to discover more amazing treasures!"}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  
  titleContainer: {
    flex: 1,
  },
  
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  
  subtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  
  headerActions: {
    flexDirection: 'row',
  },
  
  shareButton: {
    padding: 4,
  },
  
  shareIcon: {
    fontSize: 16,
  },
  
  featuredSection: {
    marginBottom: theme.spacing.md,
  },
  
  featuredCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    borderWidth: 2,
    padding: theme.spacing.md,
  },
  
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  featuredLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary.main,
    textTransform: 'uppercase',
  },
  
  featuredRarity: {
    fontSize: 14,
  },
  
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  featuredIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  
  featuredInfo: {
    flex: 1,
  },
  
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  
  featuredDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  
  featuredPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.educational.performance.excellent,
  },
  
  achievementsList: {
    maxHeight: 180,
  },
  
  achievementItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  achievementIconContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  
  achievementIcon: {
    fontSize: 24,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  
  categoryBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  categoryEmoji: {
    fontSize: 8,
  },
  
  achievementInfo: {
    flex: 1,
  },
  
  achievementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  
  achievementTime: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  
  achievementDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  
  achievementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  achievementPoints: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.educational.performance.excellent,
    marginRight: theme.spacing.sm,
  },
  
  achievementRarity: {
    fontSize: 10,
    marginRight: theme.spacing.sm,
  },
  
  sharedIndicator: {
    fontSize: 10,
  },
  
  progressSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  progressItem: {
    marginBottom: theme.spacing.sm,
  },
  
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  progressName: {
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  
  progressValue: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: 2,
  },
  
  characterMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.educational.performance.excellent + '20',
    borderRadius: 8,
  },
  
  characterEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  
  characterText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default RecentAchievementsCard;