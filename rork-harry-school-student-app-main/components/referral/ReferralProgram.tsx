import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { 
  Users, 
  Gift, 
  Copy, 
  Trophy, 
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { referralService, useStudentReferrals, useReferralStats } from '@/lib/referral';

interface ReferralProgramProps {
  studentId: string;
}

export default function ReferralProgram({ studentId }: ReferralProgramProps) {
  const [isCreatingCode, setIsCreatingCode] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Fetch referral data
  const { data: referrals = [], isLoading: referralsLoading } = useQuery(useStudentReferrals(studentId));
  const { data: stats, isLoading: statsLoading } = useQuery(useReferralStats(studentId));

  // Get active referral code
  const activeReferral = referrals.find(r => r.status === 'pending');

  // Create referral code mutation
  const createReferralMutation = useMutation({
    mutationFn: () => referralService.createReferralCode(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'referrals', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'referralStats', studentId] });
    },
    onError: (error) => {
      console.error('Create referral error:', error);
      Alert.alert('Error', 'Failed to create referral code. Please try again.');
    },
  });

  const handleCreateReferralCode = async () => {
    setIsCreatingCode(true);
    try {
      await createReferralMutation.mutateAsync();
    } finally {
      setIsCreatingCode(false);
    }
  };

  const handleShareReferralLink = async (link: string) => {
    try {
      const success = await referralService.shareReferralLink(link);
      if (success) {
        Alert.alert('Success', 'Referral link copied to clipboard!');
      } else {
        Alert.alert('Error', 'Failed to copy referral link.');
      }
    } catch (error) {
      console.error('Share referral link error:', error);
      Alert.alert('Error', 'Failed to share referral link.');
    }
  };

  const InfoSection = () => (
    <Card style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Gift size={24} color={Colors.primary} />
        <Text style={styles.infoTitle}>Referral Program</Text>
      </View>
      
      <Text style={styles.infoDescription}>
        Invite friends to join our learning center and earn amazing rewards!
      </Text>

      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Star size={16} color={Colors.secondary} />
          <Text style={styles.benefitText}>Get 50 points for each successful referral</Text>
        </View>
        <View style={styles.benefitItem}>
          <Trophy size={16} color={Colors.primary} />
          <Text style={styles.benefitText}>+1 rank boost in leaderboard</Text>
        </View>
        <View style={styles.benefitItem}>
          <TrendingUp size={16} color={Colors.success} />
          <Text style={styles.benefitText}>Unlock exclusive achievements</Text>
        </View>
      </View>

      <View style={styles.howItWorks}>
        <Text style={styles.howItWorksTitle}>How it works:</Text>
        <Text style={styles.howItWorksStep}>1. Generate your unique referral link</Text>
        <Text style={styles.howItWorksStep}>2. Share it with friends and family</Text>
        <Text style={styles.howItWorksStep}>3. When they join and enroll, you get rewards!</Text>
      </View>
    </Card>
  );

  const StatsSection = () => {
    if (statsLoading) {
      return (
        <Card style={styles.statsCard}>
          <Text style={styles.loadingText}>Loading stats...</Text>
        </Card>
      );
    }

    if (!stats) return null;

    return (
      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Your Referral Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Users size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + '20' }]}>
              <CheckCircle size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{stats.completedReferrals}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Star size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.statValue}>{stats.totalPointsEarned}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.info + '20' }]}>
              <Trophy size={20} color={Colors.info} />
            </View>
            <Text style={styles.statValue}>+{stats.totalRankBonus}</Text>
            <Text style={styles.statLabel}>Rank Boost</Text>
          </View>
        </View>
      </Card>
    );
  };

  const ReferralCodeSection = () => {
    if (!activeReferral) {
      return (
        <Card style={styles.codeCard}>
          <Text style={styles.sectionTitle}>Generate Referral Code</Text>
          <Text style={styles.codeDescription}>
            Create your unique referral link to start inviting friends!
          </Text>
          
          <Button
            title={isCreatingCode ? 'Creating...' : 'Generate My Referral Code'}
            onPress={handleCreateReferralCode}
            disabled={isCreatingCode || createReferralMutation.isPending}
            style={styles.generateButton}
          />
        </Card>
      );
    }

    return (
      <Card style={styles.codeCard}>
        <Text style={styles.sectionTitle}>Your Referral Code</Text>
        
        <View style={styles.codeContainer}>
          <Text style={styles.referralCode}>{activeReferral.referral_code}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => handleShareReferralLink(activeReferral.referral_code)}
          >
            <Copy size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.linkContainer}>
          <Text style={styles.linkLabel}>Referral Link:</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleShareReferralLink(activeReferral.referral_link)}
          >
            <Text style={styles.linkText} numberOfLines={1}>
              {activeReferral.referral_link}
            </Text>
            <ExternalLink size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Button
          title="Share Referral Link"
          onPress={() => handleShareReferralLink(activeReferral.referral_link)}
          style={styles.shareButton}
        />

        {activeReferral.expires_at && (
          <View style={styles.expirationInfo}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.expirationText}>
              Expires: {new Date(activeReferral.expires_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const ReferralHistorySection = () => {
    if (referralsLoading) {
      return (
        <Card style={styles.historyCard}>
          <Text style={styles.loadingText}>Loading referral history...</Text>
        </Card>
      );
    }

    if (!referrals || referrals.length === 0) {
      return null;
    }

    return (
      <Card style={styles.historyCard}>
        <Text style={styles.sectionTitle}>Referral History</Text>
        
        <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
          {referrals.map((referral) => (
            <View key={referral.id} style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyCode}>{referral.referral_code}</Text>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: referral.status === 'completed' 
                      ? Colors.success + '20' 
                      : referral.status === 'pending'
                      ? Colors.warning + '20'
                      : Colors.error + '20'
                  }
                ]}>
                  <Text style={[
                    styles.statusText,
                    {
                      color: referral.status === 'completed' 
                        ? Colors.success 
                        : referral.status === 'pending'
                        ? Colors.warning
                        : Colors.error
                    }
                  ]}>
                    {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.historyDate}>
                Created: {new Date(referral.created_at).toLocaleDateString()}
              </Text>
              
              {referral.status === 'completed' && (
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardText}>
                    Earned: {referral.points_awarded} points, +{referral.rank_bonus} rank
                  </Text>
                  {referral.completed_at && (
                    <Text style={styles.completedDate}>
                      Completed: {new Date(referral.completed_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <InfoSection />
      <StatsSection />
      <ReferralCodeSection />
      <ReferralHistorySection />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  infoCard: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  infoDescription: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  benefitsList: {
    gap: 8,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    flex: 1,
  },
  howItWorks: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  howItWorksTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: 8,
  },
  howItWorksStep: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statsCard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  codeCard: {
    padding: 20,
  },
  codeDescription: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  generateButton: {
    marginTop: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  referralCode: {
    flex: 1,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.primary + '20',
  },
  linkContainer: {
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text,
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  linkText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  shareButton: {
    marginBottom: 12,
  },
  expirationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  expirationText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  historyCard: {
    padding: 20,
  },
  historyList: {
    maxHeight: 300,
  },
  historyItem: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyCode: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  historyDate: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  rewardInfo: {
    backgroundColor: Colors.success + '10',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  rewardText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.success,
    marginBottom: 2,
  },
  completedDate: {
    fontSize: FontSizes.xs,
    color: Colors.success,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
});