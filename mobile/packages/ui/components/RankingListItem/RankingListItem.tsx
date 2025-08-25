/**
 * RankingListItem Component
 * Harry School Mobile Design System
 * 
 * Individual ranking row with position, avatar, stats, and animations
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Platform,
  HapticFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { RankingListItemProps, RankingPosition } from './RankingListItem.types';

export const RankingListItem: React.FC<RankingListItemProps> = ({
  position,
  user,
  score,
  change,
  isCurrentUser = false,
  showAvatar = true,
  showChange = true,
  showScore = true,
  animationDelay = 0,
  enableHaptics = true,
  theme = 'dark',
  testID = 'ranking-list-item',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const changeScale = useSharedValue(0);
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    backgroundSecondary: theme === 'dark' ? '#3a3a3a' : tokens.colors.background.secondary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    border: theme === 'dark' ? '#4a4a4a' : tokens.colors.border.light,
    accent: '#1d7452',
    gold: '#fbbf24',
    silver: '#c0c0c0',
    bronze: '#cd7f32',
  }), [theme, tokens]);
  
  // Entry animation
  useEffect(() => {
    opacity.value = withDelay(
      animationDelay,
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    scale.value = withDelay(
      animationDelay,
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  }, [animationDelay, opacity, scale]);
  
  // Change indicator animation
  useEffect(() => {
    if (change && change !== 0) {
      changeScale.value = withDelay(
        animationDelay + 200,
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  }, [change, animationDelay, changeScale]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {
        scale: interpolate(
          scale.value,
          [0, 1],
          [0.9, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));
  
  const changeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: changeScale.value }],
    opacity: changeScale.value,
  }));
  
  const getPositionConfig = (pos: number): RankingPosition => {
    switch (pos) {
      case 1:
        return {
          color: themeColors.gold,
          icon: '👑',
          gradient: [themeColors.gold, '#f59e0b'],
          textColor: '#000000',
        };
      case 2:
        return {
          color: themeColors.silver,
          icon: '🥈',
          gradient: [themeColors.silver, '#9ca3af'],
          textColor: '#000000',
        };
      case 3:
        return {
          color: themeColors.bronze,
          icon: '🥉',
          gradient: [themeColors.bronze, '#ea580c'],
          textColor: '#ffffff',
        };
      default:
        return {
          color: themeColors.textSecondary,
          icon: '',
          gradient: ['transparent', 'transparent'],
          textColor: themeColors.text,
        };
    }
  };
  
  const positionConfig = getPositionConfig(position);
  
  const formatScore = (score: number) => {
    if (score >= 1000000) {
      return `${(score / 1000000).toFixed(1)}M`;
    }
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toLocaleString();
  };
  
  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };
  
  const getChangeColor = (change: number) => {
    if (change > 0) return '#10b981';
    if (change < 0) return '#ef4444';
    return themeColors.textSecondary;
  };
  
  const renderPositionBadge = () => {
    if (position <= 3) {
      return (
        <LinearGradient
          colors={positionConfig.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topPositionBadge}
        >
          <Text style={[styles.topPositionIcon, { color: positionConfig.textColor }]}>
            {positionConfig.icon}
          </Text>
          <Text style={[styles.topPositionText, { color: positionConfig.textColor }]}>
            {position}
          </Text>
        </LinearGradient>
      );
    }
    
    return (
      <View style={[styles.positionBadge, { backgroundColor: themeColors.backgroundSecondary }]}>
        <Text style={[styles.positionText, { color: themeColors.text }]}>
          {position}
        </Text>
      </View>
    );
  };
  
  const renderAvatar = () => {
    if (!showAvatar) return null;
    
    return (
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: user.avatar }}
          style={styles.avatar}
          defaultSource={require('./default-avatar.png')}
        />
        {/* Online status */}
        {user.isOnline && (
          <View style={[styles.onlineIndicator, { backgroundColor: '#10b981' }]} />
        )}
      </View>
    );
  };
  
  const renderChangeIndicator = () => {
    if (!showChange || !change || change === 0) return null;
    
    return (
      <Animated.View
        style={[
          styles.changeContainer,
          { backgroundColor: `${getChangeColor(change)}20` },
          changeAnimatedStyle,
        ]}
      >
        <Text style={[styles.changeIcon, { color: getChangeColor(change) }]}>
          {getChangeIcon(change)}
        </Text>
        <Text style={[styles.changeText, { color: getChangeColor(change) }]}>
          {Math.abs(change)}
        </Text>
      </Animated.View>
    );
  };
  
  const containerStyle = [
    styles.container,
    {
      backgroundColor: isCurrentUser ? `${themeColors.accent}20` : themeColors.background,
      borderColor: isCurrentUser ? themeColors.accent : themeColors.border,
      borderWidth: isCurrentUser ? 2 : 1,
    },
  ];
  
  return (
    <Animated.View
      style={[containerStyle, animatedStyle]}
      testID={testID}
    >
      {/* Position badge */}
      {renderPositionBadge()}
      
      {/* Avatar */}
      {renderAvatar()}
      
      {/* User info */}
      <View style={styles.userInfo}>
        <Text
          style={[
            styles.userName,
            {
              color: themeColors.text,
              fontWeight: isCurrentUser ? '700' : '600',
            },
          ]}
          numberOfLines={1}
        >
          {user.name}
        </Text>
        {user.level && (
          <Text style={[styles.userLevel, { color: themeColors.textSecondary }]}>
            Level {user.level}
          </Text>
        )}
      </View>
      
      {/* Score */}
      {showScore && (
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: themeColors.text }]}>
            {formatScore(score)}
          </Text>
          <Text style={[styles.scoreLabel, { color: themeColors.textSecondary }]}>
            points
          </Text>
        </View>
      )}
      
      {/* Change indicator */}
      {renderChangeIndicator()}
      
      {/* Current user indicator */}
      {isCurrentUser && (
        <View style={[styles.currentUserIndicator, { backgroundColor: themeColors.accent }]}>
          <Text style={styles.currentUserText}>YOU</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    position: 'relative' as const,
  },
  topPositionBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  topPositionIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  topPositionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  positionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  positionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  avatarContainer: {
    position: 'relative' as const,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  userLevel: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end' as const,
    marginRight: 8,
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  changeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  changeIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  currentUserIndicator: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentUserText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
};

RankingListItem.displayName = 'RankingListItem';

export default RankingListItem;