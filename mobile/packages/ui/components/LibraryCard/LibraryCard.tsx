/**
 * LibraryCard Component
 * Harry School Mobile Design System
 * 
 * Content cards for library items with progress tracking and interactions
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Platform,
  HapticFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { LibraryCardProps, LibraryItemType, LibraryDifficulty } from './LibraryCard.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LibraryCard: React.FC<LibraryCardProps> = ({
  title,
  subtitle,
  description,
  type = 'lesson',
  difficulty = 'intermediate',
  duration,
  progress,
  thumbnail,
  isLocked = false,
  isCompleted = false,
  isFavorite = false,
  tags = [],
  rating,
  onPress,
  onFavoritePress,
  enableHaptics = true,
  theme = 'dark',
  size = 'default',
  style,
  testID = 'library-card',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const scale = useSharedValue(1);
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    backgroundSecondary: theme === 'dark' ? '#3a3a3a' : tokens.colors.background.secondary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    border: theme === 'dark' ? '#4a4a4a' : tokens.colors.border.light,
    accent: '#1d7452',
    gold: '#fbbf24',
  }), [theme, tokens]);
  
  const sizeConfig = useMemo(() => ({
    small: { width: 160, height: 120 },
    default: { width: 200, height: 160 },
    large: { width: 240, height: 200 },
  }), []);
  
  const config = sizeConfig[size];
  
  const typeConfig = useMemo(() => ({
    lesson: { icon: '📚', color: '#3b82f6' },
    exercise: { icon: '✏️', color: '#f59e0b' },
    quiz: { icon: '📝', color: '#ef4444' },
    video: { icon: '🎥', color: '#8b5cf6' },
    audio: { icon: '🎧', color: '#10b981' },
    document: { icon: '📄', color: '#6b7280' },
  }), []);
  
  const difficultyConfig = useMemo(() => ({
    beginner: { color: '#10b981', label: 'Beginner' },
    intermediate: { color: '#f59e0b', label: 'Intermediate' },
    advanced: { color: '#ef4444', label: 'Advanced' },
  }), []);
  
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [enableHaptics]);
  
  const handlePress = useCallback(() => {
    if (isLocked) return;
    
    triggerHaptic();
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    });
    onPress?.();
  }, [isLocked, triggerHaptic, scale, onPress]);
  
  const handleFavoritePress = useCallback(() => {
    if (isLocked) return;
    
    triggerHaptic();
    onFavoritePress?.();
  }, [isLocked, triggerHaptic, onFavoritePress]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isLocked ? 0.6 : 1,
  }));
  
  const currentType = typeConfig[type];
  const currentDifficulty = difficultyConfig[difficulty];
  
  const renderThumbnail = () => {
    if (!thumbnail) {
      return (
        <View style={[styles.thumbnailPlaceholder, { backgroundColor: currentType.color }]}>
          <Text style={styles.thumbnailIcon}>{currentType.icon}</Text>
        </View>
      );
    }
    
    return (
      <Image
        source={thumbnail}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    );
  };
  
  const renderProgress = () => {
    if (!progress) return null;
    
    const percentage = Math.min((progress.current / progress.total) * 100, 100);
    
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { backgroundColor: themeColors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: themeColors.accent,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
    );
  };
  
  const renderTags = () => {
    if (tags.length === 0) return null;
    
    return (
      <View style={styles.tagsContainer}>
        {tags.slice(0, 2).map((tag, index) => (
          <View
            key={index}
            style={[
              styles.tag,
              { backgroundColor: `${themeColors.accent}20` },
            ]}
          >
            <Text style={[styles.tagText, { color: themeColors.accent }]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  const renderRating = () => {
    if (!rating) return null;
    
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingStars}>⭐</Text>
        <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>
          {rating.toFixed(1)}
        </Text>
      </View>
    );
  };
  
  return (
    <AnimatedPressable
      style={[
        styles.container,
        {
          width: config.width,
          height: config.height,
          backgroundColor: themeColors.background,
          borderColor: themeColors.border,
        },
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      disabled={isLocked}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`}
      accessibilityHint={isLocked ? 'This content is locked' : 'Double tap to open'}
      accessibilityState={{ disabled: isLocked }}
      testID={testID}
    >
      {/* Thumbnail section */}
      <View style={styles.thumbnailContainer}>
        {renderThumbnail()}
        
        {/* Overlay elements */}
        <View style={styles.overlay}>
          {/* Lock indicator */}
          {isLocked && (
            <View style={styles.lockContainer}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
          
          {/* Favorite button */}
          <Pressable
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${isFavorite ? 'Remove from' : 'Add to'} favorites`}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </Pressable>
          
          {/* Completion indicator */}
          {isCompleted && (
            <View style={styles.completedContainer}>
              <Text style={styles.completedIcon}>✅</Text>
            </View>
          )}
        </View>
        
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: currentType.color }]}>
          <Text style={styles.typeBadgeText}>{type.toUpperCase()}</Text>
        </View>
        
        {/* Difficulty badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: currentDifficulty.color }]}>
          <Text style={styles.difficultyBadgeText}>{currentDifficulty.label}</Text>
        </View>
      </View>
      
      {/* Content section */}
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: themeColors.text }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: themeColors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
        
        {description && (
          <Text
            style={[styles.description, { color: themeColors.textSecondary }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}
        
        {/* Footer info */}
        <View style={styles.footer}>
          {duration && (
            <Text style={[styles.duration, { color: themeColors.textSecondary }]}>
              ⏱️ {duration}
            </Text>
          )}
          {renderRating()}
        </View>
        
        {renderTags()}
        {renderProgress()}
      </View>
    </AnimatedPressable>
  );
};

const styles = {
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden' as const,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    margin: 8,
  },
  thumbnailContainer: {
    height: '60%',
    position: 'relative' as const,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  thumbnailIcon: {
    fontSize: 32,
  },
  overlay: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  lockContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  lockIcon: {
    fontSize: 16,
  },
  favoriteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 16,
  },
  completedContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  completedIcon: {
    fontSize: 16,
  },
  typeBadge: {
    position: 'absolute' as const,
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
  difficultyBadge: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
  content: {
    padding: 12,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 12,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  duration: {
    fontSize: 10,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  ratingStars: {
    fontSize: 10,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row' as const,
    gap: 4,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 9,
    fontWeight: '600',
    minWidth: 24,
  },
};

LibraryCard.displayName = 'LibraryCard';

export default LibraryCard;