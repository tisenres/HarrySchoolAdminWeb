# Mobile Architecture: Harry School CRM Ranking and Rewards System
Agent: mobile-developer
Date: 2025-08-20

## Executive Summary

This comprehensive mobile architecture document designs a culturally-sensitive, age-adaptive ranking and rewards system for the Harry School CRM Student app. Based on extensive UX research findings and behavioral psychology principles, this architecture implements multiple ranking dimensions, real-time leaderboard updates, variable reward schedules, and celebration animations that honor Islamic values and Uzbek traditions while promoting healthy competition and intrinsic motivation.

**Key Architectural Decisions:**
- **Multi-dimensional ranking system** with academic, effort, collaboration, and creativity metrics
- **Age-adaptive interfaces** with distinct experiences for 10-12, 13-15, and 16-18 age groups  
- **Real-time updates** with optimal 2-3x daily frequency using Supabase subscriptions
- **Cultural celebration system** integrating Islamic calendar events and Uzbek traditions
- **Variable reward schedules** based on behavioral psychology for sustained engagement
- **Offline-first architecture** with intelligent sync and conflict resolution

## Architecture Overview

### App Structure
```
mobile/
├── apps/student/src/
│   ├── screens/
│   │   ├── ranking/
│   │   │   ├── LeaderboardScreen.tsx
│   │   │   ├── RankingDetailScreen.tsx
│   │   │   └── PersonalStatsScreen.tsx
│   │   ├── rewards/
│   │   │   ├── RewardsCatalogScreen.tsx
│   │   │   ├── RewardDetailScreen.tsx
│   │   │   ├── CoinHistoryScreen.tsx
│   │   │   └── RedemptionScreen.tsx
│   │   └── achievements/
│   │       ├── AchievementsScreen.tsx
│   │       ├── BadgeDetailScreen.tsx
│   │       └── CelebrationScreen.tsx
│   ├── components/
│   │   ├── ranking/
│   │   │   ├── LeaderboardCard.tsx
│   │   │   ├── RankingCard.tsx (existing - enhanced)
│   │   │   ├── PrivacyToggle.tsx
│   │   │   ├── MultiDimensionalRanking.tsx
│   │   │   ├── PersonalProgressChart.tsx
│   │   │   └── CompetitionSafetyIndicator.tsx
│   │   ├── rewards/
│   │   │   ├── CoinBalance.tsx
│   │   │   ├── RewardItem.tsx
│   │   │   ├── RedemptionFlow.tsx
│   │   │   ├── CoinEarningAnimation.tsx
│   │   │   └── PurchaseConfirmation.tsx
│   │   ├── achievements/
│   │   │   ├── AchievementBadge.tsx (existing - enhanced)
│   │   │   ├── BadgeHierarchy.tsx
│   │   │   ├── UnlockAnimation.tsx
│   │   │   ├── CelebrationEffect.tsx
│   │   │   └── ProgressVisualization.tsx
│   │   └── celebrations/
│   │       ├── CulturalCelebration.tsx
│   │       ├── IslamicCelebrationTheme.tsx
│   │       ├── UzbekTraditionPattern.tsx
│   │       └── AgeAppropriateCelebration.tsx
│   ├── hooks/
│   │   ├── ranking/
│   │   │   ├── useRankingData.ts
│   │   │   ├── useLeaderboardSubscription.ts
│   │   │   ├── usePersonalStats.ts
│   │   │   └── useRankingPrivacy.ts
│   │   ├── rewards/
│   │   │   ├── useRewardsData.ts
│   │   │   ├── useCoinBalance.ts
│   │   │   ├── useRedemptionFlow.ts
│   │   │   └── useVariableRewards.ts
│   │   ├── achievements/
│   │   │   ├── useAchievements.ts
│   │   │   ├── useUnlockAnimation.ts
│   │   │   ├── useBadgeProgress.ts
│   │   │   └── useCelebrationTrigger.ts
│   │   └── gamification/
│   │       ├── useMotivationEngine.ts
│   │       ├── useCulturalAdaptation.ts
│   │       ├── useHealthyCompetition.ts
│   │       └── useBehavioralPsychology.ts
│   ├── services/
│   │   ├── ranking/
│   │   │   ├── rankingEngine.service.ts
│   │   │   ├── leaderboardUpdates.service.ts
│   │   │   ├── multiDimensionalScoring.service.ts
│   │   │   └── competitionSafety.service.ts
│   │   ├── rewards/
│   │   │   ├── coinEconomy.service.ts
│   │   │   ├── rewardDistribution.service.ts
│   │   │   ├── variableSchedule.service.ts
│   │   │   └── redemptionManager.service.ts
│   │   ├── achievements/
│   │   │   ├── badgeSystem.service.ts
│   │   │   ├── achievementTrigger.service.ts
│   │   │   ├── progressTracking.service.ts
│   │   │   └── hierarchyManager.service.ts
│   │   ├── celebrations/
│   │   │   ├── culturalCelebrations.service.ts
│   │   │   ├── islamicCalendar.service.ts
│   │   │   ├── uzbekTraditions.service.ts
│   │   │   └── ageAdaptiveCelebrations.service.ts
│   │   └── psychology/
│   │       ├── motivationAnalytics.service.ts
│   │       ├── behavioralTriggers.service.ts
│   │       ├── engagementOptimizer.service.ts
│   │       └── wellbeingMonitor.service.ts
│   └── stores/
│       ├── rankingStore.ts
│       ├── rewardsStore.ts
│       ├── achievementsStore.ts
│       └── gamificationStore.ts
```

## Technology Decisions

**Core Framework:** React Native 0.72+ with Expo SDK 49
**State Management:** 
- Zustand for client state (ranking data, UI preferences)
- React Query for server state (leaderboards, real-time updates)
**Real-time Updates:** Supabase real-time subscriptions with batched updates
**Animations:** React Native Reanimated 3 with gesture handler integration
**Offline Storage:** MMKV for preferences, SQLite for ranking/rewards data
**Cultural Integration:** Custom service layer for Islamic/Uzbek adaptations
**Performance:** Optimized for 60fps animations with GPU acceleration

## Component Architecture

### Screen Components

#### LeaderboardScreen.tsx
```typescript
interface LeaderboardScreenProps {
  ageGroup: 'elementary' | 'middle' | 'high';
  culturalSettings: CulturalPreferences;
  privacyLevel: PrivacyLevel;
}

const LeaderboardScreen: FC<LeaderboardScreenProps> = ({
  ageGroup,
  culturalSettings,
  privacyLevel
}) => {
  // Real-time leaderboard subscription
  const { rankings, loading, error } = useLeaderboardSubscription({
    dimensions: ['academic', 'effort', 'collaboration', 'creativity'],
    updateFrequency: 'optimal', // 2-3x daily
    culturalFilters: culturalSettings.filters
  });

  // Age-adaptive layout configuration
  const layoutConfig = useAgeAdaptiveLayout(ageGroup, {
    elementaryConfig: {
      showMascots: true,
      emphasizeVisuals: true,
      simplifyStats: true,
      largerTouchTargets: true,
      celebrationLevel: 'high'
    },
    middleConfig: {
      showSocialFeatures: true,
      privacyControls: true,
      peerComparison: 'optional',
      analyticsLevel: 'moderate'
    },
    highConfig: {
      detailedAnalytics: true,
      mentorshipOpportunities: true,
      careerConnections: true,
      advancedPrivacy: true
    }
  });

  // Cultural celebration integration
  const { currentCelebration, celebrationActive } = useCulturalCelebrations({
    islamicCalendar: true,
    uzbekTraditions: true,
    seasonalEvents: true
  });

  return (
    <SafeAreaView style={styles.container}>
      <DashboardHeader
        title={getLocalizedTitle('leaderboard', culturalSettings.language)}
        showSync={true}
        culturalTheme={currentCelebration?.theme}
      />
      
      {/* Privacy Controls */}
      <PrivacyToggle
        level={privacyLevel}
        ageGroup={ageGroup}
        onToggle={handlePrivacyChange}
      />

      {/* Multi-Dimensional Rankings */}
      <MultiDimensionalRanking
        rankings={rankings}
        selectedDimension={selectedDimension}
        onDimensionChange={setSelectedDimension}
        ageGroup={ageGroup}
        culturalSettings={culturalSettings}
      />

      {/* Age-Adaptive Leaderboard Display */}
      <FlatList
        data={rankings}
        renderItem={({ item, index }) => (
          <LeaderboardCard
            student={item}
            position={index + 1}
            ageGroup={ageGroup}
            showPrivateData={privacyLevel === 'full'}
            culturalCelebration={celebrationActive ? currentCelebration : null}
            onPress={() => handleStudentPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Personal Position Summary */}
      <PersonalPositionSummary
        personalRanking={personalRanking}
        ageGroup={ageGroup}
        culturalEncouragement={getCulturalEncouragement(culturalSettings)}
      />
    </SafeAreaView>
  );
};
```

#### RewardsCatalogScreen.tsx  
```typescript
interface RewardsCatalogScreenProps {
  availableCoins: number;
  ageGroup: AgeGroup;
  culturalRestrictions: string[];
}

const RewardsCatalogScreen: FC<RewardsCatalogScreenProps> = ({
  availableCoins,
  ageGroup,
  culturalRestrictions
}) => {
  const { rewards, categories } = useRewardsData({
    culturalFilters: culturalRestrictions,
    ageAppropriate: ageGroup
  });

  const { coinBalance, transactions } = useCoinBalance();
  const { redeemReward, redemptionState } = useRedemptionFlow();

  // Variable reward schedule implementation
  const { nextSurpriseReward, variableBonus } = useVariableRewards({
    schedule: 'optimal', // Fixed ratio, variable ratio, fixed interval, variable interval
    behavioralProfile: userBehavioralProfile
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header>
        {/* Coin Balance Display */}
        <CoinBalance
          balance={availableCoins}
          animated={ageGroup === 'elementary'}
          recentEarning={variableBonus}
          style={styles.coinBalance}
        />
        
        {/* Cultural Status */}
        <CulturalBlessingIndicator culturalSettings={culturalSettings} />
      </Header>

      {/* Reward Categories */}
      <CategorySelector
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        ageGroup={ageGroup}
      />

      {/* Rewards Grid */}
      <FlatList
        data={rewards}
        renderItem={({ item }) => (
          <RewardItem
            reward={item}
            canAfford={availableCoins >= item.cost}
            ageGroup={ageGroup}
            culturallyAppropriate={!culturalRestrictions.includes(item.category)}
            onPurchase={() => handlePurchase(item)}
          />
        )}
        numColumns={ageGroup === 'elementary' ? 2 : 3}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />

      {/* Redemption Flow Modal */}
      <RedemptionFlow
        visible={redemptionState.showModal}
        reward={redemptionState.selectedReward}
        coinBalance={availableCoins}
        onConfirm={confirmRedemption}
        onCancel={cancelRedemption}
        culturalValidation={validateCulturalAppropriateness}
      />
    </SafeAreaView>
  );
};
```

#### AchievementsScreen.tsx
```typescript
interface AchievementsScreenProps {
  achievements: Achievement[];
  progressData: AchievementProgress;
  ageGroup: AgeGroup;
  celebrationPreferences: CelebrationSettings;
}

const AchievementsScreen: FC<AchievementsScreenProps> = ({
  achievements,
  progressData,
  ageGroup,
  celebrationPreferences
}) => {
  const { unlockedAchievements, lockedAchievements, recentUnlocks } = 
    useAchievements(achievements);
  
  const { triggerCelebration } = useCelebrationTrigger({
    culturalThemes: true,
    ageAppropriate: ageGroup,
    islamicValues: celebrationPreferences.islamicValues
  });

  // Badge hierarchy organization
  const badgeHierarchy = useMemo(() => ({
    bronze: achievements.filter(a => a.tier === 'bronze'),
    silver: achievements.filter(a => a.tier === 'silver'), 
    gold: achievements.filter(a => a.tier === 'gold'),
    platinum: achievements.filter(a => a.tier === 'platinum')
  }), [achievements]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Achievement Summary Header */}
      <AchievementSummaryHeader
        totalUnlocked={unlockedAchievements.length}
        totalAvailable={achievements.length}
        recentUnlocks={recentUnlocks}
        ageGroup={ageGroup}
      />

      {/* Badge Hierarchy Tabs */}
      <BadgeHierarchyTabs
        hierarchy={badgeHierarchy}
        selectedTier={selectedTier}
        onTierSelect={setSelectedTier}
        ageGroup={ageGroup}
      />

      {/* Achievements Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.achievementsGrid}>
          {badgeHierarchy[selectedTier].map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={achievement.unlockedAt != null}
              progress={progressData[achievement.id]}
              ageGroup={ageGroup}
              onPress={() => handleAchievementPress(achievement)}
              onUnlock={() => triggerCelebration(achievement)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Progress Visualization */}
      <ProgressVisualization
        progressData={progressData}
        ageGroup={ageGroup}
        showDetailedStats={ageGroup !== 'elementary'}
      />
    </SafeAreaView>
  );
};
```

## State Management Architecture

### Zustand Store Structure

#### rankingStore.ts
```typescript
interface RankingState {
  // Current rankings data
  personalRanking: PersonalRanking;
  leaderboards: Record<RankingDimension, LeaderboardData>;
  
  // Real-time subscription management
  subscriptions: Map<string, RealtimeSubscription>;
  connectionStatus: ConnectionStatus;
  lastUpdate: Date;
  
  // Privacy and safety settings
  privacyLevel: PrivacyLevel;
  competitionSafetyMode: boolean;
  parentalOverride: boolean;
  
  // Cultural settings
  culturalPreferences: CulturalSettings;
  celebrationThemes: CelebrationTheme[];
  
  // Age-adaptive configurations
  ageGroup: AgeGroup;
  layoutConfiguration: AgeLayoutConfig;
}

interface RankingActions {
  // Data management
  updateRankings: (updates: RankingUpdate[]) => void;
  refreshLeaderboard: (dimension: RankingDimension) => void;
  
  // Real-time subscription control
  subscribeToLeaderboard: (dimension: RankingDimension) => void;
  unsubscribeFromLeaderboard: (dimension: RankingDimension) => void;
  handleConnectionChange: (status: ConnectionStatus) => void;
  
  // Privacy controls
  updatePrivacyLevel: (level: PrivacyLevel) => void;
  toggleCompetitionSafety: () => void;
  
  // Cultural adaptation
  updateCulturalPreferences: (preferences: CulturalSettings) => void;
  activateCelebrationTheme: (theme: CelebrationTheme) => void;
}

const useRankingStore = create<RankingState & RankingActions>()((set, get) => ({
  // Initial state
  personalRanking: null,
  leaderboards: {},
  subscriptions: new Map(),
  connectionStatus: 'connecting',
  lastUpdate: new Date(),
  privacyLevel: 'moderate',
  competitionSafetyMode: false,
  parentalOverride: false,
  culturalPreferences: getDefaultCulturalSettings(),
  celebrationThemes: [],
  ageGroup: 'middle',
  layoutConfiguration: getDefaultLayoutConfig(),

  // Actions
  updateRankings: (updates) => set((state) => ({
    leaderboards: processRankingUpdates(state.leaderboards, updates),
    lastUpdate: new Date()
  })),

  refreshLeaderboard: async (dimension) => {
    const { subscriptions } = get();
    const subscription = subscriptions.get(dimension);
    if (subscription) {
      await subscription.refresh();
    }
  },

  subscribeToLeaderboard: (dimension) => set((state) => {
    const subscription = createLeaderboardSubscription(dimension, {
      onUpdate: (updates) => state.updateRankings(updates),
      culturalFilters: state.culturalPreferences.filters,
      ageGroup: state.ageGroup
    });
    
    const newSubscriptions = new Map(state.subscriptions);
    newSubscriptions.set(dimension, subscription);
    
    return { subscriptions: newSubscriptions };
  }),

  updatePrivacyLevel: (level) => set({ privacyLevel: level }),

  toggleCompetitionSafety: () => set((state) => ({
    competitionSafetyMode: !state.competitionSafetyMode
  })),

  updateCulturalPreferences: (preferences) => set({
    culturalPreferences: preferences
  }),

  activateCelebrationTheme: (theme) => set((state) => ({
    celebrationThemes: [...state.celebrationThemes.filter(t => t.id !== theme.id), theme]
  }))
}));
```

#### rewardsStore.ts
```typescript
interface RewardsState {
  // Coin economy
  coinBalance: number;
  coinHistory: CoinTransaction[];
  pendingEarnings: PendingReward[];
  
  // Rewards catalog
  availableRewards: RewardItem[];
  purchasedRewards: Purchase[];
  wishlist: string[];
  
  // Variable reward system
  rewardSchedule: VariableSchedule;
  nextSurpriseReward: Date;
  streakMultiplier: number;
  
  // Behavioral psychology tracking
  motivationProfile: MotivationProfile;
  engagementMetrics: EngagementMetrics;
  
  // Cultural compliance
  culturalRestrictions: string[];
  islamicCompliantMode: boolean;
}

interface RewardsActions {
  // Coin management
  addCoins: (amount: number, source: string) => void;
  spendCoins: (amount: number, itemId: string) => void;
  processPendingEarnings: () => void;
  
  // Reward system
  purchaseReward: (rewardId: string) => Promise<boolean>;
  addToWishlist: (rewardId: string) => void;
  removeFromWishlist: (rewardId: string) => void;
  
  // Variable schedules
  processVariableReward: () => void;
  updateRewardSchedule: (schedule: VariableSchedule) => void;
  
  // Cultural compliance
  validateCulturalAppropriateness: (rewardId: string) => boolean;
  updateCulturalRestrictions: (restrictions: string[]) => void;
}

const useRewardsStore = create<RewardsState & RewardsActions>()(
  persist(
    (set, get) => ({
      // Initial state
      coinBalance: 0,
      coinHistory: [],
      pendingEarnings: [],
      availableRewards: [],
      purchasedRewards: [],
      wishlist: [],
      rewardSchedule: createOptimalVariableSchedule(),
      nextSurpriseReward: addDays(new Date(), 1),
      streakMultiplier: 1.0,
      motivationProfile: createDefaultMotivationProfile(),
      engagementMetrics: {},
      culturalRestrictions: [],
      islamicCompliantMode: true,

      // Actions
      addCoins: (amount, source) => set((state) => {
        const transaction: CoinTransaction = {
          id: generateId(),
          amount,
          source,
          timestamp: new Date(),
          type: 'earned'
        };
        
        return {
          coinBalance: state.coinBalance + amount,
          coinHistory: [transaction, ...state.coinHistory].slice(0, 100) // Keep last 100
        };
      }),

      purchaseReward: async (rewardId) => {
        const { coinBalance, availableRewards, culturalRestrictions } = get();
        const reward = availableRewards.find(r => r.id === rewardId);
        
        if (!reward || coinBalance < reward.cost) {
          return false;
        }
        
        // Cultural validation
        if (!validateCulturalAppropriateness(rewardId)) {
          return false;
        }
        
        // Process purchase
        set((state) => ({
          coinBalance: state.coinBalance - reward.cost,
          purchasedRewards: [...state.purchasedRewards, {
            id: generateId(),
            rewardId,
            purchaseDate: new Date(),
            cost: reward.cost
          }],
          coinHistory: [{
            id: generateId(),
            amount: -reward.cost,
            source: `Purchased: ${reward.name}`,
            timestamp: new Date(),
            type: 'spent'
          }, ...state.coinHistory]
        }));
        
        return true;
      },

      validateCulturalAppropriateness: (rewardId) => {
        const { culturalRestrictions, availableRewards } = get();
        const reward = availableRewards.find(r => r.id === rewardId);
        
        if (!reward) return false;
        
        return !culturalRestrictions.some(restriction => 
          reward.tags?.includes(restriction)
        );
      }
    }),
    {
      name: 'rewards-storage',
      storage: createJSONStorage(() => MMKV)
    }
  )
);
```

#### achievementsStore.ts
```typescript
interface AchievementsState {
  // Achievement data
  achievements: Achievement[];
  unlockedAchievements: string[];
  achievementProgress: Record<string, AchievementProgress>;
  
  // Badge hierarchy
  badgeHierarchy: BadgeHierarchy;
  nextUnlocks: PendingUnlock[];
  
  // Celebration system
  pendingCelebrations: Celebration[];
  celebrationHistory: CompletedCelebration[];
  culturalCelebrationActive: boolean;
  
  // Progress tracking
  skillProgress: Record<string, SkillProgress>;
  milestones: Milestone[];
  
  // Cultural integration
  islamicAchievements: IslamicAchievement[];
  uzbekTraditionBadges: UzbekBadge[];
  communityServiceTracking: CommunityService[];
}

interface AchievementsActions {
  // Achievement management
  unlockAchievement: (achievementId: string) => void;
  updateProgress: (achievementId: string, progress: number) => void;
  checkUnlockConditions: () => void;
  
  // Celebration system
  triggerCelebration: (achievement: Achievement) => void;
  completeCelebration: (celebrationId: string) => void;
  scheduleCulturalCelebration: (event: CulturalEvent) => void;
  
  // Cultural integration
  addIslamicAchievement: (achievement: IslamicAchievement) => void;
  trackCommunityService: (service: CommunityService) => void;
  
  // Progress tracking
  updateSkillProgress: (skill: string, progress: SkillProgress) => void;
  addMilestone: (milestone: Milestone) => void;
}

const useAchievementsStore = create<AchievementsState & AchievementsActions>()(
  persist(
    (set, get) => ({
      // Initial state
      achievements: [],
      unlockedAchievements: [],
      achievementProgress: {},
      badgeHierarchy: createBadgeHierarchy(),
      nextUnlocks: [],
      pendingCelebrations: [],
      celebrationHistory: [],
      culturalCelebrationActive: false,
      skillProgress: {},
      milestones: [],
      islamicAchievements: [],
      uzbekTraditionBadges: [],
      communityServiceTracking: [],

      // Actions
      unlockAchievement: (achievementId) => set((state) => {
        const achievement = state.achievements.find(a => a.id === achievementId);
        if (!achievement || state.unlockedAchievements.includes(achievementId)) {
          return state;
        }
        
        // Create celebration for unlock
        const celebration: Celebration = {
          id: generateId(),
          type: 'achievement_unlock',
          achievementId,
          scheduledFor: new Date(),
          culturalTheme: getCurrentCulturalTheme(),
          priority: achievement.tier === 'platinum' ? 'high' : 'normal'
        };
        
        return {
          unlockedAchievements: [...state.unlockedAchievements, achievementId],
          pendingCelebrations: [...state.pendingCelebrations, celebration],
          achievementProgress: {
            ...state.achievementProgress,
            [achievementId]: { completed: true, progress: 100, unlockedAt: new Date() }
          }
        };
      }),

      triggerCelebration: (achievement) => {
        const celebration = createCelebrationFromAchievement(achievement);
        
        // Trigger celebration animation with cultural elements
        CelebrationEngine.trigger(celebration, {
          culturalElements: get().culturalCelebrationActive,
          ageGroup: getCurrentAgeGroup(),
          islamicTheme: achievement.islamicValues,
          uzbekPatterns: achievement.uzbekCultural
        });
        
        set((state) => ({
          celebrationHistory: [...state.celebrationHistory, {
            ...celebration,
            completedAt: new Date()
          }]
        }));
      },

      checkUnlockConditions: () => {
        const { achievements, unlockedAchievements, skillProgress } = get();
        
        const newUnlocks = achievements.filter(achievement => {
          // Skip already unlocked
          if (unlockedAchievements.includes(achievement.id)) {
            return false;
          }
          
          // Check unlock conditions
          return checkAchievementConditions(achievement, skillProgress);
        });
        
        // Process new unlocks
        newUnlocks.forEach(achievement => {
          get().unlockAchievement(achievement.id);
        });
      }
    }),
    {
      name: 'achievements-storage',
      storage: createJSONStorage(() => MMKV)
    }
  )
);
```

## Real-time Updates Architecture

### Supabase Real-time Integration

#### leaderboardUpdates.service.ts
```typescript
class LeaderboardUpdatesService {
  private subscriptions = new Map<string, RealtimeChannel>();
  private updateQueue: RankingUpdate[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  
  constructor(
    private supabase: SupabaseClient,
    private store: RankingStore
  ) {}

  /**
   * Subscribe to leaderboard updates with optimal frequency
   * Research finding: 2-3x daily updates prevent obsessive checking
   */
  async subscribeToLeaderboard(
    dimension: RankingDimension, 
    options: LeaderboardSubscriptionOptions
  ): Promise<void> {
    const channelName = `leaderboard:${dimension}`;
    
    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_rankings',
        filter: `dimension=eq.${dimension}`
      }, this.handleRankingUpdate.bind(this))
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'achievement_unlocks',
      }, this.handleAchievementUpdate.bind(this))
      .subscribe((status) => {
        this.store.handleConnectionChange(
          status === 'SUBSCRIBED' ? 'connected' : 'disconnected'
        );
      });

    this.subscriptions.set(dimension, channel);
  }

  /**
   * Handle ranking updates with cultural filtering and age-appropriate processing
   */
  private handleRankingUpdate = (payload: RealtimePayload) => {
    const update = this.processRankingPayload(payload);
    
    // Apply cultural filters
    const culturallyFiltered = this.applyCulturalFilters(update);
    
    // Add to batch queue for processing
    this.updateQueue.push(culturallyFiltered);
    
    // Batch updates to prevent excessive re-renders
    this.scheduleBatchUpdate();
  };

  /**
   * Batch updates with debouncing to optimize performance
   */
  private scheduleBatchUpdate = () => {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatchedUpdates();
    }, 500); // 500ms debounce
  };

  private processBatchedUpdates = () => {
    if (this.updateQueue.length === 0) return;
    
    // Group updates by type and importance
    const groupedUpdates = this.groupUpdatesByPriority(this.updateQueue);
    
    // Process high-priority updates first (personal ranking changes)
    if (groupedUpdates.high.length > 0) {
      this.store.updateRankings(groupedUpdates.high);
      this.triggerCelebrationIfNeeded(groupedUpdates.high);
    }
    
    // Process normal updates
    if (groupedUpdates.normal.length > 0) {
      this.store.updateRankings(groupedUpdates.normal);
    }
    
    // Clear queue
    this.updateQueue = [];
  };

  /**
   * Apply cultural sensitivity filters to ranking updates
   */
  private applyCulturalFilters = (update: RankingUpdate): RankingUpdate => {
    const { culturalPreferences } = this.store;
    
    // Filter based on Islamic values (community over individual competition)
    if (culturalPreferences.islamicValues.enabled) {
      update = this.applyIslamicCommunityFilters(update);
    }
    
    // Apply Uzbek collectivist preferences
    if (culturalPreferences.uzbekTraditions.collectivistMode) {
      update = this.emphasizeGroupSuccessMetrics(update);
    }
    
    return update;
  };

  /**
   * Trigger celebrations for significant ranking changes
   */
  private triggerCelebrationIfNeeded = (updates: RankingUpdate[]) => {
    updates.forEach(update => {
      if (update.type === 'position_improved' && update.significance === 'major') {
        this.celebrationService.triggerRankingCelebration(update);
      }
    });
  };

  /**
   * Unsubscribe from specific leaderboard
   */
  async unsubscribeFromLeaderboard(dimension: RankingDimension): Promise<void> {
    const subscription = this.subscriptions.get(dimension);
    if (subscription) {
      await subscription.unsubscribe();
      this.subscriptions.delete(dimension);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  async cleanup(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptions.values())
      .map(channel => channel.unsubscribe());
    
    await Promise.all(unsubscribePromises);
    this.subscriptions.clear();
  }
}

// Update frequency configuration based on research findings
const OPTIMAL_UPDATE_FREQUENCY = {
  morning: '08:00', // Start of day leaderboard update
  midday: '14:00',  // Afternoon progress update
  evening: '18:00'  // End of day achievements and celebrations
};
```

#### multiDimensionalScoring.service.ts
```typescript
class MultiDimensionalScoringService {
  /**
   * Calculate ranking scores across multiple dimensions
   * Based on UX research: avoid single-metric competition
   */
  calculateMultiDimensionalScore(
    student: Student,
    dimension: RankingDimension,
    timeframe: ScoringTimeframe = 'weekly'
  ): DimensionScore {
    
    switch (dimension) {
      case 'academic':
        return this.calculateAcademicScore(student, timeframe);
      
      case 'effort':
        return this.calculateEffortScore(student, timeframe);
      
      case 'collaboration':
        return this.calculateCollaborationScore(student, timeframe);
      
      case 'creativity':
        return this.calculateCreativityScore(student, timeframe);
      
      case 'community_service':
        return this.calculateCommunityServiceScore(student, timeframe);
        
      default:
        throw new Error(`Unknown dimension: ${dimension}`);
    }
  }

  /**
   * Academic Performance Score
   * Weighted combination of completion, accuracy, and improvement
   */
  private calculateAcademicScore(
    student: Student, 
    timeframe: ScoringTimeframe
  ): DimensionScore {
    const activities = this.getStudentActivities(student.id, timeframe);
    
    const completionRate = this.calculateCompletionRate(activities);
    const accuracyRate = this.calculateAccuracyRate(activities);
    const improvementRate = this.calculateImprovementTrend(activities);
    
    // Weighted scoring that rewards consistent progress
    const score = (
      completionRate * 0.4 +
      accuracyRate * 0.3 + 
      improvementRate * 0.3
    ) * 100;
    
    return {
      dimension: 'academic',
      score: Math.round(score),
      breakdown: {
        completion: Math.round(completionRate * 100),
        accuracy: Math.round(accuracyRate * 100),
        improvement: Math.round(improvementRate * 100)
      },
      lastCalculated: new Date()
    };
  }

  /**
   * Effort and Persistence Score
   * Measures consistency, time spent, and overcoming challenges
   */
  private calculateEffortScore(
    student: Student, 
    timeframe: ScoringTimeframe
  ): DimensionScore {
    const sessions = this.getStudentSessions(student.id, timeframe);
    
    const consistencyScore = this.calculateConsistency(sessions);
    const persistenceScore = this.calculatePersistence(sessions);
    const timeInvestmentScore = this.calculateTimeInvestment(sessions);
    
    const score = (
      consistencyScore * 0.4 +
      persistenceScore * 0.4 +
      timeInvestmentScore * 0.2
    ) * 100;
    
    return {
      dimension: 'effort',
      score: Math.round(score),
      breakdown: {
        consistency: Math.round(consistencyScore * 100),
        persistence: Math.round(persistenceScore * 100),
        timeInvestment: Math.round(timeInvestmentScore * 100)
      },
      lastCalculated: new Date()
    };
  }

  /**
   * Collaboration Score
   * Rewards helping peers, group participation, positive social interaction
   */
  private calculateCollaborationScore(
    student: Student, 
    timeframe: ScoringTimeframe
  ): DimensionScore {
    const interactions = this.getStudentInteractions(student.id, timeframe);
    
    const helpingBehavior = this.calculateHelpingBehavior(interactions);
    const positiveInteractions = this.calculatePositiveInteractions(interactions);
    const groupContributions = this.calculateGroupContributions(interactions);
    
    const score = (
      helpingBehavior * 0.5 +
      positiveInteractions * 0.3 +
      groupContributions * 0.2
    ) * 100;
    
    return {
      dimension: 'collaboration',
      score: Math.round(score),
      breakdown: {
        helping: Math.round(helpingBehavior * 100),
        positiveInteractions: Math.round(positiveInteractions * 100),
        groupWork: Math.round(groupContributions * 100)
      },
      lastCalculated: new Date()
    };
  }

  /**
   * Age-appropriate score adjustments
   * Elementary students get more celebration, older students get detailed analytics
   */
  adjustScoreForAge(score: DimensionScore, ageGroup: AgeGroup): DimensionScore {
    switch (ageGroup) {
      case 'elementary':
        // Boost lower scores to maintain motivation
        if (score.score < 50) {
          score.score = Math.min(score.score * 1.2, 75);
        }
        break;
        
      case 'middle':
        // Balanced approach with honest feedback
        break;
        
      case 'high':
        // Realistic preparation for adult expectations
        break;
    }
    
    return score;
  }

  /**
   * Cultural adaptation of scoring
   * Emphasis on community values and Islamic principles
   */
  applyCulturalAdaptations(
    score: DimensionScore,
    culturalSettings: CulturalSettings
  ): DimensionScore {
    if (culturalSettings.islamicValues.enabled) {
      // Boost community service and helping others
      if (score.dimension === 'collaboration' || score.dimension === 'community_service') {
        score.score = Math.min(score.score * 1.15, 100);
      }
    }
    
    if (culturalSettings.uzbekTraditions.collectivistMode) {
      // Reduce individual competition emphasis
      if (score.dimension === 'academic') {
        score.breakdown.teamSuccess = this.calculateTeamContribution(score);
      }
    }
    
    return score;
  }
}
```

## Celebration Animation Architecture

### React Native Reanimated Integration

#### CelebrationEngine.ts
```typescript
class CelebrationEngine {
  private animationQueue: CelebrationAnimation[] = [];
  private activeAnimations = new Map<string, Animated.Value>();

  /**
   * Trigger culturally-appropriate celebration based on achievement
   */
  async triggerCelebration(
    achievement: Achievement,
    options: CelebrationOptions
  ): Promise<void> {
    const celebrationConfig = this.createCelebrationConfig(achievement, options);
    
    // Queue animation to prevent overlapping celebrations
    this.queueCelebration(celebrationConfig);
    
    // Process animation queue
    await this.processAnimationQueue();
  }

  /**
   * Create celebration configuration based on cultural and age settings
   */
  private createCelebrationConfig(
    achievement: Achievement,
    options: CelebrationOptions
  ): CelebrationConfig {
    const config: CelebrationConfig = {
      duration: this.calculateDuration(achievement.tier, options.ageGroup),
      intensity: this.calculateIntensity(achievement.tier, options.ageGroup),
      culturalTheme: this.selectCulturalTheme(options),
      animations: [],
      sounds: [],
      haptics: this.getHapticsPattern(achievement.tier)
    };

    // Add age-appropriate animations
    if (options.ageGroup === 'elementary') {
      config.animations.push(
        this.createConfettiAnimation(),
        this.createMascotCelebration(),
        this.createBounceAnimation()
      );
    } else {
      config.animations.push(
        this.createElegantShimmer(),
        this.createProgressAnimation(),
        this.createBadgeReveal()
      );
    }

    // Add cultural elements
    if (options.culturalTheme?.islamic) {
      config.animations.push(this.createIslamicPatternAnimation());
      config.sounds.push('islamic_celebration.mp3');
    }

    if (options.culturalTheme?.uzbek) {
      config.animations.push(this.createUzbekPatternAnimation());
      config.colors = UZBEK_TRADITIONAL_COLORS;
    }

    return config;
  }

  /**
   * Confetti celebration for major achievements
   */
  private createConfettiAnimation(): AnimationSpec {
    return {
      type: 'confetti',
      duration: 3000,
      particles: 50,
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4'],
      gravity: 0.5,
      velocity: { min: 2, max: 8 },
      implementation: (containerRef: RefObject<View>) => {
        const particles = Array.from({ length: 50 }, () => ({
          x: useSharedValue(Math.random() * screenWidth),
          y: useSharedValue(-50),
          rotation: useSharedValue(0),
          opacity: useSharedValue(1)
        }));

        const animatedStyle = useAnimatedStyle(() => ({
          position: 'absolute',
          width: '100%',
          height: '100%'
        }));

        // Trigger particle animation
        particles.forEach((particle, index) => {
          particle.y.value = withDelay(
            index * 50,
            withTiming(screenHeight + 50, { duration: 3000 })
          );
          particle.rotation.value = withRepeat(
            withTiming(360, { duration: 2000 }),
            -1
          );
          particle.opacity.value = withDelay(
            2500,
            withTiming(0, { duration: 500 })
          );
        });

        return (
          <Animated.View style={animatedStyle}>
            {particles.map((particle, index) => (
              <Animated.View
                key={index}
                style={[
                  {
                    position: 'absolute',
                    width: 10,
                    height: 10,
                    backgroundColor: this.getRandomColor(),
                    borderRadius: 5,
                  },
                  useAnimatedStyle(() => ({
                    transform: [
                      { translateX: particle.x.value },
                      { translateY: particle.y.value },
                      { rotate: `${particle.rotation.value}deg` }
                    ],
                    opacity: particle.opacity.value
                  }))
                ]}
              />
            ))}
          </Animated.View>
        );
      }
    };
  }

  /**
   * Islamic celebration pattern animation
   * Respectful geometric patterns inspired by Islamic art
   */
  private createIslamicPatternAnimation(): AnimationSpec {
    return {
      type: 'islamic_pattern',
      duration: 2000,
      implementation: (containerRef: RefObject<View>) => {
        const scale = useSharedValue(0);
        const rotation = useSharedValue(0);
        const opacity = useSharedValue(0);

        React.useEffect(() => {
          // Gentle emergence animation respecting Islamic aesthetic principles
          scale.value = withSpring(1, { damping: 15, stiffness: 100 });
          rotation.value = withTiming(360, { duration: 2000, easing: Easing.out(Easing.quad) });
          opacity.value = withTiming(1, { duration: 500 });
          
          // Gentle fade out
          setTimeout(() => {
            opacity.value = withTiming(0, { duration: 1000 });
          }, 1500);
        }, []);

        return (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              useAnimatedStyle(() => ({
                transform: [
                  { scale: scale.value },
                  { rotate: `${rotation.value}deg` }
                ],
                opacity: opacity.value,
                justifyContent: 'center',
                alignItems: 'center'
              }))
            ]}
          >
            <IslamicGeometricPattern
              size={200}
              colors={['#C5A572', '#8B7355', '#D4AF37']} // Traditional Islamic gold tones
              pattern="eight_pointed_star"
            />
          </Animated.View>
        );
      }
    };
  }

  /**
   * Uzbek traditional pattern celebration
   * Incorporates Uzbek cultural motifs and colors
   */
  private createUzbekPatternAnimation(): AnimationSpec {
    return {
      type: 'uzbek_pattern',
      duration: 2500,
      implementation: (containerRef: RefObject<View>) => {
        const translateY = useSharedValue(100);
        const scale = useSharedValue(0.8);
        const opacity = useSharedValue(0);

        React.useEffect(() => {
          translateY.value = withSpring(0, { damping: 12, stiffness: 80 });
          scale.value = withSpring(1, { damping: 12, stiffness: 80 });
          opacity.value = withTiming(1, { duration: 800 });
          
          setTimeout(() => {
            translateY.value = withSpring(-50);
            scale.value = withSpring(1.1);
            opacity.value = withTiming(0, { duration: 800 });
          }, 1700);
        }, []);

        return (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              useAnimatedStyle(() => ({
                transform: [
                  { translateY: translateY.value },
                  { scale: scale.value }
                ],
                opacity: opacity.value,
                justifyContent: 'center',
                alignItems: 'center'
              }))
            ]}
          >
            <UzbekTraditionalPattern
              size={180}
              colors={['#0099CC', '#FFD700', '#FF6B6B']} // Uzbek blue, gold, coral
              pattern="suzani_flower"
            />
          </Animated.View>
        );
      }
    };
  }

  /**
   * Achievement badge unlock animation with cultural theming
   */
  private createBadgeRevealAnimation(
    badge: Achievement,
    culturalTheme?: CulturalTheme
  ): AnimationSpec {
    return {
      type: 'badge_reveal',
      duration: 2000,
      implementation: (containerRef: RefObject<View>) => {
        const badgeScale = useSharedValue(0);
        const badgeRotation = useSharedValue(-180);
        const glowOpacity = useSharedValue(0);
        const ringScale = useSharedValue(0);

        React.useEffect(() => {
          // Sequence of animations for badge reveal
          runOnUI(() => {
            // Ring expansion
            ringScale.value = withSpring(1.2, { damping: 15 });
            
            // Glow effect
            glowOpacity.value = withTiming(0.8, { duration: 300 });
            
            // Badge reveal with rotation
            setTimeout(() => {
              badgeScale.value = withSpring(1, { damping: 12, stiffness: 100 });
              badgeRotation.value = withSpring(0, { damping: 15, stiffness: 150 });
            }, 200);
            
            // Celebration completion
            setTimeout(() => {
              glowOpacity.value = withTiming(0, { duration: 1000 });
              ringScale.value = withTiming(1, { duration: 500 });
            }, 1500);
          })();
        }, []);

        return (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { justifyContent: 'center', alignItems: 'center' }
            ]}
          >
            {/* Background glow ring */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: culturalTheme?.colors.primary || '#FFD700',
                },
                useAnimatedStyle(() => ({
                  transform: [{ scale: ringScale.value }],
                  opacity: glowOpacity.value * 0.3
                }))
              ]}
            />
            
            {/* Achievement badge */}
            <Animated.View
              style={[
                useAnimatedStyle(() => ({
                  transform: [
                    { scale: badgeScale.value },
                    { rotateY: `${badgeRotation.value}deg` }
                  ]
                }))
              ]}
            >
              <AchievementBadge
                achievement={badge}
                size="large"
                culturalTheme={culturalTheme}
              />
            </Animated.View>
          </Animated.View>
        );
      }
    };
  }

  /**
   * Process animation queue to prevent overwhelming celebrations
   */
  private async processAnimationQueue(): Promise<void> {
    if (this.animationQueue.length === 0) return;
    
    const animation = this.animationQueue.shift()!;
    await this.executeAnimation(animation);
    
    // Process next animation with delay
    setTimeout(() => {
      this.processAnimationQueue();
    }, 500);
  }
}

// Cultural celebration themes
const ISLAMIC_CELEBRATION_THEME: CelebrationTheme = {
  name: 'islamic',
  colors: {
    primary: '#C5A572', // Traditional Islamic gold
    secondary: '#8B7355', // Earth tone
    accent: '#D4AF37'     // Bright gold
  },
  patterns: ['geometric', 'eight_pointed_star', 'calligraphy_border'],
  sounds: ['islamic_celebration.mp3'],
  respectfulTiming: true, // Avoid during prayer times
  communityFocus: true
};

const UZBEK_CELEBRATION_THEME: CelebrationTheme = {
  name: 'uzbek',
  colors: {
    primary: '#0099CC', // Uzbek blue
    secondary: '#FFD700', // Traditional gold
    accent: '#FF6B6B'     // Coral accent
  },
  patterns: ['suzani_flower', 'traditional_geometric', 'cotton_blossom'],
  sounds: ['uzbek_celebration.mp3'],
  collectivistValues: true,
  familyInclusion: true
};
```

## Offline-First Architecture

### Intelligent Sync and Conflict Resolution

#### offlineRankingSync.service.ts
```typescript
class OfflineRankingSyncService {
  private syncQueue: SyncQueueItem[] = [];
  private conflictResolver = new RankingConflictResolver();

  /**
   * Queue ranking updates when offline
   */
  queueRankingUpdate(update: RankingUpdate): void {
    const queueItem: SyncQueueItem = {
      id: generateId(),
      type: 'ranking_update',
      data: update,
      timestamp: new Date(),
      retries: 0,
      priority: update.isPersonal ? 'high' : 'normal'
    };
    
    this.syncQueue.push(queueItem);
    this.saveQueueToStorage();
  }

  /**
   * Process sync queue when coming back online
   */
  async processOfflineQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;
    
    // Sort by priority and timestamp
    const sortedQueue = this.syncQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
    
    for (const item of sortedQueue) {
      try {
        await this.processSyncItem(item);
        this.removeFromQueue(item.id);
      } catch (error) {
        await this.handleSyncError(item, error);
      }
    }
  }

  /**
   * Handle conflicts when syncing offline data
   */
  private async handleRankingConflict(
    localUpdate: RankingUpdate,
    serverData: RankingData
  ): Promise<RankingData> {
    const resolution = await this.conflictResolver.resolve({
      local: localUpdate,
      server: serverData,
      strategy: 'merge_with_validation'
    });
    
    return resolution.resolvedData;
  }

  /**
   * Implement offline celebration queue
   */
  queueOfflineCelebration(celebration: CelebrationData): void {
    const queueItem: OfflineCelebrationItem = {
      id: generateId(),
      celebration,
      queuedAt: new Date(),
      showWhenOnline: true
    };
    
    // Store in local storage for later playback
    this.storeOfflineCelebration(queueItem);
  }

  /**
   * Replay celebrations that occurred while offline
   */
  async replayOfflineCelebrations(): Promise<void> {
    const celebrations = await this.getStoredOfflineCelebrations();
    
    for (const item of celebrations) {
      // Show delayed celebration with indication it happened while offline
      await this.celebrationService.showDelayedCelebration({
        ...item.celebration,
        offlineNotice: true,
        originalTimestamp: item.queuedAt
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Space out celebrations
    }
    
    // Clear stored celebrations
    await this.clearStoredCelebrations();
  }
}

/**
 * Conflict resolution strategies for ranking data
 */
class RankingConflictResolver {
  /**
   * Resolve conflicts between offline and server ranking data
   */
  async resolve(conflict: RankingConflict): Promise<ConflictResolution> {
    switch (conflict.strategy) {
      case 'server_wins':
        return { resolvedData: conflict.server, strategy: 'server_wins' };
        
      case 'local_wins':
        return { resolvedData: this.applyLocalChanges(conflict.server, conflict.local), strategy: 'local_wins' };
        
      case 'merge_with_validation':
        return await this.intelligentMerge(conflict.local, conflict.server);
        
      case 'user_choice':
        return await this.presentUserChoice(conflict);
        
      default:
        return this.defaultResolution(conflict);
    }
  }

  /**
   * Intelligent merge that preserves important local changes
   */
  private async intelligentMerge(
    local: RankingUpdate,
    server: RankingData
  ): Promise<ConflictResolution> {
    const merged: RankingData = { ...server };
    
    // Preserve local achievements that may not have synced
    if (local.achievements) {
      merged.achievements = this.mergeAchievements(server.achievements, local.achievements);
    }
    
    // Preserve local progress that's more recent
    if (local.progress && local.timestamp > server.lastUpdated) {
      merged.progress = { ...merged.progress, ...local.progress };
    }
    
    // Validate merged data doesn't create impossible states
    const validated = await this.validateRankingData(merged);
    
    return {
      resolvedData: validated,
      strategy: 'intelligent_merge',
      conflicts: this.identifyRemainingConflicts(local, validated)
    };
  }
}
```

## Performance Optimization

### Animation Performance and GPU Acceleration

#### performanceOptimizer.service.ts
```typescript
class AnimationPerformanceOptimizer {
  private runningAnimations = new Set<string>();
  private animationPool = new Map<string, Animated.Value>();
  
  /**
   * Optimize celebration animations for 60fps performance
   */
  optimizeCelebrationAnimation(
    animationType: CelebrationAnimationType,
    options: AnimationOptions
  ): OptimizedAnimation {
    // Use GPU-accelerated properties only
    const gpuOptimizedProps = this.ensureGPUAcceleration(animationType);
    
    // Implement object pooling for frequent animations
    const animatedValues = this.getPooledAnimationValues(animationType);
    
    // Configure for optimal performance
    return {
      ...gpuOptimizedProps,
      useNativeDriver: true, // Essential for GPU acceleration
      animatedValues,
      cleanup: () => this.returnToPool(animationType, animatedValues)
    };
  }

  /**
   * Ensure animations use GPU-accelerated properties only
   */
  private ensureGPUAcceleration(animationType: CelebrationAnimationType): AnimationConfig {
    // Only transform and opacity are GPU-accelerated
    const allowedProperties = ['translateX', 'translateY', 'scale', 'rotate', 'opacity'];
    
    return {
      properties: allowedProperties,
      useNativeDriver: true,
      hardware: 'gpu'
    };
  }

  /**
   * Memory management for animation values
   */
  private getPooledAnimationValues(animationType: string): AnimationValueSet {
    const poolKey = `${animationType}_pool`;
    
    if (this.animationPool.has(poolKey)) {
      return this.animationPool.get(poolKey)!;
    }
    
    const values = this.createAnimationValueSet(animationType);
    this.animationPool.set(poolKey, values);
    
    return values;
  }

  /**
   * Reduce motion support for accessibility
   */
  adaptForReducedMotion(
    animation: CelebrationAnimation,
    reducedMotionSetting: ReducedMotionSetting
  ): CelebrationAnimation {
    switch (reducedMotionSetting) {
      case 'system':
        return this.respectSystemReducedMotion(animation);
        
      case 'always':
        return this.createStaticAlternative(animation);
        
      case 'never':
        return animation;
        
      default:
        return animation;
    }
  }

  /**
   * Monitor animation performance and adjust
   */
  monitorAndOptimize(): void {
    // Track frame rate during animations
    const frameRateMonitor = new FrameRateMonitor();
    
    frameRateMonitor.onFrameDrop((droppedFrames) => {
      if (droppedFrames > 3) {
        // Reduce animation complexity
        this.reduceAnimationComplexity();
      }
    });
  }
}

/**
 * Memory-efficient leaderboard rendering with virtualization
 */
class LeaderboardVirtualization {
  private visibleRange = { start: 0, end: 10 };
  private itemHeight = 80;
  
  /**
   * Implement virtual scrolling for large leaderboards
   */
  getVirtualizedItems(
    allItems: LeaderboardItem[],
    scrollOffset: number,
    containerHeight: number
  ): VirtualizedLeaderboardData {
    const startIndex = Math.max(0, Math.floor(scrollOffset / this.itemHeight) - 2);
    const endIndex = Math.min(
      allItems.length - 1,
      startIndex + Math.ceil(containerHeight / this.itemHeight) + 4
    );
    
    return {
      visibleItems: allItems.slice(startIndex, endIndex),
      totalHeight: allItems.length * this.itemHeight,
      offsetY: startIndex * this.itemHeight,
      indices: { start: startIndex, end: endIndex }
    };
  }

  /**
   * Optimize image loading for leaderboard avatars
   */
  optimizeAvatarLoading(items: LeaderboardItem[]): LeaderboardItem[] {
    return items.map(item => ({
      ...item,
      avatar: {
        ...item.avatar,
        // Preload only visible items
        preload: this.isInVisibleRange(item.position),
        // Use appropriate sizes
        size: this.getOptimalAvatarSize()
      }
    }));
  }
}
```

## Cultural Integration Architecture

### Islamic Values and Uzbek Traditions Service Layer

#### culturalAdaptation.service.ts
```typescript
class CulturalAdaptationService {
  /**
   * Adapt ranking system for Islamic values
   * Emphasize community benefit over individual competition
   */
  adaptForIslamicValues(
    rankingData: RankingData,
    islamicSettings: IslamicSettings
  ): RankingData {
    const adapted = { ...rankingData };
    
    if (islamicSettings.emphasizeCommunityBenefit) {
      // Add community contribution metrics
      adapted.communityScore = this.calculateCommunityContribution(rankingData);
      
      // Reweight individual metrics to include community impact
      adapted.adjustedScore = this.reweightForCommunityImpact(
        rankingData.individualScore,
        adapted.communityScore
      );
    }
    
    if (islamicSettings.respectPrayerTimes) {
      // Adjust competition timing around prayer schedules
      adapted.competitionSchedule = this.adjustForPrayerTimes(
        rankingData.schedule,
        await this.getPrayerTimes()
      );
    }
    
    return adapted;
  }

  /**
   * Integrate Islamic calendar events with celebrations
   */
  async getIslamicCalendarEvents(dateRange: DateRange): Promise<IslamicEvent[]> {
    const events = await this.islamicCalendarService.getEvents(dateRange);
    
    return events.map(event => ({
      ...event,
      celebrationAdaptations: this.createIslamicCelebrationAdaptations(event),
      educationalOpportunities: this.createEducationalTieIns(event)
    }));
  }

  /**
   * Create respectful Islamic celebration themes
   */
  createIslamicCelebrationAdaptations(event: IslamicEvent): CelebrationAdaptation {
    return {
      visualTheme: {
        colors: this.getIslamicColors(event.type),
        patterns: this.getAppropriateGeometricPatterns(event),
        typography: this.getArabicCalligraphyElements(event)
      },
      audioTheme: {
        soundEffects: this.getRespectfulSounds(event),
        musicInstruments: this.getHalalInstruments()
      },
      messagingTheme: {
        congratulations: this.getIslamicCongratulationMessages(event),
        encouragement: this.getIslamicEncouragementMessages(),
        community: this.getCommunityFocusedMessages(event)
      },
      behavioralGuidance: {
        emphasizeGratitude: true,
        promoteSharing: true,
        encourageReflection: true
      }
    };
  }

  /**
   * Adapt rewards system for Islamic compliance
   */
  validateRewardIslamicCompliance(reward: RewardItem): IslamicComplianceResult {
    const compliance: IslamicComplianceResult = {
      compliant: true,
      issues: [],
      adaptations: []
    };
    
    // Check for non-halal content
    if (this.containsNonHalalElements(reward)) {
      compliance.compliant = false;
      compliance.issues.push('Contains non-halal elements');
      compliance.adaptations.push('Replace with halal alternative');
    }
    
    // Check for excessive materialism
    if (this.isExcessivelyMaterialistic(reward)) {
      compliance.issues.push('May promote excessive materialism');
      compliance.adaptations.push('Add charitable component or educational value');
    }
    
    // Suggest Islamic alternatives
    compliance.islamicAlternatives = this.suggestIslamicAlternatives(reward);
    
    return compliance;
  }

  /**
   * Integrate Uzbek cultural traditions
   */
  adaptForUzbekTraditions(
    gamificationElements: GamificationElements,
    uzbekSettings: UzbekSettings
  ): GamificationElements {
    const adapted = { ...gamificationElements };
    
    if (uzbekSettings.emphasizeCollectivism) {
      // Transform individual achievements to group achievements
      adapted.achievements = this.addCollectiveAchievements(adapted.achievements);
      
      // Adjust ranking to show family/community progress
      adapted.rankings = this.addFamilyRankings(adapted.rankings);
    }
    
    if (uzbekSettings.includeTraditions) {
      // Add traditional Uzbek celebration elements
      adapted.celebrations = this.addUzbekCelebrationElements(adapted.celebrations);
      
      // Include traditional values in achievement categories
      adapted.valueBasedAchievements = this.createUzbekValueAchievements();
    }
    
    return adapted;
  }

  /**
   * Create Uzbek traditional celebration elements
   */
  createUzbekCelebrationElements(): UzbekCelebrationElement[] {
    return [
      {
        type: 'suzani_pattern',
        description: 'Traditional Uzbek embroidery pattern',
        usage: 'Background decoration for major achievements',
        colors: ['#0099CC', '#FFD700', '#FF6B6B'] // Traditional Uzbek colors
      },
      {
        type: 'cotton_blossom',
        description: 'Symbol of Uzbekistan cotton heritage',
        usage: 'Growth and progress celebrations',
        meaning: 'Continuous growth and contribution'
      },
      {
        type: 'traditional_hospitality',
        description: 'Uzbek hospitality tradition',
        usage: 'Welcoming new students or helping peers',
        values: ['generosity', 'community_care', 'respect_for_guests']
      }
    ];
  }

  /**
   * Multilingual support for cultural context
   */
  async getLocalizedContent(
    content: ContentItem,
    language: SupportedLanguage,
    culturalContext: CulturalContext
  ): Promise<LocalizedContent> {
    const baseTranslation = await this.translationService.translate(content, language);
    
    // Add cultural context adaptations
    if (culturalContext.uzbek) {
      baseTranslation.culturalNotes = await this.addUzbekCulturalContext(content);
    }
    
    if (culturalContext.islamic) {
      baseTranslation.islamicContext = await this.addIslamicContext(content);
    }
    
    // Ensure culturally appropriate phrasing
    baseTranslation.text = await this.adaptPhrasing(baseTranslation.text, culturalContext);
    
    return baseTranslation;
  }

  /**
   * Family engagement integration respecting cultural hierarchies
   */
  createFamilyEngagementFeatures(culturalSettings: CulturalSettings): FamilyFeatures {
    return {
      parentalNotifications: {
        frequency: culturalSettings.familyInvolvement.high ? 'daily' : 'weekly',
        content: this.getFamilyAppropriateContent(culturalSettings),
        language: culturalSettings.familyLanguage || 'russian'
      },
      respectForAuthority: {
        teacherOverride: true,
        parentalControls: this.getParentalControlsForCulture(culturalSettings),
        elderRespect: culturalSettings.uzbek.respectForElders
      },
      collectiveAchievements: {
        familyMilestones: this.createFamilyMilestones(),
        communityContributions: this.createCommunityContributionTracking(),
        shareableAchievements: this.createShareableAchievements(culturalSettings)
      }
    };
  }
}

/**
 * Prayer time integration service
 */
class PrayerTimeService {
  /**
   * Adjust competitive elements around prayer times
   */
  async adjustForPrayerTimes(schedule: CompetitionSchedule): Promise<CompetitionSchedule> {
    const prayerTimes = await this.getTodaysPrayerTimes();
    
    return {
      ...schedule,
      pausedDuring: prayerTimes.map(prayer => ({
        start: prayer.time,
        duration: 30, // 30 minute buffer
        reason: 'prayer_time',
        respectful: true
      })),
      notifications: {
        ...schedule.notifications,
        beforePrayer: 'Competition paused for prayer time',
        afterPrayer: 'Welcome back! Competition resumed'
      }
    };
  }
}
```

## Security and Privacy Architecture

### Age-Appropriate Privacy Controls

#### privacyManager.service.ts  
```typescript
class RankingPrivacyManager {
  /**
   * Age-appropriate privacy controls
   * Elementary: Full protection, Middle: Guided choices, High: Full control
   */
  getPrivacyOptionsForAge(ageGroup: AgeGroup): PrivacyOption[] {
    switch (ageGroup) {
      case 'elementary':
        return [
          {
            id: 'safe_mode',
            name: 'Safe Mode',
            description: 'Only you and teachers can see your progress',
            enabled: true,
            locked: true, // Cannot be changed by student
            features: {
              hideRanking: true,
              showProgressOnly: true,
              parentalNotification: true,
              peerVisibilityBlocked: true
            }
          }
        ];
        
      case 'middle':
        return [
          {
            id: 'guided_sharing',
            name: 'Share with Friends',
            description: 'Friends can see your achievements',
            enabled: false,
            parentalApproval: true,
            features: {
              friendsOnly: true,
              teacherVisibility: true,
              publicLeaderboardOptOut: true
            }
          },
          {
            id: 'private_mode',
            name: 'Keep Private',
            description: 'Only teachers can see your progress',
            enabled: true,
            features: {
              hideFromPeers: true,
              showPersonalProgress: true
            }
          }
        ];
        
      case 'high':
        return [
          {
            id: 'full_public',
            name: 'Public Profile',
            description: 'Share achievements with the school community',
            enabled: false,
            studentChoice: true
          },
          {
            id: 'selective_sharing',
            name: 'Choose What to Share',
            description: 'Pick which achievements to make public',
            enabled: false,
            granularControls: true
          },
          {
            id: 'anonymous_participation',
            name: 'Anonymous Participation',
            description: 'Participate in rankings without revealing identity',
            enabled: false
          }
        ];
        
      default:
        return this.getDefaultPrivacyOptions();
    }
  }

  /**
   * Implement healthy competition safeguards
   */
  applySafetyMeasures(
    rankingData: RankingData,
    studentProfile: StudentProfile
  ): SafeRankingData {
    const safeguards = this.calculateNeededSafeguards(studentProfile);
    
    let safeData = { ...rankingData };
    
    // Prevent "permanent loser" scenarios
    if (safeguards.preventPermanentLowRanking) {
      safeData = this.applyRankingFloorProtection(safeData);
    }
    
    // Limit extreme competition visibility
    if (safeguards.limitCompetitionExposure) {
      safeData = this.applyCompetitionLimits(safeData);
    }
    
    // Add encouragement and support resources
    if (safeguards.needsAdditionalSupport) {
      safeData.supportResources = this.generateSupportResources(studentProfile);
    }
    
    return safeData;
  }

  /**
   * Monitor for unhealthy competitive behavior
   */
  monitorCompetitiveBehavior(
    student: Student,
    behaviorMetrics: BehaviorMetrics
  ): BehaviorAssessment {
    const assessment = {
      healthyCompetition: true,
      concerns: [],
      interventions: []
    };
    
    // Check for obsessive checking
    if (behaviorMetrics.leaderboardChecksPerDay > 20) {
      assessment.healthyCompetition = false;
      assessment.concerns.push('excessive_leaderboard_checking');
      assessment.interventions.push('reduce_leaderboard_update_frequency');
    }
    
    // Check for social isolation due to competition
    if (behaviorMetrics.peerInteractionDecline > 30) {
      assessment.concerns.push('competition_affecting_social_relationships');
      assessment.interventions.push('emphasize_collaborative_achievements');
    }
    
    // Check for academic focus narrowing (gaming the system)
    if (behaviorMetrics.skillBreadthDecline > 25) {
      assessment.concerns.push('gaming_ranking_system');
      assessment.interventions.push('diversify_ranking_dimensions');
    }
    
    return assessment;
  }
}

/**
 * COPPA compliance for students under 13
 */
class COPPAComplianceService {
  /**
   * Ensure COPPA compliance for ranking data
   */
  ensureCOPPACompliance(
    student: Student,
    rankingData: RankingData
  ): COPPACompliantData {
    if (student.age < 13) {
      return {
        ...rankingData,
        personallyIdentifiableInformation: this.stripPII(rankingData),
        parentalConsent: this.verifyParentalConsent(student),
        dataRetention: this.applyCOPPARetentionLimits(rankingData),
        thirdPartySharing: false, // No sharing with third parties
        behavioralAdvertising: false // No behavioral profiling
      };
    }
    
    return rankingData;
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- **Week 1:** Core ranking store implementation with Zustand
- **Week 1:** Basic leaderboard screen with age-adaptive layouts
- **Week 2:** Real-time subscription architecture with Supabase
- **Week 2:** Cultural preferences service and Islamic calendar integration

### Phase 2: Core Features (Weeks 3-4) 
- **Week 3:** Multi-dimensional ranking system implementation
- **Week 3:** Rewards catalog and coin economy system
- **Week 4:** Achievement badge system with unlock animations
- **Week 4:** Privacy controls and safety measures

### Phase 3: Celebrations and Culture (Weeks 5-6)
- **Week 5:** React Native Reanimated celebration animations
- **Week 5:** Islamic and Uzbek cultural celebration themes
- **Week 6:** Variable reward schedule implementation
- **Week 6:** Behavioral psychology optimization

### Phase 4: Optimization and Polish (Weeks 7-8)
- **Week 7:** Performance optimization and GPU acceleration
- **Week 7:** Offline-first architecture and conflict resolution
- **Week 8:** Comprehensive testing across age groups
- **Week 8:** Analytics and behavioral insights implementation

## Performance Targets

Based on UX research findings and mobile performance best practices:

- **Load Time:** <2s for leaderboard screen
- **Animation Performance:** 60fps celebration animations with GPU acceleration  
- **Real-time Updates:** <500ms from server event to UI update
- **Offline Functionality:** 95%+ feature availability when offline
- **Memory Usage:** <50MB additional memory for ranking/rewards features
- **Battery Impact:** <3% additional battery drain per hour of active use
- **Cultural Accuracy:** 100% Islamic/Uzbek cultural validation by community reviewers

## Key Architectural Benefits

1. **Psychologically Sound:** Based on Self-Determination Theory and Achievement Goal Theory research
2. **Culturally Respectful:** Deep integration of Islamic values and Uzbek traditions
3. **Age-Appropriate:** Distinct experiences optimized for different developmental stages
4. **Performance Optimized:** GPU-accelerated animations targeting 60fps
5. **Offline-First:** Robust offline functionality with intelligent conflict resolution
6. **Privacy Protected:** COPPA compliant with age-appropriate privacy controls
7. **Behaviorally Optimized:** Variable reward schedules prevent novelty effect burnout
8. **Real-time Reactive:** Optimal update frequency based on engagement research
9. **Celebration Rich:** Culturally-appropriate celebration system promotes intrinsic motivation
10. **Safety First:** Built-in safeguards prevent unhealthy competitive behavior

This comprehensive mobile architecture provides a solid foundation for implementing an engaging, culturally-sensitive, and psychologically sound ranking and rewards system that will motivate Harry School students while respecting their cultural values and supporting their holistic development as learners and community members.