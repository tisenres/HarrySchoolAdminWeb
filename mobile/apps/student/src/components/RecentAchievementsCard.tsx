import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  white: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  lightBlue: '#dbeafe',
  lightGreen: '#dcfce7',
  lightOrange: '#fed7aa',
  lightPurple: '#f3e8ff',
  lightGold: '#fef3c7',
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'attendance' | 'social' | 'special' | 'islamic';
  unlockedAt: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isNew: boolean;
}

export default function RecentAchievementsCard() {
  const recentAchievements: Achievement[] = [
    {
      id: '1',
      title: 'Knowledge Seeker',
      description: 'Completed 50 lessons with 90%+ score',
      icon: 'school',
      category: 'learning',
      unlockedAt: '2 hours ago',
      points: 100,
      rarity: 'epic',
      isNew: true,
    },
    {
      id: '2',
      title: 'Perfect Attendance',
      description: '30 days streak of attendance',
      icon: 'event-available',
      category: 'attendance',
      unlockedAt: '1 day ago',
      points: 150,
      rarity: 'rare',
      isNew: true,
    },
    {
      id: '3',
      title: 'Quran Memorizer',
      description: 'Memorized Surah Al-Mulk perfectly',
      icon: 'menu-book',
      category: 'islamic',
      unlockedAt: '3 days ago',
      points: 200,
      rarity: 'legendary',
      isNew: false,
    },
    {
      id: '4',
      title: 'Helpful Friend',
      description: 'Helped 5 classmates with their studies',
      icon: 'people',
      category: 'social',
      unlockedAt: '1 week ago',
      points: 75,
      rarity: 'rare',
      isNew: false,
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#9333ea';
      case 'epic': return '#dc2626';
      case 'rare': return '#2563eb';
      case 'common': return '#16a34a';
      default: return COLORS.textSecondary;
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return COLORS.lightPurple;
      case 'epic': return '#fee2e2';
      case 'rare': return COLORS.lightBlue;
      case 'common': return COLORS.lightGreen;
      default: return `${COLORS.textSecondary}20`;
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'learning': return '🎓';
      case 'attendance': return '📅';
      case 'social': return '🤝';
      case 'special': return '⭐';
      case 'islamic': return '☪️';
      default: return '🏆';
    }
  };

  const getRarityStars = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '⭐⭐⭐⭐⭐';
      case 'epic': return '⭐⭐⭐⭐';
      case 'rare': return '⭐⭐⭐';
      case 'common': return '⭐⭐';
      default: return '⭐';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Recent Achievements</Text>
          <Text style={styles.subtitle}>
            Keep up the great work! 🌟
          </Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Icon name="emoji-events" size={16} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.achievementsList}
      >
        {recentAchievements.map((achievement) => (
          <TouchableOpacity 
            key={achievement.id} 
            style={[
              styles.achievementItem,
              { backgroundColor: getRarityBg(achievement.rarity) }
            ]}
            activeOpacity={0.7}
          >
            {/* New badge */}
            {achievement.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW!</Text>
              </View>
            )}

            {/* Category and Rarity */}
            <View style={styles.achievementHeader}>
              <Text style={styles.categoryEmoji}>
                {getCategoryEmoji(achievement.category)}
              </Text>
              <View style={styles.raritySection}>
                <Text style={styles.rarityStars}>
                  {getRarityStars(achievement.rarity)}
                </Text>
                <Text style={[
                  styles.rarityText,
                  { color: getRarityColor(achievement.rarity) }
                ]}>
                  {achievement.rarity.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Achievement Icon */}
            <View style={[
              styles.achievementIcon,
              { backgroundColor: `${getRarityColor(achievement.rarity)}20` }
            ]}>
              <Icon 
                name={achievement.icon} 
                size={32} 
                color={getRarityColor(achievement.rarity)} 
              />
            </View>

            {/* Achievement Content */}
            <View style={styles.achievementContent}>
              <Text style={styles.achievementTitle} numberOfLines={2}>
                {achievement.title}
              </Text>
              <Text style={styles.achievementDescription} numberOfLines={3}>
                {achievement.description}
              </Text>
            </View>

            {/* Achievement Footer */}
            <View style={styles.achievementFooter}>
              <View style={styles.pointsSection}>
                <Icon name="star" size={14} color={COLORS.gold} />
                <Text style={styles.pointsText}>+{achievement.points}</Text>
              </View>
              <Text style={styles.unlockedAt}>{achievement.unlockedAt}</Text>
            </View>

            {/* Celebration Effect */}
            {achievement.isNew && (
              <View style={styles.celebrationOverlay}>
                <Text style={styles.celebrationText}>🎉</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Next Achievement Preview */}
        <View style={styles.nextAchievementItem}>
          <View style={styles.nextAchievementIcon}>
            <Icon name="lock" size={24} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.nextAchievementTitle}>Next Achievement</Text>
          <Text style={styles.nextAchievementDescription}>
            "Speed Learner"
          </Text>
          <Text style={styles.nextAchievementProgress}>
            Complete 10 lessons in 1 day
          </Text>
          <View style={styles.nextProgressBar}>
            <View style={[styles.nextProgressFill, { width: '70%' }]} />
          </View>
          <Text style={styles.nextProgressText}>7/10 lessons</Text>
        </View>
      </ScrollView>

      {/* Achievement Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Icon name="emoji-events" size={16} color={COLORS.gold} />
          <Text style={styles.statText}>12 total achievements</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="trending-up" size={16} color={COLORS.success} />
          <Text style={styles.statText}>3 this week</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="star" size={16} color={COLORS.primary} />
          <Text style={styles.statText}>1,250 total points</Text>
        </View>
      </View>

      {/* Islamic Motivation */}
      <View style={styles.islamicMotivation}>
        <Icon name="format-quote" size={14} color={COLORS.gold} />
        <Text style={styles.motivationText}>
          "And whoever does righteous deeds and believes, they will have no fear nor shall they grieve."
        </Text>
        <Text style={styles.motivationSource}>- Quran 2:62</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  achievementsList: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 16,
  },
  achievementItem: {
    width: 180,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
  },
  newBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  raritySection: {
    alignItems: 'flex-end',
  },
  rarityStars: {
    fontSize: 8,
    marginBottom: 1,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  achievementContent: {
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  achievementDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginLeft: 4,
  },
  unlockedAt: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  celebrationText: {
    fontSize: 20,
  },
  nextAchievementItem: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${COLORS.primary}30`,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  nextAchievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.textSecondary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextAchievementTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  nextAchievementDescription: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  nextAchievementProgress: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  nextProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: `${COLORS.primary}30`,
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  nextProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  nextProgressText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.textSecondary}20`,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  islamicMotivation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.lightGold,
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
  },
  motivationText: {
    flex: 1,
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.text,
    marginLeft: 6,
    marginRight: 6,
    lineHeight: 15,
  },
  motivationSource: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});