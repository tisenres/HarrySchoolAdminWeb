// Base Components
export { default as Button } from './Button/Button';
export { default as Card } from './Card/Card';
export { default as Input } from './Input/Input';
export { default as Avatar } from './Avatar/Avatar';
export { default as Badge } from './Badge/Badge';
export { default as TabBar } from './TabBar/TabBar';
export { default as Header } from './Header/Header';
export { default as Modal } from './Modal';
export { default as LoadingScreen } from './LoadingScreen';
export { default as EmptyState } from './EmptyState';

// Export types for the new components
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonState } from './Button/Button.types';
export type { CardProps, CardVariant, CardSize, SyncStatus } from './Card/Card.types';
export type { InputProps, InputVariant, InputType, InputState, ValidationRule } from './Input/Input.types';
export type { AvatarProps, AvatarSize, UserStatus, UserRole } from './Avatar/Avatar.types';
export type { BadgeProps, BadgeType, BadgeVariant, BadgePosition, AchievementType, StatusType } from './Badge/Badge.types';
export type { TabBarProps, TabBarVariant, TabItem, TEACHER_TABS, STUDENT_TABS } from './TabBar/TabBar.types';
export type { HeaderProps, HeaderVariant, HeaderAction, SyncStatus as HeaderSyncStatus, HEADER_HEIGHTS } from './Header/Header.types';
export type { ModalProps, ModalSize, ModalType, ModalPosition, ModalAction, CelebrationConfig } from './Modal.types';
export type { LoadingScreenProps, LoadingType, EducationalContent, ProgressConfig, SkeletonConfig } from './LoadingScreen.types';
export type { EmptyStateProps, EmptyStateVariant, EmptyStateSize, EmptyStateAction, EducationalContext } from './EmptyState.types';

// Animated Components
export { AnimatedButton } from './AnimatedButton';
export { VocabularyCard } from './VocabularyCard';
export { ProgressBar } from './ProgressBar';
export { RankingBadge } from './RankingBadge';
export { AnimatedTabBar } from './AnimatedTabBar';

// Educational Micro-Interaction Components
export { AttendanceButton } from './AttendanceButton';
export { AchievementBadge } from './AchievementBadge';
export { PointsCounter } from './PointsCounter';
export { LoadingSpinner } from './LoadingSpinner';
export { QuickActionButton } from './QuickActionButton';