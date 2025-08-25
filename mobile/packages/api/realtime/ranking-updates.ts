/**
 * Harry School CRM - Real-time Ranking Updates Service
 * Handles live student rankings, leaderboards, and point calculations
 * 
 * Features Islamic values integration and cultural celebrations
 */

import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeEvent, RealtimeSubscriptionsService } from './subscriptions';

// Types and Interfaces
export interface StudentRanking {
  id: string;
  studentId: string;
  studentName: string;
  currentRank: number;
  previousRank: number;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  categoryBreakdown: {
    academic: number;
    behavior: number;
    participation: number;
    islamic_values: number;
    helping_others: number;
    attendance: number;
  };
  achievements: string[];
  badges: RankingBadge[];
  trendDirection: 'up' | 'down' | 'stable';
  lastUpdated: string;
  organizationId: string;
}

export interface RankingBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
  category: 'academic' | 'behavior' | 'islamic' | 'leadership' | 'special';
  points: number;
  culturalContext?: string;
}

export interface RankingUpdate {
  type: 'points_added' | 'rank_changed' | 'achievement_earned' | 'badge_awarded';
  studentId: string;
  details: {
    pointsAdded?: number;
    newRank?: number;
    oldRank?: number;
    achievement?: string;
    badge?: RankingBadge;
    reason?: string;
    islamicValue?: string;
  };
  timestamp: string;
  celebrationType?: 'none' | 'small' | 'medium' | 'large';
}

export interface LeaderboardConfig {
  type: 'class' | 'grade' | 'school' | 'islamic_values';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  maxStudents: number;
  includeCategories: string[];
  culturalFilters: {
    respectPrivacy: boolean;
    anonymizeMode: boolean;
    islamicFocus: boolean;
  };
}

export interface RankingCelebration {
  id: string;
  studentId: string;
  type: 'rank_improvement' | 'milestone_reached' | 'islamic_achievement' | 'helping_milestone';
  title: string;
  message: string;
  animations: string[];
  soundEffect?: string;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  culturalElements: {
    islamicTheme: boolean;
    arabicText?: string;
    dua?: string;
  };
}

// Real-time Ranking Updates Service
export class RankingUpdatesService extends EventEmitter {
  private realtimeService: RealtimeSubscriptionsService;
  private cachedRankings: Map<string, StudentRanking> = new Map();
  private subscriptionId: string | null = null;
  private updateQueue: RankingUpdate[] = [];
  private celebrationQueue: RankingCelebration[] = [];
  private isProcessing = false;

  constructor(realtimeService: RealtimeSubscriptionsService) {
    super();
    this.realtimeService = realtimeService;
    this.initializeService();
  }

  // Service Initialization
  private async initializeService(): Promise<void> {
    try {
      // Load cached rankings
      await this.loadCachedRankings();
      
      // Subscribe to ranking events
      await this.subscribeToRankingEvents();
      
      // Start processing queue
      this.startQueueProcessor();
      
      console.log('Ranking Updates Service initialized');
    } catch (error) {
      console.error('Failed to initialize Ranking Updates Service:', error);
    }
  }

  // Event Subscriptions
  private async subscribeToRankingEvents(): Promise<void> {
    const eventTypes = [
      'ranking_updated',
      'achievement_earned',
      'student_progress'
    ];

    this.subscriptionId = await this.realtimeService.subscribeToEvents(
      eventTypes,
      (event: RealtimeEvent) => this.handleRankingEvent(event)
    );
  }

  // Event Handlers
  private async handleRankingEvent(event: RealtimeEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'ranking_updated':
          await this.handleRankingUpdated(event);
          break;
        case 'achievement_earned':
          await this.handleAchievementEarned(event);
          break;
        case 'student_progress':
          await this.handleStudentProgress(event);
          break;
      }
    } catch (error) {
      console.error('Error handling ranking event:', error);
    }
  }

  private async handleRankingUpdated(event: RealtimeEvent): Promise<void> {
    const payload = event.payload;
    
    if (payload.type === 'points_update') {
      await this.processPointsUpdate(payload.data, payload.previous);
    } else {
      await this.processRankingChange(payload);
    }
  }

  private async handleAchievementEarned(event: RealtimeEvent): Promise<void> {
    const achievement = event.payload;
    
    const update: RankingUpdate = {
      type: 'achievement_earned',
      studentId: achievement.student_id,
      details: {
        achievement: achievement.achievement_name,
        pointsAdded: achievement.points_awarded,
        reason: achievement.description,
        islamicValue: achievement.islamic_value,
      },
      timestamp: event.timestamp,
      celebrationType: this.calculateCelebrationType(achievement),
    };

    await this.queueRankingUpdate(update);
    await this.createCelebration(update);
  }

  private async handleStudentProgress(event: RealtimeEvent): Promise<void> {
    const progress = event.payload;
    
    // Check if progress warrants ranking update
    if (progress.points_change && progress.points_change > 0) {
      const update: RankingUpdate = {
        type: 'points_added',
        studentId: progress.student_id,
        details: {
          pointsAdded: progress.points_change,
          reason: progress.reason || 'Academic progress',
        },
        timestamp: event.timestamp,
        celebrationType: progress.points_change >= 10 ? 'medium' : 'small',
      };

      await this.queueRankingUpdate(update);
    }
  }

  // Points and Ranking Processing
  private async processPointsUpdate(newData: any, previousData: any): Promise<void> {
    const pointsAdded = newData.total_points - (previousData?.total_points || 0);
    
    if (pointsAdded <= 0) return;

    const update: RankingUpdate = {
      type: 'points_added',
      studentId: newData.student_id,
      details: {
        pointsAdded,
        reason: newData.reason || 'Points awarded',
      },
      timestamp: new Date().toISOString(),
      celebrationType: this.calculateCelebrationType({ points_awarded: pointsAdded }),
    };

    await this.queueRankingUpdate(update);
    
    // Check for rank changes
    await this.checkRankChanges(newData.student_id);
  }

  private async processRankingChange(rankingData: any): Promise<void> {
    const cached = this.cachedRankings.get(rankingData.student_id);
    const newRank = rankingData.current_rank;
    const oldRank = cached?.currentRank || rankingData.previous_rank;

    if (newRank !== oldRank) {
      const update: RankingUpdate = {
        type: 'rank_changed',
        studentId: rankingData.student_id,
        details: {
          newRank,
          oldRank,
          reason: newRank < oldRank ? 'Rank improved!' : 'Rank changed',
        },
        timestamp: new Date().toISOString(),
        celebrationType: newRank < oldRank ? 'large' : 'small',
      };

      await this.queueRankingUpdate(update);
      await this.createCelebration(update);
    }

    // Update cached ranking
    await this.updateCachedRanking(rankingData);
  }

  private async checkRankChanges(studentId: string): Promise<void> {
    try {
      // This would fetch the latest ranking from the database
      // For now, we'll simulate the check
      const currentRanking = await this.fetchStudentRanking(studentId);
      const cached = this.cachedRankings.get(studentId);

      if (currentRanking && cached && currentRanking.currentRank !== cached.currentRank) {
        const update: RankingUpdate = {
          type: 'rank_changed',
          studentId,
          details: {
            newRank: currentRanking.currentRank,
            oldRank: cached.currentRank,
            reason: currentRanking.currentRank < cached.currentRank ? 'Rank improved!' : 'Rank changed',
          },
          timestamp: new Date().toISOString(),
          celebrationType: currentRanking.currentRank < cached.currentRank ? 'large' : 'small',
        };

        await this.queueRankingUpdate(update);
        await this.createCelebration(update);
      }
    } catch (error) {
      console.error('Error checking rank changes:', error);
    }
  }

  // Celebration Management
  private async createCelebration(update: RankingUpdate): Promise<void> {
    if (update.celebrationType === 'none') return;

    const celebration = await this.generateCelebration(update);
    this.celebrationQueue.push(celebration);
    
    this.emit('celebration_ready', celebration);
  }

  private async generateCelebration(update: RankingUpdate): Promise<RankingCelebration> {
    const isIslamicAchievement = update.details.islamicValue || 
      update.details.achievement?.includes('Islamic') ||
      update.details.achievement?.includes('Helping');

    const celebration: RankingCelebration = {
      id: `celebration_${Date.now()}`,
      studentId: update.studentId,
      type: this.determineCelebrationType(update),
      title: this.generateCelebrationTitle(update),
      message: this.generateCelebrationMessage(update),
      animations: this.selectAnimations(update.celebrationType!, isIslamicAchievement),
      soundEffect: this.selectSoundEffect(update.celebrationType!),
      duration: this.calculateDuration(update.celebrationType!),
      priority: update.celebrationType === 'large' ? 'high' : 'medium',
      culturalElements: {
        islamicTheme: isIslamicAchievement,
        arabicText: isIslamicAchievement ? this.getArabicCelebration(update) : undefined,
        dua: isIslamicAchievement ? this.getDuaForAchievement(update) : undefined,
      },
    };

    return celebration;
  }

  private determineCelebrationType(update: RankingUpdate): RankingCelebration['type'] {
    if (update.details.islamicValue) return 'islamic_achievement';
    if (update.details.achievement?.includes('Helping')) return 'helping_milestone';
    if (update.type === 'rank_changed' && update.details.newRank! < update.details.oldRank!) {
      return 'rank_improvement';
    }
    return 'milestone_reached';
  }

  private generateCelebrationTitle(update: RankingUpdate): string {
    switch (update.type) {
      case 'rank_changed':
        if (update.details.newRank! < update.details.oldRank!) {
          return `🎉 Rank Improved to #${update.details.newRank}!`;
        }
        return `Rank Update: #${update.details.newRank}`;
      
      case 'achievement_earned':
        if (update.details.islamicValue) {
          return `🌟 Masya Allah! Islamic Achievement Earned!`;
        }
        return `🏆 Achievement Unlocked!`;
      
      case 'points_added':
        if (update.details.pointsAdded! >= 50) {
          return `⭐ Amazing! +${update.details.pointsAdded} Points!`;
        }
        return `+${update.details.pointsAdded} Points Earned!`;
      
      default:
        return 'Great Progress!';
    }
  }

  private generateCelebrationMessage(update: RankingUpdate): string {
    const messages = {
      islamic_achievement: [
        "May Allah bless your dedication to Islamic values!",
        "Your good character is shining bright! Barakallahu feeki!",
        "Keep following the beautiful example of Prophet Muhammad (PBUH)!",
      ],
      helping_milestone: [
        "Your kindness to others is truly appreciated!",
        "Helping others is a great act of worship. Well done!",
        "Your caring heart makes our school community stronger!",
      ],
      rank_improvement: [
        "Your hard work is paying off! Keep it up!",
        "Amazing progress! You're an inspiration to others!",
        "Dedication and effort lead to success!",
      ],
      milestone_reached: [
        "Every step forward is progress worth celebrating!",
        "You're building great habits! Keep going!",
        "Consistent effort leads to amazing results!",
      ],
    };

    const type = this.determineCelebrationType(update);
    const typeMessages = messages[type] || messages.milestone_reached;
    
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  }

  private selectAnimations(celebrationType: string, isIslamic: boolean): string[] {
    const baseAnimations = {
      small: ['fadeIn', 'pulse'],
      medium: ['slideInUp', 'bounce', 'sparkle'],
      large: ['zoomIn', 'confetti', 'starBurst', 'celebration'],
    };

    const animations = baseAnimations[celebrationType as keyof typeof baseAnimations] || baseAnimations.small;
    
    if (isIslamic) {
      animations.push('islamicGlow', 'crescentSparkle');
    }

    return animations;
  }

  private selectSoundEffect(celebrationType: string): string {
    const sounds = {
      small: 'gentle_chime.mp3',
      medium: 'success_bell.mp3',
      large: 'celebration_fanfare.mp3',
    };

    return sounds[celebrationType as keyof typeof sounds] || sounds.small;
  }

  private calculateDuration(celebrationType: string): number {
    const durations = {
      small: 2000,   // 2 seconds
      medium: 3500,  // 3.5 seconds
      large: 5000,   // 5 seconds
    };

    return durations[celebrationType as keyof typeof durations] || 2000;
  }

  private getArabicCelebration(update: RankingUpdate): string {
    if (update.details.islamicValue) {
      const arabicPhrases = [
        'ماشاء الله', // Masha Allah
        'بارك الله فيك', // Barakallahu feek
        'أحسنت', // Ahsant (Well done)
        'جزاك الله خيراً', // Jazakallahu khayran
      ];
      
      return arabicPhrases[Math.floor(Math.random() * arabicPhrases.length)];
    }

    return 'أحسنت'; // Default: Well done
  }

  private getDuaForAchievement(update: RankingUpdate): string {
    if (update.details.achievement?.includes('Helping')) {
      return 'اللهم بارك لنا فيما أعطيتنا'; // Allahumma barik lana feema a'tayta
    }
    
    return 'الحمد لله رب العالمين'; // Alhamdulillahi rabbil alameen
  }

  private calculateCelebrationType(achievement: any): RankingUpdate['celebrationType'] {
    const points = achievement.points_awarded || 0;
    
    if (points >= 100 || achievement.islamic_value) return 'large';
    if (points >= 50) return 'medium';
    if (points >= 10) return 'small';
    
    return 'none';
  }

  // Queue Processing
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.updateQueue.length > 0) {
        await this.processUpdateQueue();
      }
    }, 1000); // Process every second
  }

  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift()!;
        await this.processUpdate(update);
      }
    } catch (error) {
      console.error('Error processing update queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processUpdate(update: RankingUpdate): Promise<void> {
    // Emit update event
    this.emit('ranking_update', update);
    
    // Update local cache if needed
    if (update.type === 'rank_changed') {
      await this.updateLocalRankCache(update);
    }
    
    // Save to persistent storage
    await this.saveUpdateToStorage(update);
  }

  private async queueRankingUpdate(update: RankingUpdate): Promise<void> {
    this.updateQueue.push(update);
  }

  // Cache Management
  private async loadCachedRankings(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('student_rankings_cache');
      if (cached) {
        const rankings: StudentRanking[] = JSON.parse(cached);
        rankings.forEach(ranking => {
          this.cachedRankings.set(ranking.studentId, ranking);
        });
      }
    } catch (error) {
      console.error('Failed to load cached rankings:', error);
    }
  }

  private async updateCachedRanking(rankingData: any): Promise<void> {
    const ranking: StudentRanking = {
      id: rankingData.id,
      studentId: rankingData.student_id,
      studentName: rankingData.student_name,
      currentRank: rankingData.current_rank,
      previousRank: rankingData.previous_rank,
      totalPoints: rankingData.total_points,
      weeklyPoints: rankingData.weekly_points,
      monthlyPoints: rankingData.monthly_points,
      categoryBreakdown: rankingData.category_breakdown || {},
      achievements: rankingData.achievements || [],
      badges: rankingData.badges || [],
      trendDirection: this.calculateTrend(rankingData.current_rank, rankingData.previous_rank),
      lastUpdated: new Date().toISOString(),
      organizationId: rankingData.organization_id,
    };

    this.cachedRankings.set(ranking.studentId, ranking);
    await this.saveCachedRankings();
  }

  private async saveCachedRankings(): Promise<void> {
    try {
      const rankings = Array.from(this.cachedRankings.values());
      await AsyncStorage.setItem('student_rankings_cache', JSON.stringify(rankings));
    } catch (error) {
      console.error('Failed to save cached rankings:', error);
    }
  }

  private calculateTrend(currentRank: number, previousRank: number): 'up' | 'down' | 'stable' {
    if (currentRank < previousRank) return 'up';
    if (currentRank > previousRank) return 'down';
    return 'stable';
  }

  private async updateLocalRankCache(update: RankingUpdate): Promise<void> {
    const cached = this.cachedRankings.get(update.studentId);
    if (cached && update.details.newRank) {
      cached.previousRank = cached.currentRank;
      cached.currentRank = update.details.newRank;
      cached.trendDirection = this.calculateTrend(update.details.newRank, cached.previousRank);
      cached.lastUpdated = update.timestamp;
      
      await this.saveCachedRankings();
    }
  }

  // Data Fetching
  private async fetchStudentRanking(studentId: string): Promise<StudentRanking | null> {
    try {
      // This would fetch from Supabase
      // For now, return cached data
      return this.cachedRankings.get(studentId) || null;
    } catch (error) {
      console.error('Failed to fetch student ranking:', error);
      return null;
    }
  }

  private async saveUpdateToStorage(update: RankingUpdate): Promise<void> {
    try {
      const key = `ranking_update_${update.timestamp}`;
      await AsyncStorage.setItem(key, JSON.stringify(update));
    } catch (error) {
      console.error('Failed to save update to storage:', error);
    }
  }

  // Public API Methods
  public async getStudentRanking(studentId: string): Promise<StudentRanking | null> {
    return this.cachedRankings.get(studentId) || null;
  }

  public async getLeaderboard(config: LeaderboardConfig): Promise<StudentRanking[]> {
    const rankings = Array.from(this.cachedRankings.values());
    
    // Apply filters and sorting based on config
    let filtered = rankings.filter(ranking => {
      // Apply cultural filters if needed
      if (config.culturalFilters.anonymizeMode) {
        // Don't return actual data in anonymous mode
        return false;
      }
      return true;
    });

    // Sort by rank
    filtered.sort((a, b) => a.currentRank - b.currentRank);
    
    // Limit results
    return filtered.slice(0, config.maxStudents);
  }

  public async getRecentUpdates(limit: number = 10): Promise<RankingUpdate[]> {
    // This would fetch from storage
    return [];
  }

  public async getCelebrationQueue(): Promise<RankingCelebration[]> {
    return [...this.celebrationQueue];
  }

  public async clearCelebration(celebrationId: string): Promise<void> {
    this.celebrationQueue = this.celebrationQueue.filter(c => c.id !== celebrationId);
  }

  // Cleanup
  public async destroy(): Promise<void> {
    if (this.subscriptionId) {
      await this.realtimeService.unsubscribeFromEvents(this.subscriptionId);
    }
    
    this.removeAllListeners();
    this.updateQueue = [];
    this.celebrationQueue = [];
  }
}

// Export factory function
export function createRankingUpdatesService(
  realtimeService: RealtimeSubscriptionsService
): RankingUpdatesService {
  return new RankingUpdatesService(realtimeService);
}