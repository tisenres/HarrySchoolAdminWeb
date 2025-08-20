/**
 * Achievement Badge Component - Harry School Design System
 * 
 * Celebration badge for student achievements and milestones
 * Features:
 * - Dramatic unlock animations with particles
 * - Progress-based glow effects
 * - Educational milestone celebrations
 * - Configurable celebration intensity
 */

import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

type AchievementType = 'lesson' | 'streak' | 'perfect' | 'level' | 'vocabulary' | 'first_time';

interface AchievementBadgeProps {
  // Achievement data
  type: AchievementType;
  title: string;
  description?: string;
  icon?: string;
  
  // Progress and state
  isUnlocked: boolean;
  isNew?: boolean;
  progress?: number; // 0-100 for partial achievements
  
  // Visual customization
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  
  // Animation triggers
  triggerUnlock?: boolean;
  onUnlockComplete?: () => void;
  
  // Celebration intensity
  celebrationLevel?: 'subtle' | 'standard' | 'dramatic';
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  type,
  title,
  description,
  icon,
  isUnlocked,
  isNew = false,
  progress = 0,
  size = 'medium',
  style,
  triggerUnlock = false,
  onUnlockComplete,
  celebrationLevel = 'standard',
}) => {
  // Animation hooks based on achievement type and celebration level
  const { animatedStyle: unlockStyle, unlock } = animations.educational.useAchievementUnlock();
  const { animatedStyle: firstTimeStyle, unlockFirstTime } = animations.milestone.useFirstTimeAchievement();
  const { animatedStyle: perfectStyle, celebratePerfectScore } = animations.milestone.usePerfectScore();
  const { animatedStyle: lessonStyle, completLesson } = animations.milestone.useLessonCompletion();
  const progressStyle = animations.educational.useProgressBar(progress);
  const newBadgeStyle = animations.utility.useFade(isNew);
  
  // Get achievement colors and styling
  const getAchievementConfig = () => {
    switch (type) {
      case 'lesson':
        return {
          primaryColor: colors.educational.performance.excellent,
          secondaryColor: colors.educational.level.advanced,
          backgroundColor: colors.educational.performance.excellent + '20',
          defaultIcon: '📚',
        };
      case 'streak':
        return {
          primaryColor: colors.semantic.warning.main,
          secondaryColor: colors.semantic.warning.light,
          backgroundColor: colors.semantic.warning.main + '20',
          defaultIcon: '🔥',
        };
      case 'perfect':
        return {
          primaryColor: colors.semantic.success.main,
          secondaryColor: colors.educational.performance.excellent,
          backgroundColor: colors.semantic.success.main + '20',
          defaultIcon: '⭐',
        };
      case 'level':
        return {
          primaryColor: colors.educational.level.advanced,
          secondaryColor: colors.educational.level.expert,
          backgroundColor: colors.educational.level.advanced + '20',
          defaultIcon: '🎯',
        };
      case 'vocabulary':
        return {
          primaryColor: colors.educational.vocabulary.learned,
          secondaryColor: colors.educational.vocabulary.practicing,
          backgroundColor: colors.educational.vocabulary.learned + '20',
          defaultIcon: '💭',
        };
      case 'first_time':
        return {
          primaryColor: '#FFD700',
          secondaryColor: '#FFA500',
          backgroundColor: '#FFD70020',
          defaultIcon: '🏆',
        };
      default:
        return {
          primaryColor: colors.semantic.primary.main,
          secondaryColor: colors.semantic.primary.light,
          backgroundColor: colors.semantic.primary.main + '20',
          defaultIcon: '🎉',
        };
    }
  };
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 60,
          height: 60,
          borderRadius: 12,
          iconSize: 20,
          titleSize: 10,
          descriptionSize: 8,
        };
      case 'medium':
        return {
          width: 80,
          height: 80,
          borderRadius: 16,
          iconSize: 28,
          titleSize: 12,
          descriptionSize: 10,
        };
      case 'large':
        return {
          width: 120,
          height: 120,
          borderRadius: 24,
          iconSize: 40,
          titleSize: 14,
          descriptionSize: 11,
        };
      default:
        return {
          width: 80,
          height: 80,
          borderRadius: 16,
          iconSize: 28,
          titleSize: 12,
          descriptionSize: 10,
        };
    }
  };
  
  const config = getAchievementConfig();
  const sizeStyles = getSizeStyles();
  
  // Trigger appropriate animation when unlocking
  useEffect(() => {
    if (triggerUnlock && isUnlocked) {
      switch (celebrationLevel) {
        case 'subtle':
          unlock();
          break;
        case 'dramatic':
          if (type === 'first_time') {
            unlockFirstTime();
          } else if (type === 'perfect') {
            celebratePerfectScore();
          } else if (type === 'lesson') {
            completLesson();
          } else {
            unlock();
          }
          break;
        default:
          unlock();
      }
      
      // Call completion callback after animation
      const timer = setTimeout(() => {
        onUnlockComplete?.();
      }, animations.timings.celebration);
      
      return () => clearTimeout(timer);
    }
  }, [triggerUnlock, isUnlocked, celebrationLevel, type]);
  
  // Select the appropriate animated style based on type and celebration level
  const getAnimatedStyles = () => {
    const baseStyles = [unlockStyle];
    
    if (celebrationLevel === 'dramatic') {
      switch (type) {
        case 'first_time':
          baseStyles.push(firstTimeStyle);
          break;
        case 'perfect':
          baseStyles.push(perfectStyle);
          break;
        case 'lesson':
          baseStyles.push(lessonStyle);
          break;
      }
    }
    
    if (isNew) {
      baseStyles.push(newBadgeStyle);
    }
    
    return baseStyles;
  };
  
  return (
    <View style={[style]}>
      <Animated.View
        style={[
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.borderRadius,
            backgroundColor: isUnlocked ? config.backgroundColor : colors.neutral[100],
            borderWidth: 2,
            borderColor: isUnlocked ? config.primaryColor : colors.neutral[300],
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: isUnlocked ? config.primaryColor : colors.neutral[400],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isUnlocked ? 0.3 : 0.1,
            shadowRadius: isUnlocked ? 8 : 4,
            elevation: isUnlocked ? 8 : 4,
            opacity: isUnlocked ? 1 : 0.6,
          },
          ...getAnimatedStyles(),
        ]}
      >
        {/* Progress Ring for Partial Achievements */}
        {!isUnlocked && progress > 0 && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: sizeStyles.borderRadius + 2,
                borderWidth: 3,
                borderColor: 'transparent',
                borderTopColor: config.primaryColor,
              },
              progressStyle,
            ]}
          />
        )}
        
        {/* Achievement Icon */}
        <Text
          style={{
            fontSize: sizeStyles.iconSize,
            marginBottom: size !== 'small' ? 4 : 2,
            opacity: isUnlocked ? 1 : 0.5,
          }}
        >
          {icon || config.defaultIcon}
        </Text>
        
        {/* Achievement Title */}
        <Text
          style={{
            fontSize: sizeStyles.titleSize,
            fontWeight: '600',
            color: isUnlocked ? colors.text.primary : colors.text.secondary,
            textAlign: 'center',
            marginHorizontal: 4,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>
        
        {/* Achievement Description */}
        {description && size !== 'small' && (
          <Text
            style={{
              fontSize: sizeStyles.descriptionSize,
              color: colors.text.tertiary,
              textAlign: 'center',
              marginHorizontal: 4,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}
        
        {/* New Badge Indicator */}
        {isNew && isUnlocked && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: colors.semantic.error.main,
                justifyContent: 'center',
                alignItems: 'center',
              },
              newBadgeStyle,
            ]}
          >
            <Text
              style={{
                fontSize: 8,
                color: colors.semantic.error.contrast,
                fontWeight: '700',
              }}
            >
              !
            </Text>
          </Animated.View>
        )}
        
        {/* Progress Percentage for Partial Achievements */}
        {!isUnlocked && progress > 0 && size !== 'small' && (
          <View
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              paddingHorizontal: 4,
              paddingVertical: 1,
              borderRadius: 6,
              backgroundColor: config.primaryColor,
            }}
          >
            <Text
              style={{
                fontSize: 8,
                color: colors.neutral[50],
                fontWeight: '600',
              }}
            >
              {Math.round(progress)}%
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default AchievementBadge;