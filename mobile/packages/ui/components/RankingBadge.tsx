/**
 * Ranking Badge Component - Harry School Design System
 * 
 * Animated ranking badge with celebration animations for student achievements
 * Features:
 * - Position-based styling (1st, 2nd, 3rd, etc.)
 * - Celebration animation on rank improvement
 * - Glow effects for top positions
 * - Point display with count-up animation
 * - Accessibility support
 */

import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

interface RankingBadgeProps {
  // Ranking data
  position: number;
  points: number;
  previousPosition?: number;
  
  // Display options
  size?: 'small' | 'medium' | 'large';
  showPoints?: boolean;
  showPosition?: boolean;
  
  // Animation triggers
  triggerCelebration?: boolean;
  
  // Style props
  style?: ViewStyle;
  
  // Student info
  studentName?: string;
  avatar?: React.ReactNode;
}

export const RankingBadge: React.FC<RankingBadgeProps> = ({
  position,
  points,
  previousPosition,
  size = 'medium',
  showPoints = true,
  showPosition = true,
  triggerCelebration = false,
  style,
  studentName,
  avatar,
}) => {
  // Animation hooks
  const { animatedStyle: celebrationStyle, celebrate } = animations.educational.useRankingCelebration();
  const { animatedStyle: pointStyle, earnPoints, pointCount } = animations.engagement.usePointEarning(points);
  
  // Trigger celebration when position improves
  useEffect(() => {
    if (triggerCelebration || (previousPosition && position < previousPosition)) {
      celebrate();
      earnPoints();
    }
  }, [triggerCelebration, position, previousPosition, celebrate, earnPoints]);
  
  // Get position styling
  const getPositionStyling = () => {
    if (position === 1) {
      return {
        backgroundColor: colors.ranking.gold,
        borderColor: colors.withOpacity(colors.ranking.gold, 0.3),
        textColor: colors.text.inverse,
        shadowColor: colors.ranking.gold,
        emoji: '🥇',
      };
    } else if (position === 2) {
      return {
        backgroundColor: colors.ranking.silver,
        borderColor: colors.withOpacity(colors.ranking.silver, 0.3),
        textColor: colors.text.inverse,
        shadowColor: colors.ranking.silver,
        emoji: '🥈',
      };
    } else if (position === 3) {
      return {
        backgroundColor: colors.ranking.bronze,
        borderColor: colors.withOpacity(colors.ranking.bronze, 0.3),
        textColor: colors.text.inverse,
        shadowColor: colors.ranking.bronze,
        emoji: '🥉',
      };
    } else if (position <= 10) {
      return {
        backgroundColor: colors.semantic.primary.main,
        borderColor: colors.withOpacity(colors.semantic.primary.main, 0.3),
        textColor: colors.semantic.primary.contrast,
        shadowColor: colors.semantic.primary.main,
        emoji: '⭐',
      };
    } else {
      return {
        backgroundColor: colors.neutral[600],
        borderColor: colors.withOpacity(colors.neutral[600], 0.3),
        textColor: colors.text.inverse,
        shadowColor: colors.neutral[600],
        emoji: '📍',
      };
    }
  };
  
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 60,
          height: 60,
          borderRadius: 30,
          borderWidth: 2,
          fontSize: 12,
          emojiSize: 16,
          pointSize: 10,
        };
      case 'medium':
        return {
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 3,
          fontSize: 16,
          emojiSize: 20,
          pointSize: 12,
        };
      case 'large':
        return {
          width: 100,
          height: 100,
          borderRadius: 50,
          borderWidth: 4,
          fontSize: 20,
          emojiSize: 24,
          pointSize: 14,
        };
      default:
        return {
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 3,
          fontSize: 16,
          emojiSize: 20,
          pointSize: 12,
        };
    }
  };
  
  const positionStyling = getPositionStyling();
  const sizeStyles = getSizeStyles();
  
  // Format position display
  const getPositionText = () => {
    if (position === 1) return '1st';
    if (position === 2) return '2nd';
    if (position === 3) return '3rd';
    return `${position}th`;
  };
  
  // Format points display
  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };
  
  return (
    <View style={[{ alignItems: 'center' }, style]}>
      {/* Student Name */}
      {studentName && (
        <Text
          style={{
            fontSize: sizeStyles.pointSize,
            fontWeight: '500',
            color: colors.text.secondary,
            marginBottom: 4,
            textAlign: 'center',
          }}
        >
          {studentName}
        </Text>
      )}
      
      {/* Main Badge */}
      <Animated.View
        style={[
          celebrationStyle,
          pointStyle,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.borderRadius,
            backgroundColor: positionStyling.backgroundColor,
            borderWidth: sizeStyles.borderWidth,
            borderColor: positionStyling.borderColor,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: positionStyling.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: position <= 3 ? 0.3 : 0.1,
            shadowRadius: position <= 3 ? 8 : 4,
            elevation: position <= 3 ? 8 : 4,
          },
        ]}
      >
        {/* Avatar or Emoji */}
        {avatar || (
          <Text style={{ fontSize: sizeStyles.emojiSize }}>
            {positionStyling.emoji}
          </Text>
        )}
        
        {/* Position Text */}
        {showPosition && (
          <Text
            style={{
              fontSize: sizeStyles.fontSize,
              fontWeight: '700',
              color: positionStyling.textColor,
              marginTop: 2,
            }}
          >
            {getPositionText()}
          </Text>
        )}
      </Animated.View>
      
      {/* Points Display */}
      {showPoints && (
        <View
          style={{
            marginTop: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
            backgroundColor: colors.withOpacity(positionStyling.backgroundColor, 0.1),
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.withOpacity(positionStyling.backgroundColor, 0.2),
          }}
        >
          <Text
            style={{
              fontSize: sizeStyles.pointSize,
              fontWeight: '600',
              color: positionStyling.backgroundColor,
              textAlign: 'center',
            }}
          >
            {formatPoints(points)} pts
          </Text>
        </View>
      )}
      
      {/* Position Change Indicator */}
      {previousPosition && previousPosition !== position && (
        <View
          style={{
            marginTop: 2,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: sizeStyles.pointSize - 2,
              color: position < previousPosition ? colors.semantic.success.main : colors.semantic.error.main,
            }}
          >
            {position < previousPosition ? '▲' : '▼'}
          </Text>
          <Text
            style={{
              fontSize: sizeStyles.pointSize - 2,
              fontWeight: '500',
              color: position < previousPosition ? colors.semantic.success.main : colors.semantic.error.main,
              marginLeft: 2,
            }}
          >
            {Math.abs(position - previousPosition)}
          </Text>
        </View>
      )}
    </View>
  );
};

export default RankingBadge;