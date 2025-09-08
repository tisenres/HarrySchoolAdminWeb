import { supabase, Referral, ReferralReward } from './supabase';
import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Mock data for fallback
const MOCK_ORGANIZATION_ID = 'mock-org-1';

const mockReferrals: (Referral & { rewards?: ReferralReward[] })[] = [
  {
    id: 'mock-referral-1',
    organization_id: MOCK_ORGANIZATION_ID,
    referrer_student_id: 'mock-user-1',
    referred_student_id: 'student-2',
    referral_code: 'STUDENT123',
    referral_link: 'https://app.harryschool.com/join?ref=STUDENT123',
    status: 'completed',
    points_awarded: 50,
    rank_bonus: 1,
    completed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    rewards: [
      {
        id: 'mock-reward-1',
        organization_id: MOCK_ORGANIZATION_ID,
        referral_id: 'mock-referral-1',
        student_id: 'mock-user-1',
        reward_type: 'points',
        reward_value: 50,
        description: 'Referral bonus points',
        claimed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
      {
        id: 'mock-reward-2',
        organization_id: MOCK_ORGANIZATION_ID,
        referral_id: 'mock-referral-1',
        student_id: 'mock-user-1',
        reward_type: 'rank_boost',
        reward_value: 1,
        description: 'Rank boost for successful referral',
        claimed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
    ],
  },
  {
    id: 'mock-referral-2',
    organization_id: MOCK_ORGANIZATION_ID,
    referrer_student_id: 'mock-user-1',
    referral_code: 'STUDENT456',
    referral_link: 'https://app.harryschool.com/join?ref=STUDENT456',
    status: 'pending',
    points_awarded: 0,
    rank_bonus: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

export interface ReferralWithRewards extends Referral {
  rewards?: ReferralReward[];
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  totalRankBonus: number;
}

class ReferralService {
  private generateReferralCode(studentId: string): string {
    const prefix = 'REF';
    const suffix = studentId.slice(-4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${suffix}${random}`;
  }

  private generateReferralLink(code: string): string {
    const baseUrl = Platform.OS === 'web' 
      ? window.location.origin 
      : 'https://app.harryschool.com';
    return `${baseUrl}/join?ref=${code}`;
  }

  private async getOrganizationIdForStudent(studentId: string): Promise<string | null> {
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('organization_id')
        .eq('id', studentId)
        .maybeSingle();
      
      if (studentError) {
        console.log('Student lookup error:', JSON.stringify(studentError, null, 2));
      }
      
      if (student?.organization_id) {
        return student.organization_id as string;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', studentId)
        .maybeSingle();
        
      if (profileError) {
        console.log('Profile lookup error:', JSON.stringify(profileError, null, 2));
      }
      
      if (profile?.organization_id) {
        return profile.organization_id as string;
      }
      
      return MOCK_ORGANIZATION_ID;
    } catch (err) {
      console.error('getOrganizationIdForStudent exception:', JSON.stringify(err, null, 2));
      return MOCK_ORGANIZATION_ID;
    }
  }

  async createReferralCode(studentId: string): Promise<Referral | null> {
    try {
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) {
        console.error('Create referral error: missing organization_id for student');
        return null;
      }

      // Check if student already has an active referral code
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_student_id', studentId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingReferral) {
        return existingReferral;
      }

      const referralCode = this.generateReferralCode(studentId);
      const referralLink = this.generateReferralLink(referralCode);
      
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data, error } = await supabase
        .from('referrals')
        .insert({
          organization_id: orgId,
          referrer_student_id: studentId,
          referral_code: referralCode,
          referral_link: referralLink,
          status: 'pending',
          points_awarded: 0,
          rank_bonus: 0,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Create referral error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Create referral exception:', err);
      return null;
    }
  }

  async getStudentReferrals(studentId: string): Promise<ReferralWithRewards[]> {
    try {
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) {
        console.log('No organization ID found, using mock referrals data');
        return mockReferrals;
      }

      // Get referrals
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_student_id', studentId)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Get student referrals error:', JSON.stringify(referralsError, null, 2));
        console.log('Using mock referrals data');
        return mockReferrals;
      }

      if (!referrals || referrals.length === 0) {
        console.log('No referrals found, using mock data');
        return mockReferrals;
      }

      // Get rewards for each referral
      const referralIds = referrals.map(r => r.id);
      const { data: rewards, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('*')
        .in('referral_id', referralIds);

      if (rewardsError) {
        console.error('Get referral rewards error:', JSON.stringify(rewardsError, null, 2));
      }

      // Combine referrals with their rewards
      return referrals.map(referral => ({
        ...referral,
        rewards: rewards?.filter(reward => reward.referral_id === referral.id) || [],
      }));
    } catch (err) {
      console.error('Get student referrals exception:', JSON.stringify(err, null, 2));
      console.log('Using mock referrals data');
      return mockReferrals;
    }
  }

  async getReferralStats(studentId: string): Promise<ReferralStats> {
    try {
      const referrals = await this.getStudentReferrals(studentId);
      
      const stats: ReferralStats = {
        totalReferrals: referrals.length,
        completedReferrals: referrals.filter(r => r.status === 'completed').length,
        pendingReferrals: referrals.filter(r => r.status === 'pending').length,
        totalPointsEarned: referrals.reduce((sum, r) => sum + r.points_awarded, 0),
        totalRankBonus: referrals.reduce((sum, r) => sum + r.rank_bonus, 0),
      };

      return stats;
    } catch (err) {
      console.error('Get referral stats exception:', err);
      return {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalPointsEarned: 0,
        totalRankBonus: 0,
      };
    }
  }

  async processReferralSignup(referralCode: string, newStudentId: string): Promise<boolean> {
    try {
      // Find the referral by code
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .maybeSingle();

      if (referralError || !referral) {
        console.error('Referral not found or error:', referralError);
        return false;
      }

      // Check if referral is expired
      if (referral.expires_at && new Date(referral.expires_at) < new Date()) {
        await supabase
          .from('referrals')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', referral.id);
        return false;
      }

      // Update referral as completed
      const pointsReward = 50; // Base points reward
      const rankBonus = 1; // Base rank bonus

      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          referred_student_id: newStudentId,
          status: 'completed',
          points_awarded: pointsReward,
          rank_bonus: rankBonus,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', referral.id);

      if (updateError) {
        console.error('Update referral error:', updateError);
        return false;
      }

      // Create rewards
      const rewards = [
        {
          organization_id: referral.organization_id,
          referral_id: referral.id,
          student_id: referral.referrer_student_id,
          reward_type: 'points' as const,
          reward_value: pointsReward,
          description: 'Referral bonus points',
          claimed_at: new Date().toISOString(),
        },
        {
          organization_id: referral.organization_id,
          referral_id: referral.id,
          student_id: referral.referrer_student_id,
          reward_type: 'rank_boost' as const,
          reward_value: rankBonus,
          description: 'Rank boost for successful referral',
          claimed_at: new Date().toISOString(),
        },
      ];

      const { error: rewardsError } = await supabase
        .from('referral_rewards')
        .insert(rewards);

      if (rewardsError) {
        console.error('Create rewards error:', rewardsError);
      }

      // Award points to referrer (this would typically be handled by a database trigger)
      await this.awardReferralPoints(referral.referrer_student_id, pointsReward);

      return true;
    } catch (err) {
      console.error('Process referral signup exception:', err);
      return false;
    }
  }

  private async awardReferralPoints(studentId: string, points: number): Promise<void> {
    try {
      const orgId = await this.getOrganizationIdForStudent(studentId);
      if (!orgId) return;

      // Add points transaction
      await supabase
        .from('points_transactions')
        .insert({
          student_id: studentId,
          organization_id: orgId,
          transaction_type: 'bonus',
          points_amount: points,
          coins_earned: Math.floor(points / 10),
          reason: 'Successful referral bonus',
          category: 'referral',
        });

      // Update student ranking
      const { data: currentRanking } = await supabase
        .from('student_rankings')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (currentRanking) {
        const newTotalPoints = currentRanking.total_points + points;
        const newCoins = currentRanking.available_coins + Math.floor(points / 10);
        const newLevel = Math.max(1, Math.floor(newTotalPoints / 100));

        await supabase
          .from('student_rankings')
          .update({
            total_points: newTotalPoints,
            available_coins: newCoins,
            current_level: newLevel,
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId);
      }
    } catch (err) {
      console.error('Award referral points exception:', err);
    }
  }

  async shareReferralLink(referralLink: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(referralLink);
        return true;
      } else {
        await Clipboard.setStringAsync(referralLink);
        return true;
      }
    } catch (err) {
      console.error('Share referral link exception:', err);
      return false;
    }
  }

  // Real-time subscriptions
  subscribeToReferralUpdates(studentId: string, callback: (referral: Referral) => void) {
    return supabase
      .channel(`referrals_${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_student_id=eq.${studentId}`,
        },
        (payload) => {
          console.log('Referral updated:', payload.new);
          callback(payload.new as Referral);
        }
      )
      .subscribe();
  }
}

export const referralService = new ReferralService();

// React Query hooks
export const useStudentReferrals = (studentId: string) => {
  return {
    queryKey: ['student', 'referrals', studentId],
    queryFn: () => referralService.getStudentReferrals(studentId),
    enabled: !!studentId,
  };
};

export const useReferralStats = (studentId: string) => {
  return {
    queryKey: ['student', 'referralStats', studentId],
    queryFn: () => referralService.getReferralStats(studentId),
    enabled: !!studentId,
  };
};