// Export all ranking components for easy importing
export { StudentRankingOverview } from './student-ranking-overview'
export { PointsTransactionHistory } from './points-transaction-history'
export { AchievementGallery } from './achievement-gallery'
export { QuickPointAward } from './quick-point-award'
export { StudentRankingTab } from './student-ranking-tab'

// Export types
export type {
  StudentRanking,
  PointsTransaction,
  StudentAchievement,
  Achievement,
  PointsAwardRequest,
  AchievementAwardRequest,
  RankingAnalytics,
  RankingFilters,
  RankingSortConfig,
  StudentWithRanking,
  RewardsCatalogItem,
  RewardRedemption
} from '@/types/ranking'