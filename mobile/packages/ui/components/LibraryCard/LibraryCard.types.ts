/**
 * LibraryCard Component Types
 * Harry School Mobile Design System
 */

import { ViewStyle, ImageSourcePropType } from 'react-native';

export type LibraryItemType = 'lesson' | 'exercise' | 'quiz' | 'video' | 'audio' | 'document';

export type LibraryDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type LibrarySize = 'small' | 'default' | 'large';

export interface LibraryProgress {
  current: number;
  total: number;
}

export interface LibraryCardProps {
  /** Content title */
  title: string;
  
  /** Content subtitle */
  subtitle?: string;
  
  /** Content description */
  description?: string;
  
  /** Content type */
  type?: LibraryItemType;
  
  /** Difficulty level */
  difficulty?: LibraryDifficulty;
  
  /** Content duration */
  duration?: string;
  
  /** Progress information */
  progress?: LibraryProgress;
  
  /** Thumbnail image */
  thumbnail?: ImageSourcePropType;
  
  /** Whether content is locked */
  isLocked?: boolean;
  
  /** Whether content is completed */
  isCompleted?: boolean;
  
  /** Whether content is favorited */
  isFavorite?: boolean;
  
  /** Content tags */
  tags?: string[];
  
  /** Content rating (0-5) */
  rating?: number;
  
  /** Press handler */
  onPress?: () => void;
  
  /** Favorite toggle handler */
  onFavoritePress?: () => void;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Card size */
  size?: LibrarySize;
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface LibraryCardStyles {
  container: ViewStyle;
  thumbnailContainer: ViewStyle;
  thumbnail: ViewStyle;
  thumbnailPlaceholder: ViewStyle;
  thumbnailIcon: ViewStyle;
  overlay: ViewStyle;
  lockContainer: ViewStyle;
  lockIcon: ViewStyle;
  favoriteButton: ViewStyle;
  favoriteIcon: ViewStyle;
  completedContainer: ViewStyle;
  completedIcon: ViewStyle;
  typeBadge: ViewStyle;
  typeBadgeText: ViewStyle;
  difficultyBadge: ViewStyle;
  difficultyBadgeText: ViewStyle;
  content: ViewStyle;
  title: ViewStyle;
  subtitle: ViewStyle;
  description: ViewStyle;
  footer: ViewStyle;
  duration: ViewStyle;
  ratingContainer: ViewStyle;
  ratingStars: ViewStyle;
  ratingText: ViewStyle;
  tagsContainer: ViewStyle;
  tag: ViewStyle;
  tagText: ViewStyle;
  progressContainer: ViewStyle;
  progressBackground: ViewStyle;
  progressFill: ViewStyle;
  progressText: ViewStyle;
}