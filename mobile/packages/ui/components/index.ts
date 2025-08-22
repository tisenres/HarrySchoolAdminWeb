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

// New Student App Components
export { default as DashboardHeader } from './DashboardHeader/DashboardHeader';
export { default as EventCard } from './EventCard/EventCard';
export { default as EventCardsSlider } from './EventCardsSlider/EventCardsSlider';
export { default as StatsCard } from './StatsCard/StatsCard';
export { default as ActionCard } from './ActionCard/ActionCard';
export { default as TabNavigation } from './TabNavigation/TabNavigation';
export { default as ProfileSettings } from './ProfileSettings/ProfileSettings';
export { default as CoinsScoresHistory } from './CoinsScoresHistory/CoinsScoresHistory';
export { default as LibraryCard } from './LibraryCard/LibraryCard';
export { default as ServiceCard } from './ServiceCard/ServiceCard';
export { default as RankingListItem } from './RankingListItem/RankingListItem';
export { default as RankingList } from './RankingList/RankingList';

// Export types for new components
export type { DashboardHeaderProps, User, CustomAction, NotificationBadgeProps } from './DashboardHeader/DashboardHeader.types';
export type { EventCardProps, EventStatus, EventType, EventPriority, EventSize } from './EventCard/EventCard.types';
export type { EventCardsSliderProps, EventData, ScrollIndicatorProps } from './EventCardsSlider/EventCardsSlider.types';
export type { StatsCardProps, StatItem, TrendDirection, StatsLayout, StatsVariant } from './StatsCard/StatsCard.types';
export type { ActionCardProps, ActionSize, ActionVariant, ActionBadge } from './ActionCard/ActionCard.types';
export type { TabNavigationProps, TabItem, TabBadge, TabVariant } from './TabNavigation/TabNavigation.types';
export type { ProfileSettingsProps, SettingItem, SettingSection, SettingType } from './ProfileSettings/ProfileSettings.types';
export type { CoinsScoresHistoryProps, HistoryItem, HistoryType } from './CoinsScoresHistory/CoinsScoresHistory.types';
export type { LibraryCardProps, LibraryItemType, LibraryDifficulty, LibrarySize, LibraryProgress } from './LibraryCard/LibraryCard.types';
export type { ServiceCardProps, ServiceVariant } from './ServiceCard/ServiceCard.types';
export type { RankingListItemProps, RankingUser, RankingPosition } from './RankingListItem/RankingListItem.types';
export type { RankingListProps, RankingData, RankingFilter, RankingPeriod } from './RankingList/RankingList.types';