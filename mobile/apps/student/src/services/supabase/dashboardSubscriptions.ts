/**
 * Student Dashboard Real-Time Subscriptions
 * Harry School Student App
 * 
 * Manages real-time data subscriptions for dashboard components using Supabase
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@harry-school/api';

export interface DashboardSubscription {
  channel: RealtimeChannel;
  cleanup: () => void;
}

export interface StudentRankingData {
  id: string;
  student_id: string;
  total_points: number;
  total_coins: number;
  current_level: number;
  level_progress: number;
  current_rank: number | null;
  class_rank: number | null;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  points_to_next_level: number;
  weekly_points: number;
  monthly_points: number;
  academic_year_points: number;
  updated_at: string;
}

export interface StudentAchievementData {
  id: string;
  student_id: string;
  achievement_id: string;
  earned_date: string;
  points_at_earning: number;
  coins_awarded: number;
  bonus_points_awarded: number;
  earning_context: Record<string, any> | null;
  achievement: {
    name: string;
    description: string;
    icon: string;
    badge_color: string | null;
    background_color: string | null;
    rarity_level: string | null;
    category: string;
  };
}

export interface LeaderboardData {
  organization_id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  total_points: number;
  current_level: number;
  current_rank: number;
  weekly_points: number;
  monthly_points: number;
  computed_rank: number;
}

/**
 * Subscribe to student ranking updates
 */
export function subscribeToStudentRanking(
  studentId: string,
  onUpdate: (data: StudentRankingData) => void,
  onError?: (error: Error) => void
): DashboardSubscription {
  const channel = supabase.channel(`student-ranking-${studentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'student_rankings',
        filter: `student_id=eq.${studentId}`
      },
      (payload) => {
        try {
          if (payload.new) {
            onUpdate(payload.new as StudentRankingData);
          }
        } catch (error) {
          onError?.(error as Error);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('🔄 Student ranking subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Student ranking subscription error');
        onError?.(new Error('Ranking subscription failed'));
      }
    });

  return {
    channel,
    cleanup: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to student achievement updates (recent achievements)
 */
export function subscribeToStudentAchievements(
  studentId: string,
  onUpdate: (data: StudentAchievementData[]) => void,
  onError?: (error: Error) => void
): DashboardSubscription {
  const channel = supabase.channel(`student-achievements-${studentId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'student_achievements',
        filter: `student_id=eq.${studentId}`
      },
      async (payload) => {
        try {
          if (payload.new) {
            // Fetch the complete achievement data with related achievement details
            const { data: achievements, error } = await supabase
              .from('student_achievements')
              .select(`
                *,
                achievement:achievements (
                  name,
                  description,
                  icon,
                  badge_color,
                  background_color,
                  rarity_level,
                  category
                )
              `)
              .eq('student_id', studentId)
              .eq('is_active', true)
              .order('earned_date', { ascending: false })
              .limit(5);

            if (error) throw error;
            onUpdate(achievements as StudentAchievementData[]);
          }
        } catch (error) {
          onError?.(error as Error);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('🏆 Student achievements subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Student achievements subscription error');
        onError?.(new Error('Achievements subscription failed'));
      }
    });

  return {
    channel,
    cleanup: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to leaderboard updates for ranking context
 */
export function subscribeToLeaderboard(
  organizationId: string,
  onUpdate: (data: LeaderboardData[]) => void,
  onError?: (error: Error) => void
): DashboardSubscription {
  const channel = supabase.channel(`leaderboard-${organizationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'student_leaderboard',
        filter: `organization_id=eq.${organizationId}`
      },
      async (payload) => {
        try {
          // Fetch updated leaderboard data
          const { data: leaderboard, error } = await supabase
            .from('student_leaderboard')
            .select('*')
            .eq('organization_id', organizationId)
            .order('computed_rank', { ascending: true })
            .limit(50);

          if (error) throw error;
          onUpdate(leaderboard as LeaderboardData[]);
        } catch (error) {
          onError?.(error as Error);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('📊 Leaderboard subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Leaderboard subscription error');
        onError?.(new Error('Leaderboard subscription failed'));
      }
    });

  return {
    channel,
    cleanup: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to multiple dashboard data sources with intelligent batching
 */
export function subscribeToStudentDashboard(
  studentId: string,
  organizationId: string,
  callbacks: {
    onRankingUpdate: (data: StudentRankingData) => void;
    onAchievementsUpdate: (data: StudentAchievementData[]) => void;
    onLeaderboardUpdate: (data: LeaderboardData[]) => void;
    onError?: (error: Error, source: string) => void;
  }
): DashboardSubscription[] {
  
  // Create individual subscriptions with error handling
  const rankingSubscription = subscribeToStudentRanking(
    studentId,
    callbacks.onRankingUpdate,
    (error) => callbacks.onError?.(error, 'ranking')
  );

  const achievementsSubscription = subscribeToStudentAchievements(
    studentId,
    callbacks.onAchievementsUpdate,
    (error) => callbacks.onError?.(error, 'achievements')
  );

  const leaderboardSubscription = subscribeToLeaderboard(
    organizationId,
    callbacks.onLeaderboardUpdate,
    (error) => callbacks.onError?.(error, 'leaderboard')
  );

  return [
    rankingSubscription,
    achievementsSubscription,
    leaderboardSubscription
  ];
}

/**
 * Cleanup all dashboard subscriptions
 */
export function cleanupDashboardSubscriptions(subscriptions: DashboardSubscription[]): void {
  subscriptions.forEach(subscription => {
    try {
      subscription.cleanup();
    } catch (error) {
      console.warn('⚠️ Error cleaning up subscription:', error);
    }
  });
}

/**
 * Get initial dashboard data (non-reactive)
 */
export async function getInitialDashboardData(studentId: string, organizationId: string) {
  try {
    // Fetch all data in parallel
    const [rankingResult, achievementsResult, leaderboardResult] = await Promise.allSettled([
      // Student ranking data
      supabase
        .from('student_rankings')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .single(),

      // Recent achievements (last 5)
      supabase
        .from('student_achievements')
        .select(`
          *,
          achievement:achievements (
            name,
            description,
            icon,
            badge_color,
            background_color,
            rarity_level,
            category
          )
        `)
        .eq('student_id', studentId)
        .eq('is_active', true)
        .order('earned_date', { ascending: false })
        .limit(5),

      // Leaderboard context (top 50)
      supabase
        .from('student_leaderboard')
        .select('*')
        .eq('organization_id', organizationId)
        .order('computed_rank', { ascending: true })
        .limit(50)
    ]);

    return {
      ranking: rankingResult.status === 'fulfilled' ? rankingResult.value.data : null,
      achievements: achievementsResult.status === 'fulfilled' ? achievementsResult.value.data : [],
      leaderboard: leaderboardResult.status === 'fulfilled' ? leaderboardResult.value.data : [],
      errors: [
        rankingResult.status === 'rejected' ? rankingResult.reason : null,
        achievementsResult.status === 'rejected' ? achievementsResult.reason : null,
        leaderboardResult.status === 'rejected' ? leaderboardResult.reason : null,
      ].filter(Boolean)
    };
  } catch (error) {
    console.error('❌ Failed to fetch initial dashboard data:', error);
    throw error;
  }
}

/**
 * Health check for Supabase real-time connection
 */
export function checkRealtimeHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const testChannel = supabase.channel('health-check')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          supabase.removeChannel(testChannel);
          resolve(true);
        } else if (status === 'CHANNEL_ERROR') {
          resolve(false);
        }
      });

    // Timeout after 5 seconds
    setTimeout(() => {
      supabase.removeChannel(testChannel);
      resolve(false);
    }, 5000);
  });
}

/**
 * Optimized subscription manager with connection pooling
 */
export class DashboardSubscriptionManager {
  private subscriptions: Map<string, DashboardSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isHealthy = true;

  async subscribe(
    key: string,
    studentId: string,
    organizationId: string,
    callbacks: {
      onRankingUpdate: (data: StudentRankingData) => void;
      onAchievementsUpdate: (data: StudentAchievementData[]) => void;
      onLeaderboardUpdate: (data: LeaderboardData[]) => void;
      onError?: (error: Error, source: string) => void;
    }
  ): Promise<void> {
    // Check if already subscribed
    if (this.subscriptions.has(key)) {
      console.log('📡 Dashboard subscription already active');
      return;
    }

    try {
      // Health check before subscribing
      this.isHealthy = await checkRealtimeHealth();
      
      if (!this.isHealthy && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`🔄 Attempting reconnection (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        await this.delay(Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
        this.reconnectAttempts++;
        return this.subscribe(key, studentId, organizationId, callbacks);
      }

      if (!this.isHealthy) {
        throw new Error('Supabase real-time connection unhealthy');
      }

      // Create subscriptions
      const dashboardSubscriptions = subscribeToStudentDashboard(
        studentId,
        organizationId,
        {
          ...callbacks,
          onError: (error, source) => {
            this.isHealthy = false;
            callbacks.onError?.(error, source);
          }
        }
      );

      // Store subscription group
      this.subscriptions.set(key, {
        channel: dashboardSubscriptions[0].channel, // Primary channel for reference
        cleanup: () => cleanupDashboardSubscriptions(dashboardSubscriptions)
      });

      this.reconnectAttempts = 0; // Reset on successful connection
      console.log('✅ Dashboard subscriptions established successfully');

    } catch (error) {
      console.error('❌ Failed to establish dashboard subscriptions:', error);
      callbacks.onError?.(error as Error, 'subscription-manager');
    }
  }

  unsubscribe(key: string): void {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.cleanup();
      this.subscriptions.delete(key);
      console.log('🔌 Dashboard subscription cleaned up');
    }
  }

  unsubscribeAll(): void {
    for (const [key] of this.subscriptions) {
      this.unsubscribe(key);
    }
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  isConnected(): boolean {
    return this.isHealthy;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance for app-wide use
export const dashboardSubscriptionManager = new DashboardSubscriptionManager();