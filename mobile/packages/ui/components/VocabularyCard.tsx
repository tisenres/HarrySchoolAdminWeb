/**
 * Vocabulary Card Component - Harry School Design System
 * 
 * Interactive flashcard with flip animation for vocabulary learning
 * Features:
 * - Smooth flip animation between front and back
 * - Tap to flip functionality
 * - Audio pronunciation support
 * - Progress tracking visualization
 * - Accessibility support
 */

import React, { useState } from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

interface VocabularyCardProps {
  // Vocabulary data
  word: string;
  translation: string;
  pronunciation?: string;
  definition?: string;
  example?: string;
  exampleTranslation?: string;
  
  // Visual props
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  
  // Interaction props
  onFlip?: (isFlipped: boolean) => void;
  onWordLearned?: () => void;
  
  // State props
  isLearned?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  
  // Audio props
  onPlayAudio?: () => void;
  hasAudio?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const VocabularyCard: React.FC<VocabularyCardProps> = ({
  word,
  translation,
  pronunciation,
  definition,
  example,
  exampleTranslation,
  size = 'medium',
  style,
  onFlip,
  onWordLearned,
  isLearned = false,
  difficulty = 'medium',
  onPlayAudio,
  hasAudio = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Animation hooks
  const { frontAnimatedStyle, backAnimatedStyle, flip } = animations.educational.useCardFlip();
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = animations.button.usePress('light');
  const learnedStyle = animations.utility.useScale(isLearned);
  
  // Get card size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 120,
          height: 80,
          borderRadius: 8,
          padding: 12,
        };
      case 'medium':
        return {
          width: 160,
          height: 120,
          borderRadius: 12,
          padding: 16,
        };
      case 'large':
        return {
          width: 200,
          height: 160,
          borderRadius: 16,
          padding: 20,
        };
      default:
        return {
          width: 160,
          height: 120,
          borderRadius: 12,
          padding: 16,
        };
    }
  };
  
  // Get difficulty color
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy':
        return colors.educational.performance.excellent;
      case 'medium':
        return colors.educational.performance.good;
      case 'hard':
        return colors.educational.performance.needsWork;
      default:
        return colors.educational.performance.good;
    }
  };
  
  const sizeStyles = getSizeStyles();
  const difficultyColor = getDifficultyColor();
  
  const handleFlip = () => {
    flip();
    const newFlippedState = !isFlipped;
    setIsFlipped(newFlippedState);
    onFlip?.(newFlippedState);
  };
  
  const handleWordLearned = () => {
    onWordLearned?.();
  };
  
  const cardBaseStyle = {
    ...sizeStyles,
    backgroundColor: colors.background.primary,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: isLearned ? colors.semantic.success.main : difficultyColor,
  };
  
  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Front Side */}
      <AnimatedPressable
        style={[
          cardBaseStyle,
          frontAnimatedStyle,
          pressStyle,
          learnedStyle,
          {
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
        onPress={handleFlip}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {/* Difficulty Indicator */}
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: difficultyColor,
          }}
        />
        
        {/* Learned Indicator */}
        {isLearned && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.semantic.success.main,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.semantic.success.contrast, fontSize: 10 }}>✓</Text>
          </View>
        )}
        
        {/* Main Word */}
        <Text
          style={{
            fontSize: size === 'large' ? 24 : size === 'medium' ? 20 : 16,
            fontWeight: '700',
            color: colors.text.primary,
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          {word}
        </Text>
        
        {/* Pronunciation */}
        {pronunciation && (
          <Text
            style={{
              fontSize: size === 'large' ? 14 : size === 'medium' ? 12 : 10,
              color: colors.text.secondary,
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            /{pronunciation}/
          </Text>
        )}
        
        {/* Audio Button */}
        {hasAudio && onPlayAudio && (
          <Pressable
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.semantic.primary.main,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={onPlayAudio}
          >
            <Text style={{ color: colors.semantic.primary.contrast, fontSize: 12 }}>🔊</Text>
          </Pressable>
        )}
      </AnimatedPressable>
      
      {/* Back Side */}
      <AnimatedPressable
        style={[
          cardBaseStyle,
          backAnimatedStyle,
          pressStyle,
          learnedStyle,
          {
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.semantic.primary.light,
          },
        ]}
        onPress={handleFlip}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {/* Translation */}
        <Text
          style={{
            fontSize: size === 'large' ? 20 : size === 'medium' ? 16 : 14,
            fontWeight: '600',
            color: colors.text.primary,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {translation}
        </Text>
        
        {/* Definition */}
        {definition && (
          <Text
            style={{
              fontSize: size === 'large' ? 12 : size === 'medium' ? 10 : 8,
              color: colors.text.secondary,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            {definition}
          </Text>
        )}
        
        {/* Example */}
        {example && (
          <View style={{ marginTop: 4 }}>
            <Text
              style={{
                fontSize: size === 'large' ? 10 : size === 'medium' ? 9 : 8,
                color: colors.text.tertiary,
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              "{example}"
            </Text>
            {exampleTranslation && (
              <Text
                style={{
                  fontSize: size === 'large' ? 9 : size === 'medium' ? 8 : 7,
                  color: colors.text.tertiary,
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                "{exampleTranslation}"
              </Text>
            )}
          </View>
        )}
        
        {/* Mark as Learned Button */}
        {!isLearned && (
          <Pressable
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: colors.semantic.success.main,
            }}
            onPress={handleWordLearned}
          >
            <Text
              style={{
                color: colors.semantic.success.contrast,
                fontSize: 10,
                fontWeight: '600',
              }}
            >
              Learned
            </Text>
          </Pressable>
        )}
      </AnimatedPressable>
    </View>
  );
};

export default VocabularyCard;